import type { BudgetProfile, PriorityTier } from '../types/application.js';
import type { SkillBudgetInfo } from './budget-validation.js';
import { getTierForSkill } from '../application/budget-profiles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A skill annotated with its loading projection status.
 *
 * Produced by `projectLoading()` to show whether each skill would be
 * loaded or deferred by BudgetStage for a given agent profile.
 */
export interface ProjectedSkill {
  /** Skill name */
  name: string;
  /** Total character count */
  charCount: number;
  /** Priority tier assigned by profile */
  tier: PriorityTier;
  /** Whether skill exceeds single-skill character limit */
  oversized: boolean;
  /** Whether skill will be loaded or deferred */
  status: 'loaded' | 'deferred';
}

/**
 * Complete loading projection for a set of installed skills.
 *
 * Mirrors the selection logic of BudgetStage but operates on character
 * counts (not tokens) and is pure/synchronous -- no I/O, no token API.
 */
export interface LoadingProjection {
  /** Skills that fit within budget, ordered by tier priority */
  loaded: ProjectedSkill[];
  /** Skills that did not fit, ordered by tier priority */
  deferred: ProjectedSkill[];
  /** Total characters of loaded skills */
  loadedTotal: number;
  /** Total characters of deferred skills */
  deferredTotal: number;
  /** Budget limit used for this projection (in characters) */
  budgetLimit: number;
  /** Agent profile name used */
  profileName: string;
}

// ============================================================================
// Options
// ============================================================================

export interface ProjectLoadingOptions {
  /** Context window size in characters (default: 200_000) */
  contextWindowSize?: number;
  /** Single-skill character limit for oversized flagging (default: 15_000) */
  singleSkillLimit?: number;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Simulate what BudgetStage would select for a given set of installed
 * skills and agent profile.
 *
 * This is a pure, synchronous function operating on character counts.
 * It mirrors BudgetStage's tier-based selection:
 * 1. Critical skills load first, checked against hardCeiling
 * 2. Standard skills load next, checked against standardBudget
 * 3. Optional skills load last, checked against standardBudget
 *
 * Within each tier, skills maintain their input order.
 *
 * @param skills - Installed skills with character counts
 * @param profile - Agent budget profile
 * @param options - Optional overrides for context window and skill limit
 * @returns Loading projection with loaded/deferred partitioning
 */
export function projectLoading(
  skills: SkillBudgetInfo[],
  profile: BudgetProfile,
  options?: ProjectLoadingOptions
): LoadingProjection {
  const contextWindowSize = options?.contextWindowSize ?? 200_000;
  const singleSkillLimit = options?.singleSkillLimit ?? 15_000;

  const standardBudget = contextWindowSize * profile.budgetPercent;
  const hardCeiling = contextWindowSize * profile.hardCeilingPercent;

  // Partition skills into tier buckets, preserving input order within each
  const criticalSkills: SkillBudgetInfo[] = [];
  const standardSkills: SkillBudgetInfo[] = [];
  const optionalSkills: SkillBudgetInfo[] = [];

  for (const skill of skills) {
    const tier = getTierForSkill(profile, skill.name);
    switch (tier) {
      case 'critical':
        criticalSkills.push(skill);
        break;
      case 'optional':
        optionalSkills.push(skill);
        break;
      default:
        standardSkills.push(skill);
        break;
    }
  }

  const loaded: ProjectedSkill[] = [];
  const deferred: ProjectedSkill[] = [];
  let criticalUsed = 0;
  let standardUsed = 0;

  // Process a tier's skills against the appropriate budget limit
  function processTier(
    tierSkills: SkillBudgetInfo[],
    tier: PriorityTier
  ): void {
    for (const skill of tierSkills) {
      let fits: boolean;

      if (tier === 'critical') {
        fits = criticalUsed + skill.totalChars <= hardCeiling;
      } else {
        fits = standardUsed + skill.totalChars <= standardBudget;
      }

      const projected: ProjectedSkill = {
        name: skill.name,
        charCount: skill.totalChars,
        tier,
        oversized: skill.totalChars > singleSkillLimit,
        status: fits ? 'loaded' : 'deferred',
      };

      if (fits) {
        loaded.push(projected);
        if (tier === 'critical') {
          criticalUsed += skill.totalChars;
        } else {
          standardUsed += skill.totalChars;
        }
      } else {
        deferred.push(projected);
      }
    }
  }

  // Process tiers in priority order: critical first, then standard, then optional
  processTier(criticalSkills, 'critical');
  processTier(standardSkills, 'standard');
  processTier(optionalSkills, 'optional');

  const loadedTotal = loaded.reduce((sum, s) => sum + s.charCount, 0);
  const deferredTotal = deferred.reduce((sum, s) => sum + s.charCount, 0);

  return {
    loaded,
    deferred,
    loadedTotal,
    deferredTotal,
    budgetLimit: standardBudget,
    profileName: profile.name,
  };
}
