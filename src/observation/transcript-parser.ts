import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';
import type { TranscriptEntry } from '../types/observation.js';

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
}

export async function parseTranscript(path: string): Promise<TranscriptEntry[]> {
  const parser = new TranscriptParser();
  return parser.parse(path);
}
