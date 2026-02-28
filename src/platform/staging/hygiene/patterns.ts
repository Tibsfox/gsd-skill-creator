/**
 * Pattern registry for the hygiene engine.
 *
 * Contains built-in security patterns organized by category and
 * provides an API for adding custom patterns at runtime.
 *
 * @module staging/hygiene/patterns
 */

import type { HygieneCategory, HygienePattern, HygieneFinding } from './types.js';

/**
 * Create the set of built-in hygiene patterns.
 *
 * Patterns are organized across three categories:
 * - embedded-instructions: prompt injection and role manipulation
 * - hidden-content: invisible or obfuscated characters/encoding
 * - config-safety: dangerous config constructs and path traversal
 */
function createBuiltinPatterns(): HygienePattern[] {
  return [
    // ── Category: embedded-instructions ──────────────────────────

    {
      id: 'ignore-previous',
      category: 'embedded-instructions',
      name: 'Ignore Previous Instructions',
      description: 'Detects "ignore previous instructions" prompt injection attempts.',
      severity: 'critical',
      regex: /ignore\s+(all\s+)?previous\s+instructions/i,
    },
    {
      id: 'role-reassignment',
      category: 'embedded-instructions',
      name: 'Role Reassignment',
      description: 'Detects role reassignment attempts like "you are now a...".',
      severity: 'high',
      regex: /you\s+are\s+(now|actually)\s+(a|an|the)\b/i,
    },
    {
      id: 'chat-template-delimiters',
      category: 'embedded-instructions',
      name: 'Chat Template Delimiters',
      description: 'Detects chat template delimiters (OpenAI, Llama, etc.).',
      severity: 'critical',
      regex: /<\|?(system|user|assistant|im_start|im_end)\|?>/i,
    },
    {
      id: 'system-prompt-override',
      category: 'embedded-instructions',
      name: 'System Prompt Override',
      description: 'Detects system prompt injection markers.',
      severity: 'critical',
      regex: /\[SYSTEM\]|<<SYS>>|###\s*System\s*:/i,
    },

    // ── Category: hidden-content ─────────────────────────────────

    {
      id: 'zero-width-characters',
      category: 'hidden-content',
      name: 'Zero-Width Characters',
      description: 'Detects zero-width characters that can hide content.',
      severity: 'high',
      detect: detectZeroWidthCharacters,
    },
    {
      id: 'rtl-override',
      category: 'hidden-content',
      name: 'RTL/LTR Override',
      description: 'Detects RTL/LTR override characters that can visually hide or reorder text.',
      severity: 'high',
      regex: /[\u202A-\u202E\u2066-\u2069]/,
    },
    {
      id: 'suspicious-base64',
      category: 'hidden-content',
      name: 'Suspicious Base64',
      description: 'Detects base64-encoded content in unexpected positions.',
      severity: 'medium',
      detect: detectSuspiciousBase64,
    },

    // ── Category: config-safety ──────────────────────────────────

    {
      id: 'yaml-code-execution',
      category: 'config-safety',
      name: 'YAML Code Execution',
      description: 'Detects YAML code execution tags.',
      severity: 'critical',
      regex: /!!python\/|!!ruby\/|!!js\/|!!perl\//i,
    },
    {
      id: 'yaml-merge-key-bomb',
      category: 'config-safety',
      name: 'YAML Merge Key Bomb',
      description: 'Detects recursive YAML structures (billion-laughs-style).',
      severity: 'high',
      detect: detectYamlMergeKeyBomb,
    },
    {
      id: 'path-traversal',
      category: 'config-safety',
      name: 'Path Traversal',
      description: 'Detects path traversal sequences.',
      severity: 'high',
      regex: /\.\.\//g,
    },
    {
      id: 'env-var-exposure',
      category: 'config-safety',
      name: 'Environment Variable Exposure',
      description: 'Detects environment variable references to sensitive values.',
      severity: 'medium',
      regex: /\$\{?\w*(PASSWORD|SECRET|TOKEN|KEY|CREDENTIAL|API_KEY)\w*\}?/i,
    },
  ];
}

/** Number of built-in patterns. */
export const BUILTIN_PATTERN_COUNT = createBuiltinPatterns().length;

/** Immutable reference copy for reset. */
const _builtinPatterns: HygienePattern[] = createBuiltinPatterns();

/** Mutable registry initialized with built-in patterns. */
let _patterns: HygienePattern[] = createBuiltinPatterns();

/**
 * Return a copy of all registered patterns.
 */
export function getAllPatterns(): HygienePattern[] {
  return [..._patterns];
}

/**
 * Return patterns filtered by category.
 */
export function getPatterns(category: HygieneCategory): HygienePattern[] {
  return _patterns.filter((p) => p.category === category);
}

/**
 * Add a custom pattern to the registry.
 *
 * @throws Error if a pattern with the same id already exists.
 */
export function addPattern(pattern: HygienePattern): void {
  if (_patterns.some((p) => p.id === pattern.id)) {
    throw new Error(`Duplicate pattern id: ${pattern.id}`);
  }
  _patterns.push(pattern);
}

/**
 * Restore the registry to built-in patterns only.
 * Useful for testing and resetting custom patterns.
 */
export function resetPatterns(): void {
  _patterns = [..._builtinPatterns];
}

// ── Detect functions ─────────────────────────────────────────────

/** Zero-width character codepoints to scan for. */
const ZERO_WIDTH_CHARS: Record<string, string> = {
  '\u200B': 'ZWSP (Zero Width Space)',
  '\u200C': 'ZWNJ (Zero Width Non-Joiner)',
  '\u200D': 'ZWJ (Zero Width Joiner)',
  '\uFEFF': 'BOM (Byte Order Mark)',
  '\u00AD': 'Soft Hyphen',
};

/**
 * Scan content for zero-width characters.
 * Returns a finding for each occurrence with its offset.
 */
function detectZeroWidthCharacters(content: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const name = ZERO_WIDTH_CHARS[ch];
    if (name) {
      findings.push({
        patternId: 'zero-width-characters',
        category: 'hidden-content',
        severity: 'high',
        message: `Found ${name} at offset ${i}`,
        offset: i,
        match: ch,
      });
    }
  }
  return findings;
}

/**
 * Detect base64-encoded strings that appear outside of code blocks
 * and data URIs. Minimum 40 characters to avoid false positives.
 */
function detectSuspiciousBase64(content: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];
  // Match base64 strings of 40+ chars
  const base64Re = /[A-Za-z0-9+/]{40,}={0,2}/g;
  let match: RegExpExecArray | null;

  while ((match = base64Re.exec(content)) !== null) {
    const offset = match.index;
    const text = match[0];

    // Skip if inside a markdown code block (``` or indented 4+ spaces)
    if (isInsideCodeBlock(content, offset)) {
      continue;
    }

    // Skip if part of a data URI (data:image/...)
    const preceding = content.slice(Math.max(0, offset - 50), offset);
    if (/data:\w+\/[\w+.-]+;base64,\s*$/i.test(preceding)) {
      continue;
    }

    findings.push({
      patternId: 'suspicious-base64',
      category: 'hidden-content',
      severity: 'medium',
      message: `Suspicious base64 string (${text.length} chars) at offset ${offset}`,
      offset,
      match: text.length > 60 ? text.slice(0, 60) + '...' : text,
    });
  }
  return findings;
}

/**
 * Check if a given offset falls inside a markdown code block.
 * Handles both fenced (```) and indented (4+ spaces) code blocks.
 */
function isInsideCodeBlock(content: string, offset: number): boolean {
  // Check fenced code blocks
  const fenceRe = /```[^\n]*\n[\s\S]*?```/g;
  let fence: RegExpExecArray | null;
  while ((fence = fenceRe.exec(content)) !== null) {
    if (offset >= fence.index && offset < fence.index + fence[0].length) {
      return true;
    }
  }

  // Check indented code blocks (lines starting with 4+ spaces)
  const lines = content.split('\n');
  let currentOffset = 0;
  for (const line of lines) {
    const lineEnd = currentOffset + line.length;
    if (offset >= currentOffset && offset <= lineEnd) {
      if (/^ {4,}/.test(line)) {
        return true;
      }
    }
    currentOffset = lineEnd + 1; // +1 for newline
  }

  return false;
}

/**
 * Count YAML merge key patterns (<<: *). If more than 10 in a
 * single document, flag as potential billion-laughs-style recursion.
 */
function detectYamlMergeKeyBomb(content: string): HygieneFinding[] {
  const mergeKeyRe = /<<:\s*\*/g;
  let count = 0;
  while (mergeKeyRe.exec(content) !== null) {
    count++;
  }

  if (count > 10) {
    return [
      {
        patternId: 'yaml-merge-key-bomb',
        category: 'config-safety',
        severity: 'high',
        message: `Found ${count} YAML merge keys (<<: *) -- potential recursive expansion attack`,
      },
    ];
  }
  return [];
}
