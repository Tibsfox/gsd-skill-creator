/**
 * SnapshotManager: generates, stores, and retrieves session snapshots.
 *
 * - generate(): parses a Claude Code transcript, extracts file paths, commands,
 *   tool counts, open questions, and builds a compact narrative snapshot
 * - store(): appends a snapshot wrapped in a Pattern envelope to JSONL file
 * - getLatest(): reads the JSONL file and returns the most recent valid snapshot
 *
 * Snapshots are stored as Pattern-enveloped JSONL entries for RetentionManager
 * compatibility (age-based pruning via top-level timestamp field).
 */

import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { TranscriptParser } from '../../observation/transcript-parser.js';
import {
  SessionSnapshotSchema,
  SNAPSHOT_FILENAME,
  DEFAULT_MAX_SNAPSHOTS,
  DEFAULT_SNAPSHOT_MAX_AGE_DAYS,
} from './types.js';
import type { SessionSnapshot } from './types.js';
import type { TranscriptEntry } from '../../types/observation.js';

export interface SnapshotManagerOptions {
  maxSnapshots?: number;
  maxAgeDays?: number;
}

export class SnapshotManager {
  private parser: TranscriptParser;
  private maxSnapshots: number;
  private maxAgeDays: number;

  constructor(
    private snapshotDir: string,
    private options: SnapshotManagerOptions = {},
  ) {
    this.parser = new TranscriptParser();
    this.maxSnapshots = options.maxSnapshots ?? DEFAULT_MAX_SNAPSHOTS;
    this.maxAgeDays = options.maxAgeDays ?? DEFAULT_SNAPSHOT_MAX_AGE_DAYS;
  }

  /**
   * Generate a SessionSnapshot from a Claude Code transcript file.
   *
   * Returns null for non-existent or empty transcripts.
   */
  async generate(
    transcriptPath: string,
    sessionId: string,
    activeSkills: string[] = [],
    startTime?: number,
  ): Promise<SessionSnapshot | null> {
    const entries = await this.parser.parse(transcriptPath);

    if (entries.length === 0) {
      return null;
    }

    // Extract file paths
    const { read, written } = this.parser.extractFilePaths(entries);

    // Extract commands
    const commands = this.parser.extractCommands(entries);

    // Extract tool counts
    const toolCounts = this.parser.extractToolCounts(entries);

    // Build summary from first substantive user message (>20 chars)
    const summary = this.buildSummary(entries);

    // Build open questions from last 10 user messages
    const openQuestions = this.extractOpenQuestions(entries);

    // Get top tools by frequency
    const topTools = this.parser.getTopN(toolCounts, 5);

    // Get top commands (first 5 unique)
    const topCommands = commands.slice(0, 5);

    // Calculate duration
    const toolCallCount = entries.filter(e => e.type === 'tool_use').length;
    let durationMinutes: number;
    if (startTime !== undefined) {
      durationMinutes = Math.round((Date.now() - startTime) / 60000);
    } else {
      // Estimate from entry count (~30s average per entry)
      durationMinutes = Math.max(0, Math.round((entries.length * 30) / 60));
    }

    const now = Date.now();
    const snapshot: SessionSnapshot = {
      session_id: sessionId,
      timestamp: now,
      saved_at: new Date(now).toISOString(),
      summary,
      active_skills: activeSkills,
      files_modified: written,
      open_questions: openQuestions,
      metrics: {
        duration_minutes: durationMinutes,
        tool_calls: toolCallCount,
        files_read: read.length,
        files_written: written.length,
      },
      top_tools: topTools,
      top_commands: topCommands,
    };

    // Validate through schema
    return SessionSnapshotSchema.parse(snapshot);
  }

  /**
   * Store a snapshot as a Pattern-enveloped JSONL entry.
   *
   * Creates the snapshot directory if it doesn't exist.
   */
  async store(snapshot: SessionSnapshot): Promise<void> {
    await mkdir(this.snapshotDir, { recursive: true });

    const envelope = {
      timestamp: snapshot.timestamp,
      category: 'snapshots' as const,
      data: snapshot,
    };

    const filePath = join(this.snapshotDir, SNAPSHOT_FILENAME);
    await appendFile(filePath, JSON.stringify(envelope) + '\n', 'utf-8');
  }

  /**
   * Retrieve the most recent valid snapshot from the JSONL file.
   *
   * Returns null if the file doesn't exist, is empty, or contains no valid entries.
   */
  async getLatest(): Promise<SessionSnapshot | null> {
    const filePath = join(this.snapshotDir, SNAPSHOT_FILENAME);

    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw e;
    }

    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return null;
    }

    // Parse all valid entries, take the last one
    let lastValid: SessionSnapshot | null = null;

    for (const line of lines) {
      try {
        const envelope = JSON.parse(line);
        const data = envelope?.data;
        if (data) {
          const parsed = SessionSnapshotSchema.safeParse(data);
          if (parsed.success) {
            lastValid = parsed.data;
          }
        }
      } catch {
        // Skip corrupted lines
        continue;
      }
    }

    return lastValid;
  }

  /**
   * Build a summary string from the first substantive user message.
   * A message is "substantive" if its content is longer than 20 characters.
   * The summary is truncated to 200 characters.
   */
  private buildSummary(entries: TranscriptEntry[]): string {
    for (const entry of entries) {
      if (
        (entry.type === 'user' || entry.message?.role === 'user') &&
        entry.message?.content
      ) {
        const content = entry.message.content;
        if (content.length > 20) {
          return content.slice(0, 200);
        }
      }
    }

    // Fallback: count tool calls
    const toolCallCount = entries.filter(e => e.type === 'tool_use').length;
    return `Session with ${toolCallCount} tool calls`;
  }

  /**
   * Extract open questions from the last 10 user messages.
   * A line ending with '?' is considered a question.
   * Deduplicated, limited to 5.
   */
  private extractOpenQuestions(entries: TranscriptEntry[]): string[] {
    const userMessages = entries.filter(
      e => (e.type === 'user' || e.message?.role === 'user') && e.message?.content,
    );

    const last10 = userMessages.slice(-10);
    const questions = new Set<string>();

    for (const entry of last10) {
      const content = entry.message!.content;
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.endsWith('?')) {
          questions.add(trimmed);
        }
      }
    }

    return Array.from(questions).slice(0, 5);
  }
}
