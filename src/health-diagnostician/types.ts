/**
 * Core type contracts for the health-diagnostician module (Phase 45).
 *
 * All classification and severity types live here and are consumed by every
 * subsequent module in this phase.
 */

import type { Ecosystem, HealthSignal } from '../dependency-auditor/types.js';

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * The six mutually-exclusive health classifications for a dependency.
 *
 * **Priority ordering** (when multiple conditions match, highest wins):
 *   conflicting > vulnerable > abandoned > stale > aging > healthy
 *
 * - healthy:     All signals green — maintained, current, no vulnerabilities, no conflicts.
 * - aging:       Last publish between agingDays and staleDays threshold for its ecosystem.
 * - stale:       Last publish older than staleDays for its ecosystem, or deprecated.
 * - abandoned:   Archived, no publish in > abandonedDays, or maintainerCount === 0 with no recent activity.
 * - vulnerable:  Has at least one known OSV vulnerability (any severity).
 * - conflicting: Detected version range conflict with another dependency in the same project.
 */
export type HealthClassification =
  | 'healthy'
  | 'aging'
  | 'stale'
  | 'abandoned'
  | 'vulnerable'
  | 'conflicting';

// ─── Severity ─────────────────────────────────────────────────────────────────

/**
 * P0-P3 severity levels for actionability.
 *
 * - P0: Requires immediate action — installation-blocking conflict or unpatched critical/high CVE.
 * - P1: Requires action — patched critical/high CVE or abandoned dependency.
 * - P2: Should be addressed — stale dependency or medium-severity CVE.
 * - P3: Low urgency — aging dependency or low/unknown CVE.
 */
export type SeverityLevel = 'P0' | 'P1' | 'P2' | 'P3';

// ─── Ecosystem Thresholds ─────────────────────────────────────────────────────

/** Per-ecosystem staleness thresholds (in days) reflecting typical release cadence norms. */
export interface EcosystemThresholds {
  ecosystem: Ecosystem;
  /** Days since last publish before the dependency is classified as "aging". */
  agingDays: number;
  /** Days since last publish before the dependency is classified as "stale". */
  staleDays: number;
  /** Days since last publish before the dependency is classified as "abandoned". */
  abandonedDays: number;
}

// ─── Diagnosis Result ─────────────────────────────────────────────────────────

/** The diagnostic verdict for a single dependency. */
export interface DiagnosisResult {
  /** The original health signal from Phase 44. */
  signal: HealthSignal;
  /** The single classification that applies (priority-ordered). */
  classification: HealthClassification;
  /** The severity level assigned for actionability. */
  severity: SeverityLevel;
  /** Human-readable explanation of why this classification and severity were assigned. */
  rationale: string;
  /** Days since lastPublishDate, or null if publish date is unknown. */
  ageInDays: number | null;
}

// ─── Diagnosis Report ─────────────────────────────────────────────────────────

/**
 * Python version compatibility matrix result.
 * Defined here to avoid circular imports — the full implementation is in python-compat-matrix.ts.
 */
export interface CompatMatrixResult {
  /** Python versions satisfying ALL dependency constraints simultaneously. */
  compatibleVersions: string[];
  /** Map of dep name → python_requires constraint string. */
  constraintsByDep: Record<string, string>;
  /** True when compatibleVersions is empty. */
  hasConflict: boolean;
  /** Human-readable explanation when hasConflict is true. */
  conflictExplanation: string | null;
}

/**
 * A detected cross-dependency version range conflict.
 * Defined here to avoid circular imports — full implementation in conflict-detector.ts.
 */
export interface ConflictFinding {
  packageA: string;
  packageB: string;
  ecosystem: Ecosystem;
  rangeA: string;
  rangeB: string;
  explanation: string;
}

/**
 * The complete diagnostic output for an entire AuditSnapshot.
 * Produced by DiagnosticsOrchestrator.diagnose().
 */
export interface DiagnosisReport {
  /** One DiagnosisResult per dependency in the snapshot. */
  results: DiagnosisResult[];
  /** Python version compatibility matrix — null if the snapshot has no PyPI dependencies. */
  pythonCompat: CompatMatrixResult | null;
  /** All detected cross-dependency version range conflicts. */
  conflicts: ConflictFinding[];
  /** Aggregate statistics for quick summary display. */
  summary: {
    total: number;
    byClassification: Record<HealthClassification, number>;
    byPriority: Record<SeverityLevel, number>;
  };
}
