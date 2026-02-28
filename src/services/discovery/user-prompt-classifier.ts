/**
 * Multi-layer user prompt classifier for Claude Code JSONL entries.
 *
 * Separates real user prompts (~3.2% of user entries) from noise:
 * - Layer 1: Meta entries (isMeta: true) — 6%
 * - Layer 2: Tool result arrays (content contains tool_result blocks) — 83%
 * - Layer 3: Command/system messages (<command, <local-command, <system, [Request interrupted) — 8%
 * - Layer 4: Very short entries (< 10 chars after trim)
 *
 * Only entries that pass all 4 layers are classified as real user prompts.
 */

import type { UserEntry, ExtractedPrompt, ContentBlock } from './types.js';

/**
 * Checks if a string looks like a command, system, or otherwise non-prompt message.
 * Also catches very short entries that are not meaningful prompts.
 */
function isCommandOrSystemMessage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 10) return true;
  return (
    trimmed.startsWith('<command') ||
    trimmed.startsWith('<local-command') ||
    trimmed.startsWith('<system') ||
    trimmed.startsWith('[Request interrupted')
  );
}

/**
 * Determines whether a UserEntry represents a real human-typed prompt.
 *
 * Applies 4 classification layers in order:
 * 1. Meta entries (isMeta: true) -> false
 * 2. Array content with tool_result blocks -> false; text-only arrays -> check layer 3
 * 3. Command/system message prefixes -> false
 * 4. Very short content (< 10 chars) -> false
 *
 * @param entry - A UserEntry from the JSONL session log
 * @returns true if this is a real user prompt, false if noise
 */
export function isRealUserPrompt(entry: UserEntry): boolean {
  // Layer 1: Skip meta entries (6% of user entries)
  if (entry.isMeta === true) return false;

  const content = entry.message?.content;
  if (content === undefined || content === null) return false;

  // Layer 2: Array content handling
  if (Array.isArray(content)) {
    // Tool result arrays = noise (83% of user entries)
    const hasToolResult = content.some(
      (b: ContentBlock) => b.type === 'tool_result'
    );
    if (hasToolResult) return false;

    // Extract text from text blocks
    const textBlocks = content.filter((b: ContentBlock) => b.type === 'text');
    if (textBlocks.length === 0) return false;

    const text = textBlocks.map((b: ContentBlock) => 'text' in b ? b.text : '').join('');
    return !isCommandOrSystemMessage(text);
  }

  // Layer 3 + 4: String content — check for commands, system messages, and short entries
  if (typeof content === 'string') {
    return !isCommandOrSystemMessage(content);
  }

  return false;
}

/**
 * Classifies a UserEntry and extracts prompt data if it's a real user prompt.
 *
 * @param entry - A UserEntry from the JSONL session log
 * @returns ExtractedPrompt with text/sessionId/timestamp/cwd if real prompt, null if noise
 */
export function classifyUserEntry(entry: UserEntry): ExtractedPrompt | null {
  if (!isRealUserPrompt(entry)) return null;

  const content = entry.message?.content;
  let text: string;

  if (Array.isArray(content)) {
    const textBlocks = content.filter((b: ContentBlock) => b.type === 'text');
    text = textBlocks.map((b: ContentBlock) => 'text' in b ? b.text : '').join('');
  } else if (typeof content === 'string') {
    text = content;
  } else {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) return null;

  return {
    text: trimmed,
    sessionId: entry.sessionId,
    timestamp: entry.timestamp,
    cwd: entry.cwd ?? '',
  };
}
