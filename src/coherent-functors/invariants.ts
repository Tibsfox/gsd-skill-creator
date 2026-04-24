/**
 * Coherent Functors — coherence-condition invariants (Gate G6 predicates).
 *
 * The four conditions from module_3.tex §13 (arXiv:2604.15100):
 *
 *   1. Naturality of Present : Arch → F.
 *   2. Identity preservation: Present(id_A) = id_{Present(A)}.
 *   3. Composition coherence: Present(g∘f) carries a combined witness.
 *   4. Direct-sum compatibility: Present(A1 ⊕ A2) ≅ Present(A1) ⊕ Present(A2)
 *      when the target category exposes `directSum`.
 *
 * These become BLOCK predicates for Phase 745 Gate G6: any coherent functor
 * produced without the four witnesses causes the gate to refuse commit.
 *
 * @module coherent-functors/invariants
 */

import type {
  CoherenceReport,
  CoherentFunctor,
  PredicateResult,
} from './types.js';

/** Check naturality witness is present and non-empty. */
export function checkNaturality<C, D>(
  F: CoherentFunctor<C, D>,
): PredicateResult {
  const w = F.coherenceData.naturality;
  const ok = typeof w === 'string' && w.length > 0;
  return { ok, witness: w, detail: ok ? undefined : 'naturality witness missing' };
}

/**
 * Check identity preservation: applying F to an identity morphism in the
 * source produces a morphism structurally equivalent to an identity in the
 * target, and the identity witness is stamped.
 */
export function checkIdentity<C, D>(
  F: CoherentFunctor<C, D>,
  probeObject?: C,
): PredicateResult {
  const w = F.coherenceData.identity;
  const witnessPresent = typeof w === 'string' && w.length > 0;
  if (!witnessPresent) {
    return { ok: false, witness: w, detail: 'identity witness missing' };
  }
  // Structural probe: if a probeObject is available, verify F sends the
  // source-identity morphism to a morphism whose source and target match
  // F.onObjects(probeObject).
  if (probeObject !== undefined) {
    const sourceId = F.source.identity(probeObject);
    const mapped = F.onMorphisms(sourceId);
    const expectedObj = F.onObjects(probeObject);
    const sourceMatches = F.target.equalObjects(
      mapped.source as unknown as D,
      expectedObj,
    );
    const targetMatches = F.target.equalObjects(
      mapped.target as unknown as D,
      expectedObj,
    );
    if (!sourceMatches || !targetMatches) {
      return {
        ok: false,
        witness: w,
        detail: `identity probe failed: source=${sourceMatches}, target=${targetMatches}`,
      };
    }
  }
  return { ok: true, witness: w };
}

/**
 * Check composition coherence: the composition witness must be present AND
 * non-empty. Freshly-factoried functors carry an empty composition witness
 * by design (they haven't been composed yet) — this predicate is only
 * meaningful on composed functors.
 */
export function checkComposition<C, D>(
  F: CoherentFunctor<C, D>,
): PredicateResult {
  const w = F.coherenceData.composition;
  if (typeof w !== 'string') {
    return { ok: false, witness: '', detail: 'composition witness not a string' };
  }
  return {
    ok: w.length > 0,
    witness: w,
    detail:
      w.length === 0
        ? 'composition witness empty (functor has not been composed)'
        : undefined,
  };
}

/**
 * Check direct-sum compatibility: when the target category exposes a
 * `directSum` operation, F must carry a direct-sum witness.
 */
export function checkDirectSum<C, D>(
  F: CoherentFunctor<C, D>,
): PredicateResult {
  const hasDirectSum = typeof F.target.directSum === 'function';
  const w = F.coherenceData.directSum;
  if (!hasDirectSum) {
    // Vacuously satisfied if the target doesn't support direct sums.
    return { ok: true, witness: w ?? '', detail: 'target category has no directSum' };
  }
  const ok = typeof w === 'string' && w.length > 0;
  return {
    ok,
    witness: w ?? '',
    detail: ok ? undefined : 'direct-sum witness missing despite target directSum',
  };
}

/**
 * M3 §13 signature (4). Runs all four coherence-condition checks on a
 * coherent functor and returns a CoherenceReport.
 *
 * If `requireComposition` is false (default — freshly-factoried functors),
 * the composition predicate is treated as vacuously OK when the witness is
 * empty; set to true for composed functors to enforce the composition witness.
 */
export function checkCoherence<C, D>(
  F: CoherentFunctor<C, D>,
  options: { requireComposition?: boolean; probeObject?: C } = {},
): CoherenceReport {
  const requireComposition = options.requireComposition === true;
  const violations: Array<{
    kind: 'identity' | 'composition' | 'direct-sum' | 'naturality';
    witness: string;
    detail?: string;
  }> = [];

  const natRes = checkNaturality(F);
  if (!natRes.ok) {
    violations.push({ kind: 'naturality', witness: natRes.witness, detail: natRes.detail });
  }

  const idRes = checkIdentity(F, options.probeObject);
  if (!idRes.ok) {
    violations.push({ kind: 'identity', witness: idRes.witness, detail: idRes.detail });
  }

  const compRes = checkComposition(F);
  if (requireComposition && !compRes.ok) {
    violations.push({ kind: 'composition', witness: compRes.witness, detail: compRes.detail });
  }

  const dsRes = checkDirectSum(F);
  if (!dsRes.ok) {
    violations.push({ kind: 'direct-sum', witness: dsRes.witness, detail: dsRes.detail });
  }

  return { ok: violations.length === 0, violations };
}
