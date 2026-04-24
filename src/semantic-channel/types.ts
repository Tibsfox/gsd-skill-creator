/**
 * Semantic Channel DACP formalism — types.
 *
 * Shape-only types over the existing DACP bundle, grounded in the M5 §2
 * BNF grammar `bundle ::= ⟨intent, data, code⟩` with per-component
 * fidelity levels `lossless ≻ closure-preserving ≻ rate-distorted`
 * (Xu 2026, arXiv:2604.16471 semantic channel construction).
 *
 * This module imports DACP types READ-ONLY from `../dacp/types.js` — it
 * never redefines them and never mutates the DACP module.
 *
 * @module semantic-channel/types
 */

import type { BundleManifest, FidelityLevel } from '../dacp/types.js';

// ============================================================================
// Fidelity tiers (M5 §2 BNF φ levels)
// ============================================================================

/**
 * Per-component fidelity tier per M5 §`sec:m5-dacp-grammar`:
 *
 *   φ ::= lossless | closure-preserving | rate-distorted
 *
 * Strict ordering (strongest first): `lossless ≻ closure-preserving ≻
 * rate-distorted`.
 */
export type FidelityTier = 'lossless' | 'closure-preserving' | 'rate-distorted';

/** Strict descending order (rank 0 = strongest). */
export const FIDELITY_TIER_ORDER: readonly FidelityTier[] = [
  'lossless',
  'closure-preserving',
  'rate-distorted',
];

/** Map a fidelity tier to its rank (0 = strongest). */
export function tierRank(t: FidelityTier): number {
  return FIDELITY_TIER_ORDER.indexOf(t);
}

/**
 * Compare two fidelity tiers. Returns a negative number if `a` is stronger
 * than `b`, positive if weaker, zero if equal.
 */
export function tierCompare(a: FidelityTier, b: FidelityTier): number {
  return tierRank(a) - tierRank(b);
}

// ============================================================================
// Semantic-channel triad (M5 §2 bundle grammar)
// ============================================================================

/**
 * The three-part-bundle triad per M5 §2:
 *
 *   bundle ::= ⟨ intent, data, code ⟩
 *
 * A shape-only view extracted from a DACP bundle on disk. The adapter
 * (`dacp-adapter.ts`) produces instances of this type by reading
 * `intent.md`, JSON-parsing each file in `data/`, and reading file
 * contents in `code/`.
 */
export interface SemanticChannelTriad {
  /** Natural-language statement from `intent.md`. */
  readonly humanIntent: string;
  /** Typed records from `data/<filename>.json`, keyed by filename. */
  readonly structuredData: Readonly<Record<string, unknown>>;
  /** Executable payload contents from `code/<filename>`. */
  readonly executableCode: readonly string[];
}

/** Per-component fidelity assignment for a triad. */
export interface ChannelComponentFidelity {
  readonly intent: FidelityTier;
  readonly data: FidelityTier;
  readonly code: FidelityTier;
}

/**
 * A DACP bundle viewed as a semantic-channel state — triad + per-component
 * fidelity + the original manifest (unchanged reference).
 */
export interface ChannelState {
  readonly triad: SemanticChannelTriad;
  readonly fidelity: ChannelComponentFidelity;
  readonly manifest: BundleManifest;
}

// ============================================================================
// Rate-distortion bound (M5 §`sec:m5-ratedistortion`)
// ============================================================================

/**
 * Channel-capacity upper bound per Xu rate-distortion inequality
 * `R_D(φ) ≥ R(D)` (arXiv:2604.15698).
 *
 * NOTE: This is a size-based upper bound, not an exact rate-distortion
 * computation. Phase 751 (Wasserstein-Hebbian) may refine this with a
 * tight rate computation on weight-distribution manifolds.
 */
export interface ChannelCapacityBound {
  readonly intentBits: number;
  readonly dataBits: number;
  readonly codeBits: number;
  readonly totalBits: number;
  readonly distortion: number;
}

// ============================================================================
// Drift-checker advisory finding
// ============================================================================

/**
 * Per-component drift magnitudes (0.0 = identical, 1.0 = maximum drift).
 * Normalised character-length delta / max length, clamped to [0, 1].
 */
export interface DriftMagnitudes {
  readonly intent: number;
  readonly data: number;
  readonly code: number;
}

/**
 * Advisory finding emitted by the semantic-channel drift checker.
 *
 * ADVISORY-ONLY. Consumers may log, display, or record the finding; it
 * **cannot** trigger gate bypass, migration, or any state mutation. The
 * Xu semantic-channel preservation property (fidelity never weakens
 * across the channel) is surfaced via `weakened: true` when any component
 * has degraded; CAPCOM retains final authority to act on the signal.
 */
export interface DriftFinding {
  readonly findingId: string;
  readonly kind: 'semantic-channel-drift';
  readonly severity: 'info' | 'warn';
  readonly summary: string;
  readonly perComponent: DriftMagnitudes;
  readonly threshold: number;
  readonly baselineFidelity: ChannelComponentFidelity;
  readonly currentFidelity: ChannelComponentFidelity;
  readonly weakened: boolean;
  readonly timestamp: string;
}

// ============================================================================
// DACP FidelityLevel ↔ triad mapping
// ============================================================================

/**
 * M5 § mapping from DACP numeric fidelity level (0–4) to per-component
 * semantic-channel fidelity tier.
 *
 * Rationale:
 *   - Intent is natural language → never stronger than `closure-preserving`
 *     (Xu semantic channel: two statements are equivalent iff they have
 *     the same deductive closure under a fixed theory).
 *   - Data is a typed record → `lossless` once structure is present
 *     (levels 1+); `rate-distorted` at level 0 (no structured data).
 *   - Code is an executable payload → `closure-preserving` once code is
 *     present (levels 3+), under the execution-equivalence relation
 *     (two fragments are equivalent iff same observable effect); below
 *     level 3, `rate-distorted` (absent or unspecified).
 */
export function fidelityLevelToTriad(
  level: FidelityLevel,
): ChannelComponentFidelity {
  switch (level) {
    case 0:
      return {
        intent: 'closure-preserving',
        data: 'rate-distorted',
        code: 'rate-distorted',
      };
    case 1:
      return {
        intent: 'closure-preserving',
        data: 'lossless',
        code: 'rate-distorted',
      };
    case 2:
      return {
        intent: 'closure-preserving',
        data: 'lossless',
        code: 'rate-distorted',
      };
    case 3:
      return {
        intent: 'closure-preserving',
        data: 'lossless',
        code: 'closure-preserving',
      };
    case 4:
      return {
        intent: 'closure-preserving',
        data: 'lossless',
        code: 'closure-preserving',
      };
  }
}
