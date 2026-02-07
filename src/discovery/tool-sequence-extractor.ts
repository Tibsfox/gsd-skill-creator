/**
 * Tool sequence n-gram extraction.
 *
 * Extracts bigrams and trigrams from flat tool name sequences derived from
 * parsed Claude Code session entries. Used to identify recurring tool
 * workflows (e.g., Read->Edit->Bash patterns) across sessions.
 *
 * Two pure synchronous functions:
 * - extractNgrams: sliding-window n-gram counting over a string array
 * - buildToolSequence: ParsedEntry[] -> flat tool name string array
 */

import type { ParsedEntry } from './types.js';

/**
 * Extract n-grams from a tool name sequence using a sliding window.
 *
 * @param sequence - Flat array of tool names in order of invocation
 * @param n - Window size (2 = bigrams, 3 = trigrams, etc.)
 * @returns Map from n-gram key (names joined with "->") to occurrence count
 *
 * @example
 * extractNgrams(["Read", "Edit", "Bash"], 2)
 * // => Map { "Read->Edit" => 1, "Edit->Bash" => 1 }
 */
export function extractNgrams(sequence: string[], n: number): Map<string, number> {
  const counts = new Map<string, number>();

  for (let i = 0; i <= sequence.length - n; i++) {
    const key = sequence.slice(i, i + n).join('->');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

/**
 * Build a flat tool name sequence from parsed session entries.
 *
 * Filters to tool-uses entries only, excludes entries with empty data arrays
 * (text-only assistant entries yield empty tool arrays per decision 30-02),
 * and flattens all tool names into a single ordered array.
 *
 * @param entries - Parsed session entries from session parser
 * @returns Flat array of tool names in invocation order
 *
 * @example
 * buildToolSequence([
 *   { kind: 'tool-uses', data: [{ name: 'Read', input: {} }] },
 *   { kind: 'tool-uses', data: [{ name: 'Edit', input: {} }] },
 * ])
 * // => ["Read", "Edit"]
 */
export function buildToolSequence(entries: ParsedEntry[]): string[] {
  return entries
    .filter((entry): entry is Extract<ParsedEntry, { kind: 'tool-uses' }> =>
      entry.kind === 'tool-uses'
    )
    .filter(entry => entry.data.length > 0)
    .flatMap(entry => entry.data.map(tool => tool.name));
}
