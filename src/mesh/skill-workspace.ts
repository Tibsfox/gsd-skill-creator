/**
 * SkillWorkspace -- enumerates skills with status metadata.
 *
 * Reads skill directories and combines filesystem metadata with
 * OperationTracker state to produce a workspace listing.
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { OperationTracker } from './operation-tracker.js';
import type { SkillLifecycleState } from './operation-tracker.js';

// ============================================================================
// Types
// ============================================================================

/** Workspace listing entry for a single skill */
export interface SkillWorkspaceEntry {
  name: string;
  status: SkillLifecycleState;
  testedModels: number;
  lastModified: string;
}

// ============================================================================
// SkillWorkspace
// ============================================================================

/**
 * Enumerates skills in a directory with lifecycle status.
 *
 * Usage:
 * ```typescript
 * const workspace = new SkillWorkspace('/path/to/skills');
 * const skills = await workspace.listSkills();
 * ```
 */
export class SkillWorkspace {
  constructor(private readonly skillsDir: string) {}

  /**
   * List all skills with their status metadata.
   *
   * Scans skillsDir for directories containing SKILL.md, reads
   * OperationTracker state, and collects filesystem modification time.
   *
   * @returns Array of workspace entries sorted by name
   */
  async listSkills(): Promise<SkillWorkspaceEntry[]> {
    let entries: Awaited<ReturnType<typeof readdir>>;
    try {
      entries = await readdir(this.skillsDir, { withFileTypes: true });
    } catch {
      return [];
    }

    const results: SkillWorkspaceEntry[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const skillDir = join(this.skillsDir, entry.name);
      const skillPath = join(skillDir, 'SKILL.md');

      try {
        const fileStat = await stat(skillPath);

        // Load lifecycle state
        const tracker = new OperationTracker(skillDir);
        await tracker.load();

        // Count tested models from .skill-status.json history
        const history = tracker.getHistory();
        const testedModels = history.filter((h) => h.to === 'tested').length;

        results.push({
          name: entry.name,
          status: tracker.getState(),
          testedModels,
          lastModified: fileStat.mtime.toISOString(),
        });
      } catch {
        // No SKILL.md or unreadable — skip
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get detailed summary for a single skill.
   *
   * @param name - Skill name (directory name)
   * @returns Workspace entry or null if not found
   */
  async getSkillSummary(name: string): Promise<SkillWorkspaceEntry | null> {
    const skillDir = join(this.skillsDir, name);
    const skillPath = join(skillDir, 'SKILL.md');

    try {
      const fileStat = await stat(skillPath);
      const tracker = new OperationTracker(skillDir);
      await tracker.load();

      const history = tracker.getHistory();
      const testedModels = history.filter((h) => h.to === 'tested').length;

      return {
        name,
        status: tracker.getState(),
        testedModels,
        lastModified: fileStat.mtime.toISOString(),
      };
    } catch {
      return null;
    }
  }
}
