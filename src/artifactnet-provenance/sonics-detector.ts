/**
 * SONICS 3-way provenance detector.
 *
 * Implements a downscaled SONICS-style three-way verdict (real / partial /
 * synthetic) over the `ResidualSignature` produced by the forensic-residual
 * physics layer.
 *
 * ## Methodology lineage
 *
 * SONICS (n=23,288, see ArtifactNet — arXiv:2604.16254 / Heewon Oh et al.)
 * achieves ~92%+ precision at production scale. Our test surface is a
 * synthetic corpus on the order of 10–100 examples; we therefore target
 * ≥80% precision per the Phase 772 brief, and prefer `partial` over a
 * confident misclassification.
 *
 * ## Decision rule
 *
 * The classifier scores each verdict via simple linear scorers over the
 * normalised signature fields, then picks the argmax. The scorers are:
 *
 *   real_score      = +burstiness   - repetition  + low_zipfDeviation_bonus
 *   synthetic_score = -burstiness   + repetition  - low_zipfDeviation_bonus
 *   partial_score   = saturating bell around the midpoint of all signals
 *
 * The thresholds were chosen so that:
 *   - well-formed bursty heavy-tail text is `real`,
 *   - extremely uniform low-burstiness text is `synthetic`,
 *   - mixed signals fall to `partial`.
 *
 * @module artifactnet-provenance/sonics-detector
 */

import type { ProvenanceVerdict, ResidualSignature } from './types.js';

/**
 * Verdict + confidence in [0, 1] for a residual signature.
 */
export interface ClassifierOutput {
  readonly verdict: ProvenanceVerdict;
  readonly confidence: number;
  readonly scores: Readonly<{
    real: number;
    partial: number;
    synthetic: number;
  }>;
}

/**
 * Apply the SONICS-style 3-way classifier to a residual signature.
 *
 * Returns `unknown` only if the signature is identically zero (i.e. empty
 * input); otherwise returns one of `real | partial | synthetic`.
 */
export function classifySignature(sig: ResidualSignature): ClassifierOutput {
  const empty =
    sig.entropy === 0 &&
    sig.burstiness === 0 &&
    sig.spectralFlatness === 0 &&
    sig.repetition === 0;
  if (empty) {
    return {
      verdict: 'unknown',
      confidence: 0,
      scores: { real: 0, partial: 0, synthetic: 0 },
    };
  }

  // Heavy-tailed natural distributions deviate strongly from flat and have
  // high burstiness. AI-generated content is flatter (low Zipf deviation
  // numerically here corresponds to a *flatter*-than-Zipf curve, but we
  // intentionally use deviation directly so high deviation → human-like).
  const bursty = clamp01(sig.burstiness);
  const heavyTail = clamp01(sig.spectralFlatness); // Zipf-deviation lane
  const repeats = clamp01(sig.repetition);
  const ent = clamp01(sig.entropy);

  // For audio we invert the Wiener-entropy lane: low Wiener-entropy = peaky
  // (real instrument resonances); high Wiener-entropy = flat (synthetic).
  // We encode that here so callers don't have to.
  const heavyTailEffective =
    sig.kind === 'audio' || sig.kind === 'image'
      ? clamp01(1 - heavyTail)
      : heavyTail;

  // Real score: bursty + heavy-tailed - repetitive
  const realRaw = bursty * 1.4 + heavyTailEffective * 1.2 - repeats * 1.2;
  // Synthetic score: low burstiness + flat distribution + repetitive +
  // narrow entropy band (AI text often clusters around mid-entropy).
  const flatness = clamp01(1 - heavyTailEffective);
  const lowBurst = clamp01(1 - bursty);
  const narrowEntropy = bell(ent, 0.55, 0.18);
  const syntheticRaw =
    lowBurst * 1.3 + flatness * 1.1 + repeats * 1.4 + narrowEntropy * 0.6;
  // Partial score: medium of everything.
  const partialRaw =
    bell(bursty, 0.4, 0.18) * 0.9 +
    bell(heavyTailEffective, 0.5, 0.2) * 0.9 +
    bell(repeats, 0.25, 0.18) * 0.9;

  const scores = softmaxNormalise({
    real: realRaw,
    partial: partialRaw,
    synthetic: syntheticRaw,
  });

  const ordered = (
    [
      ['real', scores.real],
      ['partial', scores.partial],
      ['synthetic', scores.synthetic],
    ] as Array<[ProvenanceVerdict, number]>
  ).sort((a, b) => b[1] - a[1]);

  const winner = ordered[0];
  const runner = ordered[1];
  // Confidence: gap between top two, mapped to [0, 1].
  const gap = Math.max(0, winner[1] - runner[1]);
  const confidence = clamp01(gap * 1.8 + winner[1] * 0.2);

  return {
    verdict: winner[0],
    confidence,
    scores,
  };
}

// ---------------- helpers ----------------

function softmaxNormalise(s: {
  real: number;
  partial: number;
  synthetic: number;
}): { real: number; partial: number; synthetic: number } {
  // Shift to non-negative, then sum-normalise. Avoids exp-overflow and keeps
  // results stable for tiny inputs. We don't need true softmax — a simple
  // affine renormalisation of three bounded scores is sufficient.
  const min = Math.min(s.real, s.partial, s.synthetic, 0);
  const a = s.real - min;
  const b = s.partial - min;
  const c = s.synthetic - min;
  const sum = a + b + c;
  if (sum === 0) return { real: 1 / 3, partial: 1 / 3, synthetic: 1 / 3 };
  return { real: a / sum, partial: b / sum, synthetic: c / sum };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * A simple Gaussian-shaped bell, peak at `mu`, width `sigma`, range [0, 1].
 */
function bell(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}
