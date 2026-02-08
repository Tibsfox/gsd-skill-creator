/**
 * Corpus scanner -- incremental session scanning with watermark-based change detection.
 *
 * Composes ScanStateStore (persistence), enumerateSessions (discovery), and
 * parseSessionFile (parsing) into an incremental scanning pipeline. On each
 * scan, it diffs the current session inventory against stored watermarks to
 * determine which sessions are new, modified, or unchanged.
 *
 * Supports project exclusion (both persistent in state and per-scan options),
 * force rescan (ignores watermarks), and a callback pattern that lets downstream
 * consumers provide their own processing logic.
 *
 * Implements: SCAN-03 (watermark tracking), SCAN-04 (skip scanned sessions),
 * SCAN-05 (project exclusion at scan time).
 */

import type { SessionInfo, ParsedEntry } from './types.js';
import { enumerateSessions } from './session-enumerator.js';
import { parseSessionFile } from './session-parser.js';
import { ScanStateStore } from './scan-state-store.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Callback invoked for each new or modified session.
 *
 * Receives the session metadata and an async generator of parsed entries.
 * The processor decides whether to consume the entries or not.
 */
export type SessionProcessor = (
  session: SessionInfo,
  entries: AsyncGenerator<ParsedEntry>,
) => Promise<void>;

/** Options for creating a CorpusScanner instance. */
export interface CorpusScannerOptions {
  /** Override base directory for Claude data (for testing). Defaults to ~/.claude */
  claudeBaseDir?: string;
  /** Override scan state file path (for testing). Defaults to ~/.gsd-skill-creator/discovery/scan-state.json */
  statePath?: string;
  /** Additional projects to exclude (merged with state excludes) */
  excludeProjects?: string[];
  /** Force rescan, ignoring watermarks. Processes all sessions as new. */
  forceRescan?: boolean;
}

/** Statistics from a scan run. */
export interface ScanResult {
  /** Number of unique projects discovered */
  totalProjects: number;
  /** Total number of sessions enumerated (before filtering) */
  totalSessions: number;
  /** Sessions seen for the first time (or all sessions when forceRescan) */
  newSessions: number;
  /** Sessions with changed fileMtime since last scan */
  modifiedSessions: number;
  /** Sessions with unchanged fileMtime (skipped) */
  skippedSessions: number;
  /** Sessions in excluded projects (skipped) */
  excludedSessions: number;
}

// ============================================================================
// CorpusScanner
// ============================================================================

/**
 * Incremental corpus scanner with watermark-based change detection.
 *
 * Orchestrates the scanning pipeline:
 * 1. Load scan state (watermarks + exclude list)
 * 2. Enumerate all sessions from Claude projects
 * 3. Filter out excluded projects
 * 4. Diff against watermarks: new / modified / unchanged
 * 5. Process new/modified sessions via callback
 * 6. Update watermarks and save state atomically
 */
export class CorpusScanner {
  private readonly stateStore: ScanStateStore;
  private readonly claudeBaseDir?: string;
  private readonly additionalExcludes: string[];
  private readonly forceRescan: boolean;

  constructor(options: CorpusScannerOptions = {}) {
    this.stateStore = new ScanStateStore(options.statePath);
    this.claudeBaseDir = options.claudeBaseDir;
    this.additionalExcludes = options.excludeProjects ?? [];
    this.forceRescan = options.forceRescan ?? false;
  }

  /**
   * Run an incremental scan, processing only new/modified sessions.
   *
   * The processor callback is invoked for each session that needs processing.
   * It receives the session metadata and an async generator from parseSessionFile.
   * Watermarks are updated in memory after each processed session, then the
   * entire state is saved atomically at the end.
   *
   * @param processor - Callback invoked for each new/modified session
   * @returns Statistics about what was processed, skipped, and excluded
   */
  async scan(processor: SessionProcessor): Promise<ScanResult> {
    // 1. Load persisted scan state
    const state = await this.stateStore.load();

    // 2. Enumerate all sessions from Claude projects
    const sessions = await enumerateSessions(this.claudeBaseDir);

    // 3. Build merged exclude set (state + options)
    const excludeSet = new Set([
      ...state.excludeProjects,
      ...this.additionalExcludes,
    ]);

    // 4. Collect unique projects for stats
    const projectSlugs = new Set(sessions.map((s) => s.projectSlug));

    // 5. Initialize stats
    const stats: ScanResult = {
      totalProjects: projectSlugs.size,
      totalSessions: sessions.length,
      newSessions: 0,
      modifiedSessions: 0,
      skippedSessions: 0,
      excludedSessions: 0,
    };

    // 6. Process each session
    for (const session of sessions) {
      // Check exclusion
      if (excludeSet.has(session.projectSlug)) {
        stats.excludedSessions++;
        continue;
      }

      // Watermark key: projectSlug:sessionId (defensive against UUID collision)
      const key = `${session.projectSlug}:${session.sessionId}`;
      const existing = state.sessions[key];

      if (!this.forceRescan && existing) {
        if (existing.fileMtime === session.fileMtime) {
          // Unchanged -- skip
          stats.skippedSessions++;
          continue;
        }
        // fileMtime changed -- re-process
        stats.modifiedSessions++;
      } else {
        // New session (or force rescan treating everything as new)
        stats.newSessions++;
      }

      // Process the session via callback
      const entries = parseSessionFile(session.fullPath);
      await processor(session, entries);

      // Update watermark in memory
      state.sessions[key] = {
        fileMtime: session.fileMtime,
        scannedAt: new Date().toISOString(),
        projectSlug: session.projectSlug,
      };
    }

    // 7. Update state metadata
    state.lastScanAt = new Date().toISOString();
    state.lastScanStats = {
      totalProjects: stats.totalProjects,
      totalSessions: stats.totalSessions,
      newSessions: stats.newSessions,
      modifiedSessions: stats.modifiedSessions,
      skippedSessions: stats.skippedSessions,
    };

    // 8. Persist state atomically
    await this.stateStore.save(state);

    return stats;
  }
}
