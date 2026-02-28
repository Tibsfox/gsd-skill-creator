/**
 * Barrel export for the dashboard metrics module.
 *
 * Re-exports all public types, constants, and functions from:
 * - types.ts — SampleTier enum, TierConfig, SectionTierMapping, SampleRateConfig, TierInterval
 * - sample-rate.ts — Default configs, interval resolution, config validation
 * - tier-refresh.ts — Per-section JavaScript refresh generation, section wrapping
 *
 * @module dashboard/metrics
 */

// Types and enums
export {
  SampleTier,
  type TierConfig,
  type SectionTierMapping,
  type SampleRateConfig,
  type TierInterval,
} from './types.js';

// Sample rate configuration and resolution
export {
  DEFAULT_TIER_CONFIG,
  DEFAULT_SECTION_TIERS,
  resolveSectionInterval,
  validateSampleRateConfig,
} from './sample-rate.js';

// Per-section refresh generation
export {
  generateSectionRefreshScript,
  wrapSectionWithRefresh,
} from './tier-refresh.js';

// Integration pipeline
export { collectAndRenderMetrics } from './integration.js';
export type { MetricsOptions, MetricsResult } from './integration.js';

// Graceful degradation
export { safeCollectGit, safeCollectSession, safeCollectPlanning } from './graceful.js';
