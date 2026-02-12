/**
 * WarmStartGenerator: merges snapshot data with STATE.md context to produce
 * a validated WarmStartContext for session restoration.
 *
 * Responsibilities:
 * - Reads latest snapshot via SnapshotManager
 * - Reads project state via ProjectStateReader
 * - Filters sensitive paths (before stale detection to avoid leaking)
 * - Verifies file existence (non-existent files become stale_files)
 * - Verifies skill existence at both project and user scope
 * - Computes staleness warnings for old snapshots (>24h)
 * - Validates output through WarmStartContextSchema
 */

import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { SnapshotManager } from './snapshot-manager.js';
import { SkillPreloadSuggester } from './skill-preload-suggester.js';
import { ProjectStateReader } from '../state/state-reader.js';
import { WarmStartContextSchema, filterSensitivePaths } from './types.js';
import type { WarmStartContext } from './types.js';

/**
 * Threshold in milliseconds after which a snapshot is considered stale.
 * 24 hours = 86,400,000 ms.
 */
const STALENESS_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export class WarmStartGenerator {
  constructor(
    private snapshotManager: SnapshotManager,
    private preloadSuggester: SkillPreloadSuggester,
    private stateReader: ProjectStateReader,
    private planningDir: string,
  ) {}

  /**
   * Generate a WarmStartContext from the latest snapshot and STATE.md.
   *
   * Returns null if no snapshot exists (nothing to warm-start from).
   */
  async generate(): Promise<WarmStartContext | null> {
    // 1. Get latest snapshot -- return null if none exists
    const snapshot = await this.snapshotManager.getLatest();
    if (!snapshot) return null;

    // 2. Read project state (STATE.md)
    const projectState = await this.stateReader.read();

    // 3. Filter sensitive paths FIRST (before existence check)
    //    This prevents sensitive paths from appearing in stale_files
    const safePaths = filterSensitivePaths(snapshot.files_modified);

    // 4. Verify file existence -- non-existent files become stale
    const verifiedFiles = await this.verifyFiles(safePaths);
    const staleFiles = safePaths.filter(f => !verifiedFiles.includes(f));

    // 5. Get and verify skill suggestions
    const suggestedSkills = this.preloadSuggester.suggest(snapshot);
    const verifiedSkills = await this.verifySkills(suggestedSkills);

    // 6. Extract state context (graceful degradation for missing STATE.md)
    const decisions = projectState.state?.decisions ?? [];
    const blockers = projectState.state?.blockers ?? [];
    const currentPhase = projectState.position ?? null;

    // 7. Compute staleness warning
    const stalenessWarning = this.computeStalenessWarning(snapshot.timestamp);

    // 8. Assemble and validate through Zod schema
    return WarmStartContextSchema.parse({
      // Snapshot base fields
      session_id: snapshot.session_id,
      timestamp: snapshot.timestamp,
      saved_at: snapshot.saved_at,
      summary: snapshot.summary,
      active_skills: snapshot.active_skills,
      open_questions: snapshot.open_questions,
      metrics: snapshot.metrics,
      top_tools: snapshot.top_tools,
      top_commands: snapshot.top_commands,

      // Verified/filtered fields
      files_modified: verifiedFiles,
      suggested_skills: verifiedSkills,
      stale_files: staleFiles,

      // STATE.md context
      decisions,
      blockers,
      current_phase: currentPhase,

      // Metadata
      generated_at: new Date().toISOString(),
      staleness_warning: stalenessWarning,
    });
  }

  /**
   * Verify which files still exist on disk.
   *
   * Uses fs.access() to check each file. Files that throw ENOENT
   * are excluded from the returned array (they are stale).
   */
  private async verifyFiles(files: string[]): Promise<string[]> {
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          await access(file);
          return file;
        } catch {
          return null;
        }
      }),
    );
    return results.filter((f): f is string => f !== null);
  }

  /**
   * Verify which skills exist at either project or user scope.
   *
   * Checks both:
   * - Project scope: .claude/skills/{name}/SKILL.md
   * - User scope: ~/.claude/skills/{name}/SKILL.md
   *
   * A skill is included if it exists at either scope.
   */
  private async verifySkills(skills: string[]): Promise<string[]> {
    const results = await Promise.all(
      skills.map(async (skill) => {
        const projectPath = join('.claude', 'skills', skill, 'SKILL.md');
        const userPath = join(homedir(), '.claude', 'skills', skill, 'SKILL.md');

        // Check project scope first, then user scope
        try {
          await access(projectPath);
          return skill; // Found at project scope
        } catch {
          // Not at project scope, try user scope
        }

        try {
          await access(userPath);
          return skill; // Found at user scope
        } catch {
          return null; // Not found at either scope
        }
      }),
    );
    return results.filter((s): s is string => s !== null);
  }

  /**
   * Compute a staleness warning if the snapshot is older than 24 hours.
   *
   * Returns a human-readable warning string or null if the snapshot is recent.
   */
  private computeStalenessWarning(snapshotTimestamp: number): string | null {
    const ageMs = Date.now() - snapshotTimestamp;
    if (ageMs > STALENESS_THRESHOLD_MS) {
      const ageHours = Math.round(ageMs / (60 * 60 * 1000));
      return `Snapshot is ${ageHours} hours old -- context may be outdated`;
    }
    return null;
  }
}
