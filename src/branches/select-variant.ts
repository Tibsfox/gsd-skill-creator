/**
 * M4 Branch-Context Experimentation — stochastic branch-variant selection.
 *
 * `selectBranchVariant()` chooses among N candidate branch-skill variants using
 * the M5 `ActivationSelector` running in its **in-branch stochastic** mode. This
 * is the first production consumer of the selector's `inBranchContext: true`
 * path (wired at v1.49.927 but, until now, reachable only from unit tests):
 *
 *   - The selector's softmax re-ranking (`applyStochasticBridge`) is gated on
 *     `inBranchContext === true` (CF-MA3-03 / the ME-3 gate). Live sessions
 *     always pass `inBranchContext: false`, so the stochastic promotion never
 *     fires in a live activation. An M4 branch/exploration frame is the ONLY
 *     sanctioned home for in-branch stochasticity — exploration WANTS to
 *     sometimes try a non-argmax variant (explore vs exploit), and a branch
 *     frame is isolated from the live trunk.
 *   - Reproducibility: callers supply a per-branch integer `branchSeed`; the
 *     selection uses `mulberry32(branchSeed)`, so the same seed + same variants
 *     yields the same choice (SC-MA3-01 seeded). Omitting the seed falls back to
 *     `Math.random` (non-reproducible).
 *   - Flag-off / single-variant / T=0 all collapse to the deterministic argmax,
 *     byte-identically to a plain `select()` (the bridge's safety valves).
 *
 * This module composes — it does not re-implement — the selector. It is the M4
 * peer of `fork` / `explore` / `commit` / `abort` / `gc`.
 *
 * @module branches/select-variant
 */

import {
  ActivationSelector,
  type Candidate,
  type SelectorDecision,
} from '../orchestration/selector.js';
import type { TractabilityClass } from '../tractability/selector-api.js';
import { mulberry32 } from '../stochastic/sampler.js';
import { readStochasticEnabledFlag } from '../stochastic/settings.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A candidate branch-skill variant to choose among.
 *
 * Mirrors the selector's {@link Candidate} shape (id / content / importance) so
 * variants flow straight into `select()` without an adapter, plus an optional
 * `body` the caller can carry through to the run step.
 */
export interface BranchVariant {
  /** Variant identifier (e.g. a branch id or a proposed-edit label). */
  id: string;
  /** Human-readable name (defaults to `id`). */
  name?: string;
  /** Short description; scored against the query keywords by M2. */
  content: string;
  /** Importance hint in [0, 1]. Defaults to 0. */
  importance?: number;
  /** Optional skill body carried through to the explore run step. */
  body?: string;
}

/** Options for {@link selectBranchVariant}. */
export interface SelectBranchVariantOptions {
  /** Query describing the exploration goal; scored against variant content. */
  query: string;

  /** Candidate variants to choose among. Must be non-empty. */
  variants: BranchVariant[];

  /**
   * Per-branch seed for reproducible stochastic selection. When supplied, the
   * selection is deterministic for a given (seed, variants, query). When
   * omitted, `Math.random` is used (non-reproducible).
   */
  branchSeed?: number;

  /**
   * ME-1 tractability class for the exploration task. Scales the Boltzmann
   * temperature. Defaults to `'unknown'`.
   */
  tractabilityClass?: TractabilityClass;

  /**
   * Base Boltzmann temperature before tractability scaling. Higher → more
   * exploratory. Defaults to 1.0.
   */
  baseTemperature?: number;

  /**
   * Override the stochastic master flag. When omitted, read from settings via
   * {@link readStochasticEnabledFlag}. Passing `false` forces deterministic
   * argmax (byte-identical to a plain ranked `select()`).
   */
  stochasticEnabled?: boolean;

  /**
   * DI hook: supply a selector (or anything structurally implementing
   * `select`) for tests. When omitted, a fresh {@link ActivationSelector} is
   * constructed with the resolved `stochastic` options.
   */
  selector?: Pick<ActivationSelector, 'select'>;
}

/** Result of a branch-variant selection. */
export interface BranchVariantSelection {
  /** The chosen variant's id (decisions[0].id). */
  chosenId: string;
  /** The chosen variant object (from the input `variants`). */
  chosen: BranchVariant;
  /** The full ranked decision list; position 0 is the chosen variant. */
  decisions: SelectorDecision[];
  /**
   * Whether stochastic re-ranking was ACTIVE for this call (flag on AND >1
   * variant). When false, the choice is the deterministic argmax.
   */
  stochastic: boolean;
}

// ─── selectBranchVariant() ─────────────────────────────────────────────────────

/**
 * Choose a branch-skill variant using the in-branch stochastic selector.
 *
 * Always runs with `inBranchContext: true` — this function is, by construction,
 * an M4 branch frame, which is the sanctioned home for in-branch stochasticity
 * (the ME-3 gate). The stochastic promotion still no-ops when the master flag is
 * off, when there is a single variant, or when the effective temperature is ~0
 * (the bridge's safety valves), in which case the choice is the deterministic
 * top-ranked variant.
 *
 * @throws Error if `variants` is empty.
 */
export async function selectBranchVariant(
  opts: SelectBranchVariantOptions,
): Promise<BranchVariantSelection> {
  const { query, variants, branchSeed, tractabilityClass = 'unknown' } = opts;

  if (variants.length === 0) {
    throw new Error('selectBranchVariant: variants must be non-empty');
  }

  const stochasticEnabled = opts.stochasticEnabled ?? readStochasticEnabledFlag();
  const baseTemperature = opts.baseTemperature ?? 1.0;

  const selector =
    opts.selector ??
    new ActivationSelector({
      stochastic: { enabled: stochasticEnabled, baseTemperature },
    });

  const candidates: Candidate[] = variants.map((v) => ({
    id: v.id,
    name: v.name,
    content: v.content,
    importance: v.importance,
  }));

  const decisions = await selector.select(query, candidates, {
    inBranchContext: true,
    tractabilityClass,
    rng: branchSeed === undefined ? undefined : mulberry32(branchSeed),
  });

  // select() returns [] only for an empty candidate pool, which we guarded above.
  const chosenId = decisions[0]!.id;
  const chosen = variants.find((v) => v.id === chosenId) ?? variants[0]!;

  return {
    chosenId,
    chosen,
    decisions,
    stochastic: stochasticEnabled && variants.length > 1,
  };
}
