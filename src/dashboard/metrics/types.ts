/**
 * Type definitions for the three-tier sample rate system.
 *
 * Dashboard sections are assigned to tiers (hot/warm/cold) that control
 * how frequently their data sources are polled during live refresh.
 *
 * @module dashboard/metrics/types
 */

// ============================================================================
// Tier Enum
// ============================================================================

/** Sample rate tier controlling refresh frequency. */
export enum SampleTier {
  /** Lightweight sources polled every 1-2s (e.g., cache reads, single git ops). */
  hot = 'hot',
  /** Moderate-cost sources polled every 5-10s (e.g., multi-file scans, log grouping). */
  warm = 'warm',
  /** Expensive sources recomputed only on file change (e.g., full history, cross-milestone). */
  cold = 'cold',
}

// ============================================================================
// Tier Configuration
// ============================================================================

/** Configuration for a single sample tier. */
export interface TierConfig {
  /** Which tier this config applies to. */
  tier: SampleTier;
  /** Polling interval in milliseconds. 0 means on-change-only (cold tier). */
  intervalMs: number;
  /** Human-readable description of the tier's purpose. */
  description: string;
}

// ============================================================================
// Section-to-Tier Mapping
// ============================================================================

/** Maps a dashboard section to its assigned sample tier. */
export interface SectionTierMapping {
  /** Dashboard section identifier (e.g., "session-pulse", "phase-velocity"). */
  sectionId: string;
  /** The sample tier this section belongs to. */
  tier: SampleTier;
  /** Data source descriptions for this section (e.g., [".session-cache.json", "git log -1"]). */
  sources: string[];
}

// ============================================================================
// Top-Level Config
// ============================================================================

/** Complete sample rate configuration with tier definitions and section assignments. */
export interface SampleRateConfig {
  /** Tier configurations keyed by tier name. */
  tiers: Record<SampleTier, TierConfig>;
  /** Section-to-tier assignments. */
  sections: SectionTierMapping[];
}

// ============================================================================
// Resolved Interval
// ============================================================================

/** Resolved interval result from looking up a section's tier and timing. */
export interface TierInterval {
  /** Dashboard section identifier. */
  sectionId: string;
  /** The resolved sample tier. */
  tier: SampleTier;
  /** Concrete polling interval in milliseconds (0 = on-change-only). */
  intervalMs: number;
  /** Data source descriptions inherited from the section mapping. */
  sources: string[];
}
