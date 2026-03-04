/**
 * SkillLifecycleResolver — derives skill lifecycle state from existing stores.
 *
 * State is NOT persisted separately. It is derived from:
 * - SkillStore.exists() / list() — whether skill exists
 * - ResultStore.list() — test run history
 *   - graderChipName present in any result → 'graded'
 *   - results present but no graderChipName → 'tested'
 *   - no results → 'draft'
 *
 * 'optimized' and 'packaged' states are defined in the type for future use
 * (would check variant dirs / package files) but currently return 'graded'
 * as the highest derivable state from ResultStore data alone.
 */

import type { SkillStore } from '../storage/skill-store.js';
import type { ResultStore } from '../testing/result-store.js';
import type { SkillScope } from '../types/scope.js';

// ============================================================================
// Types
// ============================================================================

/** Skill lifecycle state ordered from least to most mature. */
export type SkillLifecycleState = 'draft' | 'tested' | 'graded' | 'optimized' | 'packaged';

// ============================================================================
// SkillLifecycleResolver
// ============================================================================

/**
 * Derives skill lifecycle state from SkillStore + ResultStore data.
 * State is never written to a separate file — always computed on demand.
 */
export class SkillLifecycleResolver {
  constructor(
    private readonly skillStore: Pick<SkillStore, 'exists' | 'list'>,
    private readonly resultStore: Pick<ResultStore, 'list'>,
    private readonly scope: SkillScope,
  ) {}

  /**
   * Resolve the lifecycle state of a named skill.
   *
   * @param skillName - Name of the skill to resolve
   * @returns The current lifecycle state
   * @throws Error if the skill does not exist
   */
  async resolve(skillName: string): Promise<SkillLifecycleState> {
    const exists = await this.skillStore.exists(skillName);
    if (!exists) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    const results = await this.resultStore.list(skillName);
    if (results.length === 0) {
      return 'draft';
    }

    // graderChipName in stored snapshot indicates grading was performed.
    // Cast to Record<string, unknown> since TestRunSnapshot type does not
    // declare chipName/graderChipName (they are present in JSON from ChipTestRunResult).
    const graded = results.some(
      (r) => (r as unknown as Record<string, unknown>).graderChipName !== undefined,
    );

    if (!graded) {
      return 'tested';
    }

    return 'graded';
  }

  /**
   * List all known skills with their resolved lifecycle state.
   *
   * Calls skillStore.list() to get all skill names, then resolves each.
   * If resolve() throws for a skill (e.g., store error), that skill's status
   * gracefully degrades to 'draft' so the list always returns all skills.
   *
   * @returns Array of { name, status } for all skills
   */
  async listAll(): Promise<Array<{ name: string; status: SkillLifecycleState }>> {
    const names = await this.skillStore.list();
    return Promise.all(
      names.map(async (name) => ({
        name,
        status: await this.resolve(name).catch(() => 'draft' as SkillLifecycleState),
      })),
    );
  }
}
