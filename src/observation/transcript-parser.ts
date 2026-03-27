import { createReadStream, existsSync } from 'fs';
import { createHash } from 'crypto';
import { createInterface } from 'readline';
import type { TranscriptEntry, ToolExecutionPair, ExecutionContext } from '../types/observation.js';

export class TranscriptParser {
  /**
   * Parse JSONL transcript file, streaming line by line
   * Filters out sidechain entries (subagents from Task tool)
   * Skips corrupted lines gracefully
   */
  async parse(transcriptPath: string): Promise<TranscriptEntry[]> {
    if (!existsSync(transcriptPath)) {
      return [];
    }

    const entries: TranscriptEntry[] = [];

    const fileStream = createReadStream(transcriptPath, { encoding: 'utf8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as TranscriptEntry;

        // Filter out sidechain entries (subagents from Task tool)
        if (entry.isSidechain === true) {
          continue;
        }

        entries.push(entry);
      } catch {
        // Skip corrupted lines gracefully
        continue;
      }
    }

    return entries;
  }

  /**
   * Parse JSONL from string content (useful for testing)
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
   * Extract tool usage entries only
   */
  filterToolUse(entries: TranscriptEntry[]): TranscriptEntry[] {
    return entries.filter(e => e.type === 'tool_use');
  }

  /**
   * Get unique file paths from Read/Write/Edit tool calls
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
   * Get command patterns from Bash tool calls
   */
  extractCommands(entries: TranscriptEntry[]): string[] {
    const commands = new Set<string>();

    for (const entry of entries) {
      if (entry.type !== 'tool_use') continue;
      if (entry.tool_name !== 'Bash') continue;

      const command = entry.tool_input?.command;
      if (!command) continue;

      // Extract first word of the command
      const firstWord = command.trim().split(/\s+/)[0];
      if (firstWord) {
        commands.add(firstWord);
      }
    }

    return Array.from(commands);
  }

  /**
   * Get tool usage counts
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
   * Get top N items sorted by frequency
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
        // Try to match by tool_use_id first
        let matchedUse: TranscriptEntry | undefined;

        if (entry.tool_use_id && pendingToolUses.has(entry.tool_use_id)) {
          matchedUse = pendingToolUses.get(entry.tool_use_id);
          pendingToolUses.delete(entry.tool_use_id);
        } else {
          // Fall back to most recent unmatched tool_use (sequential pairing)
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

    // Remaining unmatched tool_use entries become partial pairs
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
   * Compute SHA-256 hex digest of content string
   */
  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}

export async function parseTranscript(path: string): Promise<TranscriptEntry[]> {
  const parser = new TranscriptParser();
  return parser.parse(path);
}
