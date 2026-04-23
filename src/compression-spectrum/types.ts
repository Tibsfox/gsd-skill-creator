/**
 * Experience Compression Spectrum — type definitions.
 *
 * Shen et al. 2026 (arXiv:2604.15877) frame memory, skills, and rules as
 * three points on a single compression axis. Their survey of 1,136 references
 * across 22 papers found cross-community citation rate below 1% — the three
 * levels are studied in isolation. They identify the "missing diagonal":
 * no surveyed system supports adaptive cross-level compression.
 *
 * This module gives the missing diagonal an explicit representation. Every
 * item in the gsd-skill-creator knowledge substrate carries a compression
 * level (episodic / procedural / declarative) with a measured ratio. Items
 * can be promoted (lower-compression to higher-compression) or demoted
 * (higher-compression to lower-compression) based on usage signals.
 *
 *   Level         Typical ratio  gsd-skill-creator analog
 *   episodic      5-20x          session memory, CLAUDE.md
 *   procedural    50-500x        SKILL.md files, cartridge format
 *   declarative   1000x+         hooks, CAPCOM gate definitions
 *
 * @module compression-spectrum/types
 */

/** Three compression levels on the Shen spectrum. */
export type CompressionLevel = 'episodic' | 'procedural' | 'declarative';

/** An item in the substrate with compression metadata. */
export interface CompressedItem {
  id: string;
  /** Current compression level. */
  level: CompressionLevel;
  /** Measured compression ratio (source-size / compressed-size). */
  ratio: number;
  /** Usage count — drives promotion eligibility. */
  usageCount: number;
  /** Days since last access — drives demotion eligibility. */
  staleDays: number;
  /** Free-form tags for categorization. */
  tags: string[];
}

/** Transition event emitted on every level change. */
export interface TransitionEvent {
  type: 'compression-spectrum.transition';
  timestamp: string;
  itemId: string;
  from: CompressionLevel;
  to: CompressionLevel;
  rationale: string;
  ratioBefore: number;
  ratioAfter: number;
}

/** Result of analyzeTransition(). */
export interface TransitionDecision {
  shouldTransition: boolean;
  from: CompressionLevel;
  to: CompressionLevel | null;
  direction: 'promote' | 'demote' | 'hold';
  reason: string;
  ratioEstimateAfter: number;
}

/** Spectrum-level distribution report. */
export interface SpectrumReport {
  totalItems: number;
  byLevel: Record<CompressionLevel, number>;
  averageRatio: Record<CompressionLevel, number>;
  /**
   * Missing-diagonal health metric in [0, 1]:
   *   0 = no items outside "episodic" (diagonal completely unpopulated)
   *   1 = items are well-distributed across all three levels
   * Shen et al.'s key observation is that most systems score near 0 here;
   * gsd-skill-creator aims to score higher over time.
   */
  diagonalHealth: number;
  /** Items that recently transitioned (for audit trail). */
  recentTransitions: TransitionEvent[];
}

/** Inputs to the transition decision. */
export interface TransitionInputs {
  item: CompressedItem;
  /** Usage threshold to promote from episodic to procedural. */
  promoteToProceduralThreshold: number;
  /** Usage threshold to promote from procedural to declarative. */
  promoteToDeclarativeThreshold: number;
  /** Stale-days threshold to demote from declarative to procedural. */
  demoteFromDeclarativeStaleDays: number;
  /** Stale-days threshold to demote from procedural to episodic. */
  demoteFromProceduralStaleDays: number;
}

/** Typical compression-ratio ranges from Shen et al. 2026. */
export const SHEN_RATIO_RANGES = {
  episodic: { min: 5, max: 20 },
  procedural: { min: 50, max: 500 },
  declarative: { min: 1000, max: 100000 },
} as const;

/** Default thresholds matching the 20-percent-cap / 3-correction / 7-day cooldown convention. */
export const DEFAULT_THRESHOLDS = {
  promoteToProceduralThreshold: 3,
  promoteToDeclarativeThreshold: 20,
  demoteFromDeclarativeStaleDays: 90,
  demoteFromProceduralStaleDays: 30,
} as const;

/** Level order for ranking. */
export const LEVEL_RANK: Record<CompressionLevel, number> = {
  episodic: 0,
  procedural: 1,
  declarative: 2,
};
