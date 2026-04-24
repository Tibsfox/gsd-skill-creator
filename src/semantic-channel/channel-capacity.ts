/**
 * Semantic Channel — channel-capacity bound computation.
 *
 * Implements a size-based upper bound on the minimum transmission cost of
 * a DACP three-part bundle at closure-preserving fidelity, compatible
 * with the Xu rate-distortion inequality `R_D(φ) ≥ R(D)` (arXiv:2604.15698).
 *
 * NOTE: This bound is intentionally conservative — it measures the raw
 * encoded bit-length of each component and treats that as an upper bound
 * on the minimum channel rate. Exact rate-distortion computation on a
 * Wasserstein-2 manifold of weight distributions is Phase 751 work
 * (`src/wasserstein-hebbian/`, MATH-19). The values returned by
 * `computeCapacityBound` are guaranteed to be:
 *   - non-negative,
 *   - an upper bound on the Xu closure-preserving rate,
 *   - deterministic for deterministic inputs (no randomness).
 *
 * @module semantic-channel/channel-capacity
 */

import type { ChannelCapacityBound, SemanticChannelTriad } from './types.js';

/**
 * Compute a size-based upper bound on the channel-capacity required to
 * transmit a semantic-channel triad at closure-preserving fidelity.
 *
 * Each component's bit count is `Buffer.byteLength(..., 'utf8') * 8`.
 * Distortion is set to 0 — the bound is a pure upper bound.
 */
export function computeCapacityBound(
  triad: SemanticChannelTriad,
): ChannelCapacityBound {
  const intentBits = Buffer.byteLength(triad.humanIntent, 'utf8') * 8;
  const dataBits =
    Buffer.byteLength(JSON.stringify(triad.structuredData), 'utf8') * 8;
  let codeBits = 0;
  for (const src of triad.executableCode) {
    codeBits += Buffer.byteLength(src, 'utf8') * 8;
  }
  const totalBits = intentBits + dataBits + codeBits;
  return {
    intentBits,
    dataBits,
    codeBits,
    totalBits,
    distortion: 0,
  };
}

/**
 * Does the computed capacity bound fit within a caller-supplied bit
 * budget? Pure predicate; no I/O, no side effects.
 */
export function capacityFitsBudget(
  bound: ChannelCapacityBound,
  maxBits: number,
): boolean {
  if (!Number.isFinite(maxBits) || maxBits < 0) return false;
  return bound.totalBits <= maxBits;
}
