/**
 * transcript-parser.ts — Signal Intake: Session Transcript Processing
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * TranscriptParser reads Claude Code session transcript files (JSONL format)
 * and extracts structured data: tool calls, file paths, commands, and paired
 * tool-use/tool-result sequences. It is the entry point for all observation
 * that starts from a completed session's transcript.
 *
 * WHY IT EXISTS
 * -------------
 * Claude Code writes a JSONL transcript of every session: each line is one event
 * (user message, assistant message, tool use, tool result). To learn from a session,
 * the observation system must read and parse this transcript into structured data.
 *
 * TranscriptParser is the conversion layer: raw JSONL → typed TranscriptEntry[].
 * All higher-level analysis (PatternSummarizer, ExecutionCapture) starts from
 * the output of this parser.
 *
 * SIDECHAIN FILTERING
 * -------------------
 * Claude Code uses the Task tool to spawn subagent conversations. These generate
 * transcript entries marked with isSidechain: true. TranscriptParser filters these
 * out by default — the main session's patterns are what matter for observation,
 * not the subagent conversations that it spawned.
 *
 * This filtering is intentional, not accidental. Sidechain entries would skew
 * pattern analysis by mixing parent-session and subagent-session behaviors.
 *
 * STREAMING ARCHITECTURE
 * ----------------------
 * parse() uses createReadStream + readline to process transcripts line-by-line
 * without loading the entire file into memory. This matters for long sessions:
 * a 2-hour session can generate thousands of transcript lines.
 *
 * parseString() is the in-memory equivalent for tests — same filtering logic,
 * but accepts a string instead of a file path.
 *
 * TOOL EXECUTION PAIRING
 * ----------------------
 * pairToolExecutions() matches tool_use entries with their tool_result counterparts.
 * This is the most complex method in this file.
 *
 * Matching strategy (two-pass):
 *   1. By tool_use_id: tool_result entries can reference their matching tool_use
 *      by UUID. This is the preferred matching strategy when IDs are present.
 *   2. Sequential fallback: if no ID match, pair with the most recent unmatched
 *      tool_use. This handles older transcript formats without tool_use_id.
 *
 * Unmatched tool_use entries (no corresponding tool_result) become partial pairs
 * with null output/outputHash. This happens when a session was interrupted before
 * a tool completed, or when transcript capture was incomplete.
 *
 * Partial pairs are preserved, not dropped — they represent real work that was
 * attempted even if the result was not captured. ExecutionCapture stores them
 * separately and marks them as 'partial' status.
 *
 * SHA-256 HASHING
 * ---------------
 * hashContent() computes SHA-256 of tool output strings. This enables
 * DeterminismAnalyzer to compare output consistency across sessions without
 * storing full output verbatim. The hash algorithm is consistent with
 * FeedbackBridge and DriftMonitor for cross-module comparability.
 *
 * EXTRACTION HELPERS
 * ------------------
 * filterToolUse(), extractFilePaths(), extractCommands(), extractToolCounts()
 * are utility methods that slice the entry array into different views.
 * PatternSummarizer uses all of these to build session summaries efficiently.
 *
 * extractFilePaths() distinguishes reads from writes:
 *   Read tool → read set, Write/Edit tools → written set
 * This enables the observation system to distinguish "read for context" from
 * "modified by work" — a meaningful distinction for pattern analysis.
 *
 * extractCommands() captures only the first word of each Bash command.
 * This is intentional: "git commit -m '...'" → "git". The specific arguments
 * are noise for pattern detection; the command family is signal.
 *
 * DESIGN PHILOSOPHY
 * -----------------
 * TranscriptParser embodies Lex's principle: "Read. Understand. Then build."
 * It reads every line of the transcript carefully, validates each entry,
 * and skips corrupted lines gracefully rather than failing hard.
 *
 * From CENTERCAMP-PERSONAL-JOURNAL, "Lex: Clarity First, Always":
 * "Take 30 minutes to understand. It prevents 2 hours of debugging."
 * This parser reflects that patience — it handles edge cases (sidechain entries,
 * corrupted lines, missing IDs) quietly rather than propagating errors upward.
 *
 * @see PatternSummarizer (pattern-summarizer.ts) — primary consumer of this parser
 * @see ExecutionCapture (execution-capture.ts) — uses pairToolExecutions() for
 *   tool execution capture pipeline
 * @see SessionObserver (session-observer.ts) — orchestrates parser + summarizer
 *   in the session lifecycle
 */

import { createReadStream, existsSync } from 'fs';
import { createHash } from 'crypto';
import { createInterface } from 'readline';
import type { TranscriptEntry, ToolExecutionPair, ExecutionContext } from '../../core/types/observation.js';

/**
 * Parses Claude Code session transcripts into structured observation data.
 *
 * This class is stateless — each parse() call is independent. Safe to use
 * as a singleton (PatternSummarizer holds one instance) or instantiated per parse.
 *
 * Key behaviors:
 * - Filters sidechain entries (isSidechain: true) — subagent traffic excluded
 * - Handles missing files gracefully (returns [])
 * - Skips corrupted lines without failing
 * - Supports both file (streaming) and string (in-memory) input
 */
export class TranscriptParser {
  /**
   * Parse JSONL transcript file, streaming line by line.
   * Filters out sidechain entries (subagents from Task tool).
   * Skips corrupted lines gracefully.
   *
   * Returns [] if the transcript file does not exist. This is not an error —
   * new sessions start with no transcript, and the SessionObserver handles
   * empty results by returning null (no observation to store).
   */
  async parse(transcriptPath: string): Promise<TranscriptEntry[]> {
    if (!existsSync(transcriptPath)) {
      return [];
    }

    const entries: TranscriptEntry[] = [];

    // Streaming read: handles large transcripts without memory pressure
    const fileStream = createReadStream(transcriptPath, { encoding: 'utf8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as TranscriptEntry;

        // Filter out sidechain entries (subagents from Task tool).
        // Sidechain entries represent spawned agent conversations — their
        // tool calls are tracked separately in the subagent context.
        if (entry.isSidechain === true) {
          continue;
        }

        entries.push(entry);
      } catch {
        // Skip corrupted lines gracefully — one bad line should not abort parsing
        continue;
      }
    }

    return entries;
  }

  /**
   * Parse JSONL from string content (useful for testing).
   * Applies same filtering as parse() — sidechain entries excluded.
   */
  parseString(content: string): TranscriptEntry[] {
    const entries: TranscriptEntry[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as TranscriptEntry;

        if (entry.isSidechain === true) {
          continue;
        }

        entries.push(entry);
      } catch {
        continue;
      }
    }

    return entries;
  }

  /**
   * Extract tool usage entries only.
   * Filters to type === 'tool_use', which represents Claude invoking a tool.
   * Used by PatternSummarizer to count tool calls and compute tool frequency.
   */
  filterToolUse(entries: TranscriptEntry[]): TranscriptEntry[] {
    return entries.filter(e => e.type === 'tool_use');
  }

  /**
   * Get unique file paths from Read/Write/Edit tool calls.
   * Distinguishes read files from written files for pattern analysis.
   *
   * Reads: files opened for context (may not be modified)
   * Written: files explicitly modified by the session (stronger signal)
   *
   * The file_path || path fallback handles both older and newer tool input formats.
   */
  extractFilePaths(entries: TranscriptEntry[]): { read: string[], written: string[] } {
    const readFiles = new Set<string>();
    const writtenFiles = new Set<string>();

    for (const entry of entries) {
      if (entry.type !== 'tool_use') continue;

      const filePath = entry.tool_input?.file_path || entry.tool_input?.path;
      if (!filePath) continue;

      if (entry.tool_name === 'Read') {
        readFiles.add(filePath);
      } else if (entry.tool_name === 'Write' || entry.tool_name === 'Edit') {
        writtenFiles.add(filePath);
      }
    }

    return {
      read: Array.from(readFiles),
      written: Array.from(writtenFiles),
    };
  }

  /**
   * Get command patterns from Bash tool calls.
   * Captures only the first word (command family) — arguments are noise.
   * Example: "git commit -m '...'" → "git"
   *
   * Using command families rather than full commands gives stable patterns:
   * "git" always means git operations regardless of subcommand variation.
   */
  extractCommands(entries: TranscriptEntry[]): string[] {
    const commands = new Set<string>();

    for (const entry of entries) {
      if (entry.type !== 'tool_use') continue;
      if (entry.tool_name !== 'Bash') continue;

      const command = entry.tool_input?.command;
      if (!command) continue;

      // Extract first word of the command — the command family, not the full command
      const firstWord = command.trim().split(/\s+/)[0];
      if (firstWord) {
        commands.add(firstWord);
      }
    }

    return Array.from(commands);
  }

  /**
   * Get tool usage counts as a frequency map.
   * Returns Map<toolName, count> for all tool_use entries.
   * Used by PatternSummarizer.topN() to identify the most-used tools in a session.
   */
  extractToolCounts(entries: TranscriptEntry[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const entry of entries) {
      if (entry.type !== 'tool_use') continue;
      if (!entry.tool_name) continue;

      const current = counts.get(entry.tool_name) || 0;
      counts.set(entry.tool_name, current + 1);
    }

    return counts;
  }

  /**
   * Get top N items sorted by frequency.
   * Generic utility used with command counts, file counts, tool counts.
   */
  getTopN<T>(counts: Map<T, number>, n: number): T[] {
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => key);
  }

  /**
   * Pair tool_use entries with their matching tool_result entries (CAPT-01, CAPT-04).
   *
   * Matching strategy:
   * 1. By tool_use_id on the tool_result referencing a pending tool_use uuid
   * 2. By sequential ordering (most recent unmatched tool_use)
   *
   * Unmatched tool_use entries become partial pairs with null output/outputHash.
   * These represent interrupted or incomplete operations — real work, incomplete capture.
   *
   * The context parameter carries session metadata that is attached to every pair,
   * enabling cross-session analysis by ExecutionCapture and DeterminismAnalyzer.
   */
  pairToolExecutions(entries: TranscriptEntry[], context: ExecutionContext): ToolExecutionPair[] {
    // Track pending tool_use entries by uuid, in insertion order
    const pendingToolUses = new Map<string, TranscriptEntry>();
    const pairs: ToolExecutionPair[] = [];
    const matchedUuids = new Set<string>();

    for (const entry of entries) {
      if (entry.type === 'tool_use') {
        pendingToolUses.set(entry.uuid, entry);
      } else if (entry.type === 'tool_result') {
        // Try to match by tool_use_id first (preferred — explicit reference)
        let matchedUse: TranscriptEntry | undefined;

        if (entry.tool_use_id && pendingToolUses.has(entry.tool_use_id)) {
          matchedUse = pendingToolUses.get(entry.tool_use_id);
          pendingToolUses.delete(entry.tool_use_id);
        } else {
          // Fall back to most recent unmatched tool_use (sequential pairing)
          // This handles older transcript formats without explicit tool_use_id fields
          const pendingKeys = Array.from(pendingToolUses.keys());
          if (pendingKeys.length > 0) {
            const lastKey = pendingKeys[pendingKeys.length - 1];
            matchedUse = pendingToolUses.get(lastKey);
            pendingToolUses.delete(lastKey);
          }
        }

        if (matchedUse) {
          const outputStr = typeof entry.tool_output === 'string'
            ? entry.tool_output
            : JSON.stringify(entry.tool_output);

          pairs.push({
            id: matchedUse.uuid,
            toolName: matchedUse.tool_name || 'unknown',
            input: (matchedUse.tool_input as Record<string, unknown>) || {},
            output: outputStr,
            outputHash: this.hashContent(outputStr),
            status: 'complete',
            timestamp: matchedUse.timestamp,
            context,
          });
          matchedUuids.add(matchedUse.uuid);
        }
      }
    }

    // Remaining unmatched tool_use entries become partial pairs.
    // These represent interrupted operations — captured as evidence of work attempted.
    for (const [, useEntry] of pendingToolUses) {
      pairs.push({
        id: useEntry.uuid,
        toolName: useEntry.tool_name || 'unknown',
        input: (useEntry.tool_input as Record<string, unknown>) || {},
        output: null,
        outputHash: null,
        status: 'partial',
        timestamp: useEntry.timestamp,
        context,
      });
    }

    return pairs;
  }

  /**
   * Compute SHA-256 hex digest of content string.
   * Consistent algorithm used throughout the observation stack for
   * output comparison in DeterminismAnalyzer and DriftMonitor.
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}

/**
 * Convenience function for one-off transcript parsing.
 * Returns TranscriptEntry[] from a file path, with sidechain filtering applied.
 */
export async function parseTranscript(path: string): Promise<TranscriptEntry[]> {
  const parser = new TranscriptParser();
  return parser.parse(path);
}
