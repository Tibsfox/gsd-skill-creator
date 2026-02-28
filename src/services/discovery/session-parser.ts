/**
 * Streaming JSONL session parser for Claude Code session files.
 *
 * Reads session JSONL files line-by-line using createReadStream + readline
 * without loading the entire file into memory. Routes entries by type,
 * extracts tool_use blocks from nested assistant content arrays, and skips
 * noise entries (progress, file-history-snapshot, etc.) without deep parsing.
 *
 * All user entries are extracted with their text content. The multi-layer
 * noise classification (SCAN-09) is provided separately by the
 * user-prompt-classifier module. Downstream consumers compose: parse first,
 * then classify.
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import {
  BaseEntrySchema,
  UserEntrySchema,
  AssistantEntrySchema,
} from './types.js';
import type { ParsedEntry, ExtractedToolUse, ExtractedPrompt, ContentBlock } from './types.js';
import { redactSecrets } from './discovery-safety.js';

/**
 * Parse a single JSONL line into a ParsedEntry.
 *
 * Routes by entry type:
 * - 'user': extracts prompt text, sessionId, timestamp, cwd
 * - 'assistant': extracts tool_use blocks from nested content arrays
 * - noise types (progress, file-history-snapshot, queue-operation, system, summary):
 *   returned as skipped without deep parsing
 * - unknown types: returned as skipped (forward compatible)
 *
 * Returns null for empty lines, invalid JSON, or entries that fail base schema validation.
 */
export function parseJsonlLine(line: string): ParsedEntry | null {
  const trimmed = line.trim();
  if (trimmed === '') return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  const baseResult = BaseEntrySchema.safeParse(parsed);
  if (!baseResult.success) return null;

  const entryType = (baseResult.data as { type: string }).type;

  switch (entryType) {
    case 'user': {
      const userResult = UserEntrySchema.safeParse(parsed);
      if (!userResult.success) return null;

      const entry = userResult.data;
      const content = entry.message.content;
      let text: string;
      if (typeof content === 'string') {
        text = content;
      } else if (Array.isArray(content)) {
        // Join text blocks from content array
        text = content
          .filter((block: ContentBlock) => block.type === 'text')
          .map((block: ContentBlock) => ('text' in block ? block.text : ''))
          .join('\n');
      } else {
        text = '';
      }

      const data: ExtractedPrompt = {
        text: redactSecrets(text),
        sessionId: entry.sessionId,
        timestamp: entry.timestamp,
        cwd: entry.cwd ?? '',
      };

      return { kind: 'user-prompt', data };
    }

    case 'assistant': {
      const assistantResult = AssistantEntrySchema.safeParse(parsed);
      if (!assistantResult.success) return null;

      const entry = assistantResult.data;
      const contentBlocks = entry.message.content;

      const tools: ExtractedToolUse[] = contentBlocks
        .filter((block: ContentBlock) => block.type === 'tool_use')
        .map((block: ContentBlock) => ({
          name: ('name' in block ? block.name : '') as string,
          input: ('input' in block ? block.input : {}) as Record<string, unknown>,
        }));

      return { kind: 'tool-uses', data: tools };
    }

    case 'progress':
    case 'file-history-snapshot':
    case 'queue-operation':
    case 'system':
    case 'summary':
      return { kind: 'skipped', type: entryType };

    default:
      // Unknown type -- skip gracefully for forward compatibility
      return { kind: 'skipped', type: entryType };
  }
}

/**
 * Stream-parse a Claude Code JSONL session file.
 *
 * Yields ParsedEntry objects one at a time via async generator, never
 * accumulating the full file in memory. Suitable for 23MB+ session files.
 *
 * - Empty and blank lines are silently skipped
 * - Corrupted/partial JSON lines are silently skipped (returns null from parseJsonlLine)
 * - Non-existent files produce an empty generator (no throw)
 * - Other I/O errors are re-thrown
 */
export async function* parseSessionFile(filePath: string): AsyncGenerator<ParsedEntry> {
  let fileStream: ReturnType<typeof createReadStream>;
  try {
    fileStream = createReadStream(filePath, { encoding: 'utf8' });
  } catch {
    return; // File cannot be opened
  }

  // Handle ENOENT and other stream errors via a promise that rejects
  let streamError: Error | null = null;
  const errorPromise = new Promise<void>((_, reject) => {
    fileStream.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        streamError = err;
        // Destroy the stream so readline stops
        fileStream.destroy();
      } else {
        reject(err);
      }
    });
  });

  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  try {
    for await (const line of rl) {
      const entry = parseJsonlLine(line);
      if (entry !== null) {
        yield entry;
      }
    }
  } catch (err) {
    // If the error was ENOENT, we silently return empty
    if (streamError && (streamError as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw err;
  } finally {
    // Suppress any unhandled rejection from errorPromise after iteration completes
    // The data was successfully read, so post-iteration stream errors can be ignored
    errorPromise.catch(() => {});
  }
}
