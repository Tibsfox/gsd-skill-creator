/**
 * M8 Symbiosis × M7 Umwelt — teaching-driven prior update.
 *
 * Wave 2 integration: when the developer records a teaching entry, M7's
 * generative-model priors update as *high-precision evidence* — weighted
 * much more heavily than a single observation, so sensory noise cannot
 * explain the signal away.
 *
 * Weighting policy
 * ----------------
 * Each teach entry contributes `teachWeight` pseudo-counts (default 50;
 * contrast with a single sensory trace contributing 1 count) into the
 * counts object for the intent class named by the entry's first ref (when
 * present) or by a caller-provided intent picker. `correction`, `constraint`,
 * and `pattern` drive positive count; `preference` and `clarification`
 * contribute with half weight (softer signal).
 *
 * Source: Foxglove 2026, *The Space Between* §C.1 (teaching as privileged
 * evidence); Friston 2013 (precision-weighted priors).
 *
 * @module symbiosis/m7-adapter
 */

import type { TeachEntry, TeachCategory } from '../types/symbiosis.js';
import { observe, type ModelCounts } from '../umwelt/generativeModel.js';
import { readTeachEntries } from './teaching.js';

/**
 * Weight configuration per teach category. Values are pseudo-counts applied
 * to (intent, observation) on every teach-driven update.
 */
export interface TeachingWeightConfig {
  correction: number;
  constraint: number;
  pattern: number;
  preference: number;
  clarification: number;
}

export const DEFAULT_TEACHING_WEIGHTS: Readonly<TeachingWeightConfig> = Object.freeze({
  correction: 50,
  constraint: 40,
  pattern: 30,
  preference: 20,
  clarification: 15,
});

/**
 * Resolver type for mapping a teach entry onto (intentIdx, observationIdx)
 * within a given ModelCounts. Returning -1 for either index skips the entry.
 */
export type TeachEntryResolver = (
  entry: TeachEntry,
  counts: ModelCounts,
) => { intentIdx: number; observationIdx: number };

/**
 * Default resolver: treat the *first* ref as the intent-class key and the
 * category itself as the observation-type label. Unknown entries return -1.
 */
export const defaultTeachResolver: TeachEntryResolver = (entry, counts) => {
  const ref = entry.refs?.[0];
  const intentIdx = ref ? nameToIndex(ref, counts.n) : -1;
  const observationIdx = counts.observationTypes.indexOf(entry.category);
  return { intentIdx, observationIdx };
};

export interface M7TeachUpdateOptions {
  weights?: TeachingWeightConfig;
  resolver?: TeachEntryResolver;
  /**
   * Intent-class name → index map. When provided, the resolver prefers
   * exact name lookup over hash-mod fallback.
   */
  intentIndex?: Map<string, number>;
}

export interface M7TeachUpdateResult {
  /** Number of teach entries applied. */
  applied: number;
  /** Number of entries skipped (bad refs / unknown category). */
  skipped: number;
  /** Total pseudo-counts added. */
  totalPseudoCounts: number;
}

/**
 * Apply a batch of teach entries to an M7 counts object as high-precision
 * evidence. Every entry contributes `weight[category]` pseudo-counts at the
 * cell resolved by `resolver`.
 */
export function applyTeachEntriesToM7(
  entries: readonly TeachEntry[],
  counts: ModelCounts,
  opts: M7TeachUpdateOptions = {},
): M7TeachUpdateResult {
  const weights = opts.weights ?? DEFAULT_TEACHING_WEIGHTS;
  const resolver = opts.resolver ?? defaultTeachResolver;

  let applied = 0;
  let skipped = 0;
  let totalPseudoCounts = 0;

  for (const entry of entries) {
    let { intentIdx, observationIdx } = resolver(entry, counts);
    // Prefer exact name lookup from intentIndex when supplied.
    if (opts.intentIndex && entry.refs && entry.refs.length > 0) {
      const maybe = opts.intentIndex.get(entry.refs[0]);
      if (maybe !== undefined) intentIdx = maybe;
    }
    if (
      intentIdx < 0 ||
      observationIdx < 0 ||
      intentIdx >= counts.n ||
      observationIdx >= counts.m
    ) {
      skipped += 1;
      continue;
    }
    const w = weightFor(entry.category, weights);
    for (let k = 0; k < w; k++) {
      observe(counts, intentIdx, observationIdx);
    }
    applied += 1;
    totalPseudoCounts += w;
  }

  return { applied, skipped, totalPseudoCounts };
}

/**
 * High-level entry point: read the teaching ledger from disk and apply its
 * accumulated pseudo-counts to the supplied counts object.
 */
export function syncM7FromTeachingLedger(
  counts: ModelCounts,
  opts: M7TeachUpdateOptions & { ledgerPath?: string } = {},
): M7TeachUpdateResult {
  const entries = readTeachEntries(opts.ledgerPath);
  return applyTeachEntriesToM7(entries, counts, opts);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function weightFor(
  category: TeachCategory,
  weights: TeachingWeightConfig,
): number {
  switch (category) {
    case 'correction':
      return weights.correction;
    case 'constraint':
      return weights.constraint;
    case 'pattern':
      return weights.pattern;
    case 'preference':
      return weights.preference;
    case 'clarification':
      return weights.clarification;
  }
}

/**
 * Deterministic mod-hash of a string into `[0, n)`. Matches the default
 * classifier in m3-updater so teaching and observation both resolve to the
 * same intent class for a given ref.
 */
function nameToIndex(name: string, n: number): number {
  if (n <= 0) return -1;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(h ^ name.charCodeAt(i), 16777619) >>> 0;
  }
  return h % n;
}
