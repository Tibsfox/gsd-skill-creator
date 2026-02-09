import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { SkillStore } from '../../storage/skill-store.js';

/**
 * Cache tier for skill ordering within relevance bands.
 * static = stable content (changes rarely, maximizes prompt cache hits)
 * session = per-session content (changes per session)
 * dynamic = volatile content (changes frequently, sorted last)
 */
export type CacheTier = 'static' | 'session' | 'dynamic';

/** Default cache tier when frontmatter does not specify one. */
export const DEFAULT_CACHE_TIER: CacheTier = 'dynamic';

/** Numeric sort order: lower value = appears earlier in skill list. */
export const CACHE_TIER_ORDER: Record<CacheTier, number> = {
  static: 0,
  session: 1,
  dynamic: 2,
};

/**
 * Pipeline stage that reorders resolvedSkills by cacheTier metadata
 * within equal-relevance bands.
 *
 * Purpose: Maximize Anthropic prompt cache hits by placing stable (static)
 * skill content before dynamic content in the loading order.
 *
 * Cache ordering is a tiebreaker within same-score groups. It never
 * overrides relevance-based ordering (different scores are never reordered).
 *
 * Sort priority (within each score band):
 *   1. cacheTier: static (0) < session (1) < dynamic (2)
 *   2. name: alphabetical ascending (deterministic tiebreaker)
 *
 * Preconditions: resolvedSkills populated by ResolveStage (and optionally BudgetStage).
 * Postconditions: resolvedSkills reordered within score bands by cache tier.
 */
export class CacheOrderStage implements PipelineStage {
  readonly name = 'cache-order';

  constructor(private skillStore: SkillStore) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    if (context.earlyExit) {
      return context;
    }

    if (context.resolvedSkills.length <= 1) {
      return context;
    }

    // Build name -> cacheTier map by reading frontmatter for each skill
    const tierMap = new Map<string, CacheTier>();

    for (const skill of context.resolvedSkills) {
      const tier = await this.readCacheTier(skill.name);
      tierMap.set(skill.name, tier);
    }

    // Create new sorted array (do not mutate original)
    const sorted = Array.from(context.resolvedSkills).sort((a, b) => {
      // Primary: score descending (higher score first)
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      // Secondary: cache tier ascending (static=0 first)
      const tierA = CACHE_TIER_ORDER[tierMap.get(a.name) ?? DEFAULT_CACHE_TIER];
      const tierB = CACHE_TIER_ORDER[tierMap.get(b.name) ?? DEFAULT_CACHE_TIER];
      if (tierA !== tierB) {
        return tierA - tierB;
      }

      // Tertiary: name alphabetical ascending
      return a.name.localeCompare(b.name);
    });

    context.resolvedSkills = sorted;
    return context;
  }

  /**
   * Read cacheTier from a skill's frontmatter.
   * Checks new format (metadata.extensions['gsd-skill-creator'].cacheTier)
   * and legacy format (root-level cacheTier).
   * Defaults to 'dynamic' on missing data or read errors.
   */
  private async readCacheTier(skillName: string): Promise<CacheTier> {
    try {
      const skill = await this.skillStore.read(skillName);
      const meta = skill.metadata as any;

      // New format: nested under metadata.extensions
      const extTier = meta.metadata?.extensions?.['gsd-skill-creator']?.cacheTier;
      if (extTier && isValidCacheTier(extTier)) {
        return extTier;
      }

      // Legacy format: cacheTier at root of metadata
      const legacyTier = meta.cacheTier;
      if (legacyTier && isValidCacheTier(legacyTier)) {
        return legacyTier;
      }

      return DEFAULT_CACHE_TIER;
    } catch {
      // Silent fallback matching pipeline conventions
      return DEFAULT_CACHE_TIER;
    }
  }
}

/** Type guard for valid CacheTier values. */
function isValidCacheTier(value: unknown): value is CacheTier {
  return value === 'static' || value === 'session' || value === 'dynamic';
}
