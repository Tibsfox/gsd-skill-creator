/**
 * Append-only JSONL audit logger for skill-creator operations.
 *
 * Records every skill/agent mutation through skill-creator with timestamp,
 * operation type, file path, and source identification. Entries are validated
 * on read via Zod schema with .passthrough() for forward compatibility.
 *
 * Implements ACL-02: Log all modifications with timestamps and source identification.
 */

import { z } from 'zod';
import { readFile, appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

// ============================================================================
// Zod Schemas
// ============================================================================

/** Valid audit operations */
export const AuditOperationSchema = z.enum([
  'create',
  'update',
  'delete',
  'migrate',
  'refine',
  'rollback',
]);

/** Schema for a single audit log entry (passthrough for forward compat) */
export const AuditEntrySchema = z.object({
  timestamp: z.string(),
  operation: AuditOperationSchema,
  filePath: z.string(),
  source: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

// ============================================================================
// TypeScript Types
// ============================================================================

export type AuditOperation = z.infer<typeof AuditOperationSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export interface GetEntriesOptions {
  since?: string;
  operation?: AuditOperation;
}

// ============================================================================
// AuditLogger
// ============================================================================

/**
 * Append-only JSONL logger for skill-creator operations.
 *
 * Follows the FeedbackStore JSONL append pattern: serialize writes to prevent
 * interleaving, create parent directories on first write.
 */
export class AuditLogger {
  private readonly logPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(logPath: string = '.claude/.audit-log.jsonl') {
    this.logPath = logPath;
  }

  /**
   * Append an entry with auto-generated ISO timestamp.
   *
   * Creates parent directory if needed. Appends a single JSON line
   * terminated by newline. Serializes writes to prevent interleaving.
   */
  async log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
    const fullEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    } as AuditEntry;

    await this.appendLine(fullEntry);
  }

  /**
   * Read and parse the log file.
   *
   * Filters by timestamp (since) and/or operation. Skips malformed lines
   * (logs warning but does not throw). Validates each entry via Zod schema.
   *
   * @returns Validated entries matching the filter criteria
   */
  async getEntries(options?: GetEntriesOptions): Promise<AuditEntry[]> {
    let content: string;
    try {
      content = await readFile(this.logPath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }

    const entries: AuditEntry[] = [];

    for (const line of content.split('\n')) {
      if (!line.trim()) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        // Skip malformed JSON lines
        console.warn('Skipping malformed line in audit log');
        continue;
      }

      const result = AuditEntrySchema.safeParse(parsed);
      if (!result.success) {
        // Skip entries failing Zod validation (missing required fields)
        console.warn('Skipping invalid audit log entry');
        continue;
      }

      const entry = result.data;

      // Apply timestamp filter
      if (options?.since && entry.timestamp < options.since) {
        continue;
      }

      // Apply operation filter
      if (options?.operation && entry.operation !== options.operation) {
        continue;
      }

      entries.push(entry);
    }

    return entries;
  }

  /**
   * Convenience: get entries since Date.now() - windowMs.
   */
  async getRecentEntries(windowMs: number): Promise<AuditEntry[]> {
    const since = new Date(Date.now() - windowMs).toISOString();
    return this.getEntries({ since });
  }

  /**
   * Ensure the parent directory exists.
   */
  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.logPath), { recursive: true });
  }

  /**
   * Append a single entry to the JSONL file with write serialization.
   */
  private async appendLine(entry: AuditEntry): Promise<void> {
    await this.ensureDir();

    // Serialize writes to prevent interleaving
    this.writeQueue = this.writeQueue.then(async () => {
      const line = JSON.stringify(entry) + '\n';
      await appendFile(this.logPath, line, 'utf-8');
    });

    await this.writeQueue;
  }
}
