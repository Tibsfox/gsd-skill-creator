/**
 * M7 Umwelt — Markov blanket partition {S, A, I, E}.
 *
 * Re-exports the four branded state categories from the shared types module
 * and provides safe constructors + narrowing guards. The branded types at
 * the shared-types layer already enforce compile-time conditional
 * independence: a function that takes a `SensoryState` cannot be passed
 * an `InternalState` or `ActiveState` even though all four have structurally
 * compatible shapes. This is the type-level realisation of the
 * Kirchhoff 2018 §2 partition:
 *
 *     p(I, E | S, A) = p(I | S, A) · p(E | S, A)
 *
 * Given the blanket states {S, A}, internal and external are conditionally
 * independent. The branded types make illegal cross-category references a
 * compile error rather than a runtime check — implementing SC-M7-IND.
 *
 * Technical analogy only. The skill-creator is not "alive"; the Markov
 * blanket is a structural consequence of any persistent stateful system.
 *
 * @see Kirchhoff et al. 2018 §2 ("The Markov blankets of life",
 *   J R Soc Interface 15:20170792, DOI: 10.1098/rsif.2017.0792).
 *
 * @module umwelt/blanket
 */

import type {
  ActiveState,
  ExternalObservationProxy,
  InternalState,
  SensoryState,
} from '../types/umwelt.js';

export type {
  ActiveState,
  ExternalObservationProxy,
  InternalState,
  SensoryState,
};

/**
 * Build a SensoryState — the only sanctioned way to cross into the S
 * category from unbranded data. Callers outside this module MUST use this
 * constructor; direct type assertions bypass the blanket guarantees.
 */
export function makeSensory(
  observations: readonly string[],
  ts: number = Date.now(),
): SensoryState {
  return { observations: [...observations], ts } as SensoryState;
}

/**
 * Build an ActiveState. Mirrors `makeSensory` for the A category.
 */
export function makeActive(
  actions: readonly string[],
  ts: number = Date.now(),
): ActiveState {
  return { actions: [...actions], ts } as ActiveState;
}

/**
 * Build an InternalState from a (possibly unnormalised) intent distribution.
 * Normalises the values so they sum to 1. Empty inputs produce an empty
 * distribution (distinct from a uniform one — callers that want uniform
 * should pass `makeUniformInternal`).
 */
export function makeInternal(
  intentDist: Record<string, number>,
): InternalState {
  const entries = Object.entries(intentDist);
  const total = entries.reduce((s, [, v]) => s + Math.max(0, v), 0);
  const normalised: Record<string, number> = {};
  if (total > 0) {
    for (const [k, v] of entries) {
      normalised[k] = Math.max(0, v) / total;
    }
  } else {
    for (const [k] of entries) {
      normalised[k] = 0;
    }
  }
  return { intentDist: normalised } as InternalState;
}

/**
 * Uniform InternalState across the supplied intent classes. Useful as a
 * maximally-uncertain prior before any sensory evidence is accumulated.
 */
export function makeUniformInternal(intentClasses: readonly string[]): InternalState {
  const n = intentClasses.length;
  const dist: Record<string, number> = {};
  if (n === 0) return { intentDist: dist } as InternalState;
  const p = 1 / n;
  for (const c of intentClasses) dist[c] = p;
  return { intentDist: dist } as InternalState;
}

/**
 * Construct an ExternalObservationProxy. External states are by definition
 * unobservable — this proxy only carries an identifier, never the state
 * itself. Used to keep type references explicit where code discusses E
 * without pretending to read it.
 */
export function makeExternalProxy(proxyOf: string): ExternalObservationProxy {
  return { proxyOf } as ExternalObservationProxy;
}

/**
 * Runtime sanity check that an `InternalState` intent distribution is
 * well-formed (non-negative, sums to ~1). Not a type narrowing — the brand
 * is already established — but useful to catch construction bugs at test
 * boundaries.
 */
export function isWellFormedInternal(
  state: InternalState,
  eps: number = 1e-9,
): boolean {
  let total = 0;
  for (const v of Object.values(state.intentDist)) {
    if (!(v >= 0) || !Number.isFinite(v)) return false;
    total += v;
  }
  if (Object.keys(state.intentDist).length === 0) return true;
  return Math.abs(total - 1) <= eps;
}
