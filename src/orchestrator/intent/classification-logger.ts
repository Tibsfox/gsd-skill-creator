// ============================================================================
// Classification Logger
// ============================================================================
// Structured JSONL logger for intent classification audit trail.
// Records every classification result with confidence score, selected
// command, method, and timestamp. Errors during logging are swallowed
// to prevent logger issues from crashing the orchestrator.

import { appendFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ClassificationResult } from './types.js';

/**
 * Structured log entry for a single classification event.
 */
export interface ClassificationLogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Raw user input */
  input: string;
  /** Selected command name or null */
  command: string | null;
  /** Classification result type */
  type: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Classification method used */
  method?: string;
  /** Current project lifecycle stage */
  lifecycleStage: string | null;
  /** Number of alternative candidates considered */
  alternativeCount: number;
}

/**
 * Append-only JSONL logger for intent classification audit trail.
 *
 * Every call to `log()` appends one line to `classification-log.jsonl`
 * in the configured directory. Errors are caught and logged to stderr
 * to prevent logger issues from crashing the process.
 *
 * @example
 * ```ts
 * const logger = new ClassificationLogger('.planning/patterns');
 * await logger.log(classificationResult, 'plan phase 3');
 * const entries = await logger.readAll();
 * ```
 */
export class ClassificationLogger {
  private logDir: string;
  private logFile: string;

  constructor(logDir: string) {
    this.logDir = logDir;
    this.logFile = join(logDir, 'classification-log.jsonl');
  }

  /**
   * Append a classification result to the audit log.
   *
   * Builds a ClassificationLogEntry from the result and input,
   * serializes to JSON, and appends as a single JSONL line.
   * On error, logs to stderr and returns without throwing.
   *
   * @param result - Classification pipeline output
   * @param input - Raw user input string
   */
  async log(result: ClassificationResult, input: string): Promise<void> {
    try {
      const entry: ClassificationLogEntry = {
        timestamp: new Date().toISOString(),
        input,
        command: result.command?.name ?? null,
        type: result.type,
        confidence: result.confidence,
        method: result.method,
        lifecycleStage: result.lifecycleStage,
        alternativeCount: result.alternatives.length,
      };

      await mkdir(this.logDir, { recursive: true });
      await appendFile(this.logFile, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[classification-logger] Failed to log: ${message}\n`,
      );
    }
  }

  /**
   * Read all classification log entries from the audit file.
   *
   * Parses each JSONL line, skipping malformed or empty lines.
   * Returns an empty array if the file does not exist.
   *
   * @returns Array of valid ClassificationLogEntry objects
   */
  async readAll(): Promise<ClassificationLogEntry[]> {
    try {
      const content = await readFile(this.logFile, 'utf-8');
      const entries: ClassificationLogEntry[] = [];

      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          entries.push(JSON.parse(trimmed) as ClassificationLogEntry);
        } catch {
          // Skip malformed lines
        }
      }

      return entries;
    } catch (err: unknown) {
      // File doesn't exist or read error -- return empty
      return [];
    }
  }
}
