/**
 * Core type contracts for Phase 46 — Alternative Discoverer.
 *
 * AlternativeReport is the primary unit of analysis: every discovery strategy
 * (SuccessorDetector, ForkFinder, EquivalentSearcher, InternalizationFlagger)
 * returns AlternativeReport[].
 */

import type { Ecosystem } from '../dependency-auditor/types.js';

// ─── Relationship Types ───────────────────────────────────────────────────────

/**
 * Classifies the relationship between a problematic dependency and its
 * suggested alternative.
 *
 * - successor: Explicit migration notice in the registry deprecated field or README.
 * - fork: Active GitHub fork with its own release history.
 * - equivalent: Functionally similar package found via keyword/description search.
 * - internalization-candidate: Package small enough to inline into the project.
 */
export type RelationshipType =
  | 'successor'
  | 'fork'
  | 'equivalent'
  | 'internalization-candidate';

// ─── Migration Effort ─────────────────────────────────────────────────────────

/**
 * Estimated effort to migrate from the original to the alternative.
 *
 * - trivial: Drop-in replacement with identical API — typically just a rename.
 * - low: Minor API differences; automated migration or short manual search/replace.
 * - medium: API refactoring required — hours to days of developer time.
 * - high: Significant rewrite needed — days to weeks.
 * - unknown: Insufficient evidence to estimate effort.
 */
export type MigrationEffort = 'trivial' | 'low' | 'medium' | 'high' | 'unknown';

// ─── API Compatibility ────────────────────────────────────────────────────────

/**
 * How compatible the alternative's API surface is with the original package.
 *
 * - identical: Same API surface, same behavior — no call-site changes needed.
 * - compatible: Superset or backward-compatible subset — minor additions only.
 * - partial: Overlapping API with some gaps — targeted changes needed.
 * - incompatible: Different paradigm — full rewrite of consuming code required.
 * - unknown: Insufficient data to determine compatibility level.
 */
export type ApiCompatibility =
  | 'identical'
  | 'compatible'
  | 'partial'
  | 'incompatible'
  | 'unknown';

// ─── Alternative Report ───────────────────────────────────────────────────────

/**
 * A single recommendation produced by one of the four discovery strategies.
 *
 * **Confidence score scale (0.0 – 1.0):**
 * - 1.0: Definitive successor (explicit registry deprecated field with package name)
 * - 0.9: Very high confidence (deprecated field + name extraction succeeded)
 * - 0.8-0.9: Successor from README migration notice (explicit prose mention)
 * - 0.6-0.9: Active fork with own releases (higher stars → higher confidence)
 * - 0.3-0.7: Functional equivalent via keyword search (keyword match only)
 * - 0.5-0.9: Internalization candidate (less API used → higher confidence)
 * - 0.1-0.2: Weak match — exploratory signal only
 *
 * **Confidence by relationship type:**
 * - successor: 0.8-1.0 — explicit deprecation notice is definitive evidence
 * - fork: 0.6-0.9 — active fork with releases is strong evidence
 * - equivalent: 0.3-0.7 — keyword/description match is heuristic evidence
 * - internalization-candidate: 0.5-0.9 — usage analysis is quantitative evidence
 */
export interface AlternativeReport {
  /** Name of the dependency being replaced. */
  originalPackage: string;
  /** Ecosystem the original package belongs to. */
  originalEcosystem: Ecosystem;
  /** How this alternative relates to the original package. */
  relationship: RelationshipType;
  /** The suggested replacement package or internal module name. */
  alternativeName: string;
  /** Human-readable explanation of why this alternative was chosen. */
  evidenceSummary: string;
  /** How compatible the alternative's API is with the original. */
  apiCompatibility: ApiCompatibility;
  /** Estimated migration effort. */
  migrationEffort: MigrationEffort;
  /**
   * Confidence in this recommendation, 0.0 (very weak) to 1.0 (definitive).
   * See class JSDoc for per-relationship typical ranges.
   */
  confidenceScore: number;
  /** URL to the alternative's registry page, GitHub fork, etc. Null if not applicable. */
  sourceUrl: string | null;
}
