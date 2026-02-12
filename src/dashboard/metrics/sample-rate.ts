/**
 * Sample rate configuration and interval resolution for tiered dashboard refresh.
 *
 * Provides default tier configurations (hot/warm/cold), section-to-tier
 * mappings, and functions to resolve concrete polling intervals and
 * validate configurations.
 *
 * @module dashboard/metrics/sample-rate
 */

import {
  SampleTier,
  type TierConfig,
  type SectionTierMapping,
  type SampleRateConfig,
  type TierInterval,
} from './types.js';

// ============================================================================
// Default Tier Configuration
// ============================================================================

/**
 * Default tier configurations with sensible interval defaults.
 *
 * - hot:  1500ms (center of 1-2s range) — lightweight cache/single-op reads
 * - warm: 7500ms (center of 5-10s range) — moderate multi-file scans
 * - cold: 0ms (on-change-only) — expensive full-history recomputation
 */
export const DEFAULT_TIER_CONFIG: Record<SampleTier, TierConfig> = {
  [SampleTier.hot]: {
    tier: SampleTier.hot,
    intervalMs: 1500,
    description: 'Lightweight sources polled every 1-2s (cache reads, single git ops)',
  },
  [SampleTier.warm]: {
    tier: SampleTier.warm,
    intervalMs: 7500,
    description: 'Moderate-cost sources polled every 5-10s (multi-file scans, log grouping)',
  },
  [SampleTier.cold]: {
    tier: SampleTier.cold,
    intervalMs: 0,
    description: 'Expensive sources recomputed only on file change (full history, cross-milestone)',
  },
};

// ============================================================================
// Default Section-to-Tier Mappings
// ============================================================================

/** Default assignment of dashboard sections to sample tiers. */
export const DEFAULT_SECTION_TIERS: SectionTierMapping[] = [
  // Hot tier — lightweight, polled frequently
  {
    sectionId: 'session-pulse',
    tier: SampleTier.hot,
    sources: ['.session-cache.json'],
  },
  {
    sectionId: 'commit-feed',
    tier: SampleTier.hot,
    sources: ['git log -1'],
  },
  {
    sectionId: 'heartbeat',
    tier: SampleTier.hot,
    sources: ['STATE.md mtime'],
  },
  {
    sectionId: 'message-counter',
    tier: SampleTier.hot,
    sources: ['.session-cache.json'],
  },

  // Warm tier — moderate cost, polled less frequently
  {
    sectionId: 'phase-velocity',
    tier: SampleTier.warm,
    sources: ['git log --phase-grouping', 'sessions.jsonl'],
  },
  {
    sectionId: 'planning-quality',
    tier: SampleTier.warm,
    sources: ['PLAN.md/SUMMARY.md diffs', 'sessions.jsonl tail'],
  },

  // Cold tier — expensive, recomputed on file change only
  {
    sectionId: 'historical-trends',
    tier: SampleTier.cold,
    sources: ['full git history', 'cross-milestone aggregation', 'PLAN/SUMMARY diffs'],
  },
];

// ============================================================================
// Interval Resolution
// ============================================================================

/**
 * Resolve a dashboard section to its concrete polling interval.
 *
 * Looks up the section in the provided (or default) config, then merges
 * the tier's intervalMs with the section's metadata to produce a TierInterval.
 *
 * @param sectionId - Dashboard section identifier
 * @param config - Optional custom config (defaults to built-in defaults)
 * @returns Resolved TierInterval, or null if the section is not found
 */
export function resolveSectionInterval(
  sectionId: string,
  config?: SampleRateConfig,
): TierInterval | null {
  const sections = config?.sections ?? DEFAULT_SECTION_TIERS;
  const tiers = config?.tiers ?? DEFAULT_TIER_CONFIG;

  const mapping = sections.find((s) => s.sectionId === sectionId);
  if (!mapping) {
    return null;
  }

  const tierConfig = tiers[mapping.tier];
  if (!tierConfig) {
    return null;
  }

  return {
    sectionId: mapping.sectionId,
    tier: mapping.tier,
    intervalMs: tierConfig.intervalMs,
    sources: mapping.sources,
  };
}

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validate a SampleRateConfig for correctness.
 *
 * Checks:
 * - Hot interval: 500-5000ms
 * - Warm interval: 3000-30000ms
 * - Cold interval: must be 0
 * - Hot < warm (no overlap)
 * - All section tier references exist in config.tiers
 *
 * @param config - Configuration to validate
 * @returns Validation result with accumulated errors
 */
export function validateSampleRateConfig(
  config: SampleRateConfig,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Hot tier interval bounds
  const hot = config.tiers[SampleTier.hot];
  if (hot) {
    if (hot.intervalMs < 500) {
      errors.push(`Hot tier interval ${hot.intervalMs}ms is below minimum 500ms`);
    }
    if (hot.intervalMs > 5000) {
      errors.push(`Hot tier interval ${hot.intervalMs}ms exceeds maximum 5000ms (overlaps warm)`);
    }
  }

  // Warm tier interval bounds
  const warm = config.tiers[SampleTier.warm];
  if (warm) {
    if (warm.intervalMs < 3000) {
      errors.push(`Warm tier interval ${warm.intervalMs}ms is below minimum 3000ms (overlaps hot)`);
    }
    if (warm.intervalMs > 30000) {
      errors.push(`Warm tier interval ${warm.intervalMs}ms exceeds maximum 30000ms`);
    }
  }

  // Cold tier must be 0
  const cold = config.tiers[SampleTier.cold];
  if (cold && cold.intervalMs !== 0) {
    errors.push(`Cold tier interval must be 0 (on-change-only), got ${cold.intervalMs}ms`);
  }

  // Hot must be less than warm
  if (hot && warm && hot.intervalMs >= warm.intervalMs) {
    errors.push(`Hot interval (${hot.intervalMs}ms) must be less than warm interval (${warm.intervalMs}ms)`);
  }

  // All section tier references must exist
  const validTiers = new Set(Object.values(SampleTier) as string[]);
  for (const section of config.sections) {
    if (!validTiers.has(section.tier)) {
      errors.push(`Section "${section.sectionId}" references unknown tier "${section.tier}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
