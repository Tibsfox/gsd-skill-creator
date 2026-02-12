/**
 * Team message safety utilities.
 *
 * Provides sanitization and truncation for inter-agent inbox messages:
 * - sanitizeMessageText: detects and neutralizes prompt injection patterns
 * - truncateMessageText: enforces content-length limits with warning markers
 * - sanitizeInboxMessage: combines both for InboxMessage objects
 *
 * Closes VAL-05 (prompt injection sanitization) and VAL-06 (content-length limits).
 */

import type { InboxMessage } from '../types/team.js';

// ============================================================================
// Constants
// ============================================================================

/** Default maximum message length in characters. */
export const DEFAULT_MAX_MESSAGE_LENGTH = 10_000;

// ============================================================================
// Types
// ============================================================================

/**
 * Result of sanitizing message text.
 */
export interface MessageSanitizeResult {
  /** Sanitized text (injection patterns neutralized). */
  text: string;
  /** true if any patterns were found and neutralized. */
  sanitized: boolean;
  /** Deduplicated names of detected pattern categories. */
  patternsFound: string[];
}

/**
 * An injection pattern entry for detection.
 */
export interface InjectionPatternEntry {
  /** Category name (e.g., 'role-override'). */
  name: string;
  /** Regex to match the injection pattern. */
  pattern: RegExp;
}

// ============================================================================
// Injection Patterns
// ============================================================================

/**
 * Prompt injection patterns to detect and neutralize.
 *
 * Each entry has a category name and a regex. The regex must use the 'gi'
 * flags (global + case-insensitive) or 'gim' (+ multiline) as appropriate.
 *
 * Exported for testability and extensibility.
 */
export const INJECTION_PATTERNS: readonly InjectionPatternEntry[] = [
  // ── Role override patterns ──────────────────────────────────────────────
  { name: 'role-override', pattern: /<\|(?:system|assistant|user|im_start)\|>/gi },
  { name: 'role-override', pattern: /\[(?:SYSTEM|INST)\]/gi },
  { name: 'role-override', pattern: /<<\/?SYS>>/gi },
  { name: 'role-override', pattern: /^(?:system|assistant):/gim },

  // ── Instruction hijacking patterns ──────────────────────────────────────
  { name: 'instruction-hijack', pattern: /ignore\s+(?:all\s+)?previous\s+instructions/gi },
  { name: 'instruction-hijack', pattern: /disregard\s+(?:all\s+)?prior\s+instructions/gi },
  { name: 'instruction-hijack', pattern: /forget\s+everything\s+above/gi },
  { name: 'instruction-hijack', pattern: /new\s+instructions\s*:/gi },
  { name: 'instruction-hijack', pattern: /you\s+are\s+now\b/gi },
  { name: 'instruction-hijack', pattern: /^act\s+as\s+(?:a\s+|an\s+|my\s+)?(?!(?:a\s+)?team\b)(?!(?:a\s+)?group\b)\w/gim },
  { name: 'instruction-hijack', pattern: /#{2,3}\s*(?:system\s+prompt|system\s+instructions)/gi },

  // ── System prompt extraction patterns ───────────────────────────────────
  { name: 'prompt-extraction', pattern: /(?:repeat|show|print|output|display)\s+(?:me\s+)?(?:your\s+)?(?:system\s+|initial\s+)?(?:prompt|instructions)/gi },
  { name: 'prompt-extraction', pattern: /what\s+are\s+your\s+(?:system\s+)?instructions/gi },
] as const;

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Find code fence regions (triple-backtick blocks) in text.
 * Returns array of [start, end] index pairs.
 */
function findCodeFenceRegions(text: string): Array<[number, number]> {
  const regions: Array<[number, number]> = [];
  const fenceRegex = /```[\s\S]*?```/g;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(text)) !== null) {
    regions.push([match.index, match.index + match[0].length]);
  }
  return regions;
}

/**
 * Check if a position falls within any code fence region.
 */
function isInsideCodeFence(position: number, regions: Array<[number, number]>): boolean {
  return regions.some(([start, end]) => position >= start && position < end);
}

/**
 * Create a fresh regex from a pattern (resets lastIndex for global regexes).
 */
function freshRegex(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags);
}

// ============================================================================
// sanitizeMessageText
// ============================================================================

/**
 * Scan message text for prompt injection patterns and neutralize them.
 *
 * Detected patterns are replaced with `[BLOCKED:{category}]` markers.
 * Content inside code fences (triple backticks) is excluded from scanning.
 *
 * @param text - The message text to sanitize
 * @returns Sanitization result with cleaned text, flag, and pattern names
 */
export function sanitizeMessageText(text: string): MessageSanitizeResult {
  if (text === '') {
    return { text: '', sanitized: false, patternsFound: [] };
  }

  const codeFenceRegions = findCodeFenceRegions(text);
  const foundPatterns = new Set<string>();
  let sanitizedText = text;

  for (const entry of INJECTION_PATTERNS) {
    const regex = freshRegex(entry.pattern);

    // Check for matches outside code fences
    const matches: Array<{ index: number; length: number; match: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (!isInsideCodeFence(m.index, codeFenceRegions)) {
        matches.push({ index: m.index, length: m[0].length, match: m[0] });
      }
    }

    if (matches.length > 0) {
      foundPatterns.add(entry.name);

      // Apply replacements using a fresh regex on the (potentially already modified) text
      // We use a replacement function that checks code fence positions in the ORIGINAL text
      const replaceRegex = freshRegex(entry.pattern);
      let offset = 0;

      // Build the sanitized text by processing matches in order
      // We need to track how replacements shift positions, so use a different approach:
      // Replace on the current sanitized text, but skip code fences based on original positions
      sanitizedText = replaceWithCodeFenceExclusion(
        sanitizedText,
        entry.pattern,
        entry.name,
        codeFenceRegions,
      );
    }
  }

  const patternsFound = [...foundPatterns];

  return {
    text: sanitizedText,
    sanitized: patternsFound.length > 0,
    patternsFound,
  };
}

/**
 * Replace injection patterns in text while preserving code fence content.
 *
 * Strategy: extract code fences, replace in remaining text, reassemble.
 */
function replaceWithCodeFenceExclusion(
  text: string,
  pattern: RegExp,
  name: string,
  originalCodeFences: Array<[number, number]>,
): string {
  if (originalCodeFences.length === 0) {
    // No code fences -- simple global replace
    const regex = freshRegex(pattern);
    return text.replace(regex, `[BLOCKED:${name}]`);
  }

  // Strategy: split text into code-fence and non-code-fence segments,
  // apply replacement only to non-code-fence segments, reassemble.
  // We need to find code fences in the CURRENT text (which may have shifted).
  const currentFences = findCodeFenceRegions(text);

  const segments: Array<{ content: string; isCodeFence: boolean }> = [];
  let lastEnd = 0;

  for (const [start, end] of currentFences) {
    if (start > lastEnd) {
      segments.push({ content: text.slice(lastEnd, start), isCodeFence: false });
    }
    segments.push({ content: text.slice(start, end), isCodeFence: true });
    lastEnd = end;
  }

  if (lastEnd < text.length) {
    segments.push({ content: text.slice(lastEnd), isCodeFence: false });
  }

  // If no segments were created (no code fences found in current text), treat all as non-fence
  if (segments.length === 0) {
    segments.push({ content: text, isCodeFence: false });
  }

  // Apply replacement only to non-code-fence segments
  return segments
    .map((seg) => {
      if (seg.isCodeFence) return seg.content;
      const regex = freshRegex(pattern);
      return seg.content.replace(regex, `[BLOCKED:${name}]`);
    })
    .join('');
}

// ============================================================================
// truncateMessageText
// ============================================================================

/**
 * Truncate message text exceeding the maximum length.
 *
 * If text exceeds maxLength, it is truncated and a warning marker is appended.
 * The warning marker is informational and not counted against the content budget.
 *
 * @param text - The message text to potentially truncate
 * @param maxLength - Maximum content length (default: DEFAULT_MAX_MESSAGE_LENGTH)
 * @returns Object with truncated text and truncation flag
 */
export function truncateMessageText(
  text: string,
  maxLength: number = DEFAULT_MAX_MESSAGE_LENGTH,
): { text: string; truncated: boolean } {
  if (text.length <= maxLength) {
    return { text, truncated: false };
  }

  const originalLength = text.length;
  const truncated = text.slice(0, maxLength);
  const marker = `\n\n[MESSAGE TRUNCATED: original length was ${originalLength} chars, limit is ${maxLength}]`;

  return {
    text: truncated + marker,
    truncated: true,
  };
}

// ============================================================================
// sanitizeInboxMessage
// ============================================================================

/**
 * Sanitize a complete InboxMessage: apply injection pattern neutralization
 * followed by content-length truncation.
 *
 * Returns a new message object (does not mutate the input) and an array
 * of warning strings describing any issues found.
 *
 * @param message - The InboxMessage to sanitize
 * @returns Object with sanitized message and warnings array
 */
export function sanitizeInboxMessage(message: InboxMessage): {
  message: InboxMessage;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Step 1: Sanitize injection patterns
  const sanitizeResult = sanitizeMessageText(message.text);
  if (sanitizeResult.sanitized) {
    warnings.push(
      `Message from ${message.from} contained prompt injection patterns: ${sanitizeResult.patternsFound.join(', ')}`,
    );
  }

  // Step 2: Truncate if needed
  const truncateResult = truncateMessageText(sanitizeResult.text);
  if (truncateResult.truncated) {
    warnings.push(
      `Message from ${message.from} truncated from ${message.text.length} to ${DEFAULT_MAX_MESSAGE_LENGTH} chars`,
    );
  }

  // Build new message (immutable -- spread preserves extra fields)
  const sanitizedMessage: InboxMessage = {
    ...message,
    text: truncateResult.text,
  };

  return { message: sanitizedMessage, warnings };
}
