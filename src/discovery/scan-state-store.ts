/**
 * Persistent scan state store for incremental session tracking.
 *
 * Tracks which sessions have been scanned (via fileMtime watermarks),
 * manages a project exclude list, and persists state to disk using
 * atomic writes (write-tmp-then-rename in same directory).
 *
 * Handles first-run (no file), corrupt files, and invalid schemas
 * gracefully by falling back to empty default state.
 *
 * All Zod schemas use .passthrough() for forward compatibility.
 */

import { z } from 'zod';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

// ============================================================================
// Constants
// ============================================================================

/** Schema version for future migration support */
export const SCAN_STATE_VERSION = 1;

// ============================================================================
// Zod Schemas
// ============================================================================

/** Per-session watermark: tracks when we last scanned this session */
export const SessionWatermarkSchema = z.object({
  /** fileMtime from sessions-index.json at time of scan */
  fileMtime: z.number(),
  /** When we scanned it (ISO string) */
  scannedAt: z.string(),
  /** Project slug for context */
  projectSlug: z.string(),
}).passthrough();

/** Stats from a scan run */
export const ScanStatsSchema = z.object({
  totalProjects: z.number(),
  totalSessions: z.number(),
  newSessions: z.number(),
  modifiedSessions: z.number(),
  skippedSessions: z.number(),
}).passthrough();

/** Top-level scan state persisted to disk */
export const ScanStateSchema = z.object({
  /** Schema version for future migrations */
  version: z.number(),
  /** Map of "projectSlug:sessionId" -> watermark */
  sessions: z.record(z.string(), SessionWatermarkSchema),
  /** Projects to exclude from scanning */
  excludeProjects: z.array(z.string()),
  /** Last scan timestamp (ISO string) */
  lastScanAt: z.string().optional(),
  /** Stats from last scan */
  lastScanStats: ScanStatsSchema.optional(),
}).passthrough();

// ============================================================================
// Inferred TypeScript Types
// ============================================================================

export type SessionWatermark = z.infer<typeof SessionWatermarkSchema>;
export type ScanStats = z.infer<typeof ScanStatsSchema>;
export type ScanState = z.infer<typeof ScanStateSchema>;

// ============================================================================
// ScanStateStore
// ============================================================================

/**
 * Persistent store for scan state with atomic writes.
 *
 * Follows the established test-store.ts pattern: write temp file
 * in the same directory as target, then atomic rename.
 */
export class ScanStateStore {
  private readonly statePath: string;

  constructor(statePath?: string) {
    this.statePath = statePath ?? join(
      homedir(), '.gsd-skill-creator', 'discovery', 'scan-state.json',
    );
  }

  /**
   * Load scan state from disk.
   *
   * Returns empty default state when:
   * - File does not exist (first run)
   * - File contains corrupt/unparseable JSON
   * - File contents fail Zod schema validation
   */
  async load(): Promise<ScanState> {
    let content: string;
    try {
      content = await readFile(this.statePath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return this.createEmpty();
      }
      throw err;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Corrupt JSON -- graceful recovery
      return this.createEmpty();
    }

    const result = ScanStateSchema.safeParse(parsed);
    if (!result.success) {
      // Invalid schema -- graceful recovery
      return this.createEmpty();
    }

    return result.data;
  }

  /**
   * Save scan state to disk using atomic write.
   *
   * Creates parent directories if they don't exist.
   * Writes to a temp file in the same directory, then renames
   * to avoid cross-device link issues and ensure atomicity.
   */
  async save(state: ScanState): Promise<void> {
    await mkdir(dirname(this.statePath), { recursive: true });

    // Atomic write: temp file in same directory, then rename
    const tempPath = join(
      dirname(this.statePath),
      `.scan-state-${Date.now()}-${Math.random().toString(36).slice(2)}.json.tmp`,
    );

    await writeFile(tempPath, JSON.stringify(state, null, 2), 'utf-8');
    await rename(tempPath, this.statePath);
  }

  /**
   * Add a project to the exclude list.
   * No-op if project is already excluded (no duplicates).
   */
  async addExclude(project: string): Promise<void> {
    const state = await this.load();
    if (!state.excludeProjects.includes(project)) {
      state.excludeProjects.push(project);
    }
    await this.save(state);
  }

  /**
   * Remove a project from the exclude list.
   * No-op if project is not in the list.
   */
  async removeExclude(project: string): Promise<void> {
    const state = await this.load();
    state.excludeProjects = state.excludeProjects.filter((p) => p !== project);
    await this.save(state);
  }

  /** Create empty default state for first run or recovery */
  private createEmpty(): ScanState {
    return {
      version: SCAN_STATE_VERSION,
      sessions: {},
      excludeProjects: [],
    };
  }
}
