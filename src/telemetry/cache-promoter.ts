/**
 * CachePromoter — promotes high-value skills to the static cache tier.
 *
 * Reads each high-value skill's frontmatter and sets cacheTier='static'
 * so that CacheOrderStage places it early in the loading order on
 * subsequent pipeline runs, maximising prompt cache hits.
 *
 * Safety: this class MODIFIES skill files. Only call after user confirmation.
 * Privacy: operates only on skill names and metadata — no user content.
 */

import type { SkillStore } from '../storage/skill-store.js';
import type { GsdSkillCreatorExtension } from '../types/extensions.js';

export interface PromoteResult {
  /** Skills successfully updated to cacheTier='static'. */
  promoted: string[];
  /** Skills that were already cacheTier='static' — skipped (idempotent). */
  alreadyStatic: string[];
  /** Skills that could not be read or written — recorded but not fatal. */
  errors: Array<{ skillName: string; error: string }>;
}

export class CachePromoter {
  constructor(private skillStore: SkillStore) {}

  /**
   * Promote a list of high-value skills to cacheTier='static'.
   *
   * Idempotent: skills already at 'static' are skipped and recorded in alreadyStatic.
   * Error-tolerant: per-skill errors are captured in errors[]; other skills continue.
   */
  async promote(highValueSkills: string[]): Promise<PromoteResult> {
    const result: PromoteResult = {
      promoted: [],
      alreadyStatic: [],
      errors: [],
    };

    for (const skillName of highValueSkills) {
      try {
        const skill = await this.skillStore.read(skillName);
        const meta = skill.metadata as unknown as Record<string, unknown>;

        // Check current cacheTier (new format first, then legacy fallback)
        const extContainer = meta?.metadata as Record<string, unknown> | undefined;
        const extensions = extContainer?.extensions as Record<string, unknown> | undefined;
        const gsdExt = extensions?.['gsd-skill-creator'] as GsdSkillCreatorExtension | undefined;
        const extTier = gsdExt?.cacheTier;
        const legacyTier = meta?.cacheTier as string | undefined;
        const currentTier = extTier ?? legacyTier;

        if (currentTier === 'static') {
          result.alreadyStatic.push(skillName);
          continue;
        }

        // Pass partial metadata update with cacheTier='static' in the extension.
        // SkillStore.update() reads the existing skill, extracts extension from updates
        // via getExtension(), merges with existing extension, and writes.
        const updates = {
          metadata: {
            extensions: {
              'gsd-skill-creator': { cacheTier: 'static' as const },
            },
          },
        };

        await this.skillStore.update(skillName, updates);

        result.promoted.push(skillName);
      } catch (err) {
        result.errors.push({
          skillName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return result;
  }
}
