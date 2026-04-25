/**
 * Forensic-residual-physics detector.
 *
 * Extracts a `ResidualSignature` from an `Asset` using fine-grained
 * statistical properties of the content. The signature is the fingerprint
 * the SONICS-style 3-way classifier consumes downstream.
 *
 * ## Methodology lineage
 *
 * Per ArtifactNet (arXiv:2604.16254 / Heewon Oh et al.) the forensic-residual
 * approach detects AI-generated content not by pattern-matching surface
 * features but by inspecting subtle statistical residuals the generator
 * leaves at fine grain. We implement a downscaled version:
 *
 * - **Text**: token n-gram entropy, burstiness of sentence lengths, Zipf-rank
 *   deviation (as the "spectralFlatness" lane), and fine-grain repetition.
 *   Human text is bursty and has heavier tails; AI text is regular and
 *   over-flat in token-frequency.
 * - **Audio**: spectral flatness (Wiener entropy of magnitude spectrum) and
 *   harmonic-residual ratio. Synthetic audio tends to be over-flat or
 *   harmonically too-clean compared to real instrumentation.
 * - **Image**: pixel-difference entropy and block-DC repetition (image kind
 *   is supported structurally; the synthetic-corpus tests focus on text and
 *   audio at downscaled precision per the phase brief).
 *
 * No external dependencies. All transforms are plain TS over typed arrays.
 *
 * @module artifactnet-provenance/forensic-residual-detector
 */

import type { Asset, AssetKind, ResidualSignature } from './types.js';

// ---------------- public API ----------------

/**
 * Extract the forensic residual signature for an asset.
 *
 * Pure function: given the same content it always returns the same signature.
 */
export function extractResidualSignature(asset: Asset): ResidualSignature {
  switch (asset.kind) {
    case 'text':
      return extractTextSignature(coerceText(asset.content));
    case 'audio':
      return extractAudioSignature(coerceSamples(asset.content));
    case 'image':
      return extractImageSignature(coerceBytes(asset.content));
    default: {
      // Exhaustiveness guard; if AssetKind is extended we want to fail loud.
      const _exhaustive: never = asset.kind;
      throw new Error(`unsupported asset kind: ${String(_exhaustive)}`);
    }
  }
}

// ---------------- text path ----------------

const STOPWORD_TOKEN_RE = /[a-z0-9]+/g;

/**
 * Extract residual signature from text. Implementation focuses on fine-grain
 * statistics that diverge between human and AI prose.
 */
export function extractTextSignature(text: string): ResidualSignature {
  const lowered = text.toLowerCase();
  const tokens = lowered.match(STOPWORD_TOKEN_RE) ?? [];
  const entropy = normalisedShannonEntropy(tokens);
  const burstiness = sentenceBurstiness(text);
  const spectralFlatness = zipfDeviation(tokens);
  const repetition = bigramRepetition(tokens);
  return {
    entropy,
    burstiness,
    spectralFlatness,
    repetition,
    kind: 'text',
  };
}

/**
 * Normalised Shannon entropy of a discrete distribution of items.
 * Returns 0 on empty input. Result in [0, 1].
 */
export function normalisedShannonEntropy(items: ReadonlyArray<string>): number {
  if (items.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1);
  const n = items.length;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  // Normalise by log2(unique-count) so the result is in [0, 1].
  const denom = Math.log2(Math.max(2, counts.size));
  if (denom === 0) return 0;
  const ratio = h / denom;
  return clamp01(ratio);
}

/**
 * Sentence-length burstiness in [0, 1]. Computed as the coefficient of
 * variation of sentence lengths, mapped through a saturating curve.
 *
 * Human text typically scores ≥0.4; AI-generated paragraphs are noticeably
 * lower (very uniform sentence length).
 */
export function sentenceBurstiness(text: string): number {
  const sents = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sents.length < 2) return 0;
  const lengths = sents.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 0;
  const variance =
    lengths.reduce((acc, x) => acc + (x - mean) * (x - mean), 0) /
    lengths.length;
  const stdev = Math.sqrt(variance);
  const cv = stdev / mean;
  // Saturating map: cv=0 → 0, cv=1 → ~0.63, cv=∞ → 1.
  return clamp01(1 - Math.exp(-cv));
}

/**
 * Zipf-deviation. We sort token frequencies, compare to ideal Zipf curve
 * f(rank) ∝ 1/rank, and report the normalised L1 deviation (lower = more
 * Zipf-like = more human; higher = flatter or more skewed = AI-ish).
 *
 * Returns the deviation directly in [0, 1].
 */
export function zipfDeviation(tokens: ReadonlyArray<string>): number {
  if (tokens.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  const sorted = [...counts.values()].sort((a, b) => b - a);
  const n = tokens.length;
  // Compute ideal Zipf normalisation: sum_{r=1..k} 1/r.
  let zNorm = 0;
  for (let r = 1; r <= sorted.length; r++) zNorm += 1 / r;
  if (zNorm === 0 || n === 0) return 0;
  let l1 = 0;
  for (let r = 1; r <= sorted.length; r++) {
    const observed = sorted[r - 1] / n;
    const ideal = 1 / r / zNorm;
    l1 += Math.abs(observed - ideal);
  }
  // L1 of two probability distributions ∈ [0, 2]; normalise to [0, 1].
  return clamp01(l1 / 2);
}

/**
 * Bigram repetition coefficient. Fraction of bigrams that appear more than
 * once. AI text is often slightly more repetitive at fine grain.
 */
export function bigramRepetition(tokens: ReadonlyArray<string>): number {
  if (tokens.length < 2) return 0;
  const counts = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]} ${tokens[i + 1]}`;
    counts.set(bg, (counts.get(bg) ?? 0) + 1);
  }
  let repeated = 0;
  for (const c of counts.values()) if (c > 1) repeated += c;
  return clamp01(repeated / (tokens.length - 1));
}

// ---------------- audio path ----------------

/**
 * Extract a residual signature from a numeric sample stream. Treats the
 * samples as an amplitude time series.
 *
 * - `entropy`: normalised entropy of the amplitude histogram (32 bins).
 * - `burstiness`: CV of envelope segment energy.
 * - `spectralFlatness`: Wiener entropy (geometric/arithmetic mean ratio of
 *   the per-block periodogram).
 * - `repetition`: fraction of identical adjacent samples.
 */
export function extractAudioSignature(
  samples: ReadonlyArray<number>,
): ResidualSignature {
  if (samples.length === 0) {
    return {
      entropy: 0,
      burstiness: 0,
      spectralFlatness: 0,
      repetition: 0,
      kind: 'audio',
    };
  }
  const entropy = amplitudeEntropy(samples, 32);
  const burstiness = envelopeBurstiness(samples, 64);
  const spectralFlatness = blockSpectralFlatness(samples, 64);
  const repetition = adjacentSampleRepetition(samples);
  return {
    entropy,
    burstiness,
    spectralFlatness,
    repetition,
    kind: 'audio',
  };
}

export function amplitudeEntropy(
  samples: ReadonlyArray<number>,
  bins: number,
): number {
  if (samples.length === 0 || bins < 2) return 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of samples) {
    if (s < lo) lo = s;
    if (s > hi) hi = s;
  }
  if (hi === lo) return 0;
  const counts = new Array<number>(bins).fill(0);
  const span = hi - lo;
  for (const s of samples) {
    const idx = Math.min(bins - 1, Math.floor(((s - lo) / span) * bins));
    counts[idx] += 1;
  }
  const items: string[] = [];
  for (let i = 0; i < counts.length; i++) {
    for (let k = 0; k < counts[i]; k++) items.push(String(i));
  }
  return normalisedShannonEntropy(items);
}

export function envelopeBurstiness(
  samples: ReadonlyArray<number>,
  block: number,
): number {
  if (samples.length < block * 2) return 0;
  const energies: number[] = [];
  for (let i = 0; i + block <= samples.length; i += block) {
    let e = 0;
    for (let j = 0; j < block; j++) {
      const v = samples[i + j];
      e += v * v;
    }
    energies.push(Math.sqrt(e / block));
  }
  if (energies.length < 2) return 0;
  const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
  if (mean === 0) return 0;
  const variance =
    energies.reduce((acc, x) => acc + (x - mean) * (x - mean), 0) /
    energies.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp01(1 - Math.exp(-cv));
}

/**
 * Block spectral flatness. We compute a Hartley-style power proxy per block
 * (no FFT dependency) by summing squared discrete differences across small
 * lags — a coarse but distribution-stable spectral surrogate. Then take the
 * Wiener-entropy of the per-lag energy profile.
 */
export function blockSpectralFlatness(
  samples: ReadonlyArray<number>,
  block: number,
): number {
  if (samples.length < block * 2) return 0;
  const lags = 8;
  const lagEnergy = new Array<number>(lags).fill(0);
  let blocks = 0;
  for (let i = 0; i + block <= samples.length; i += block) {
    for (let l = 1; l <= lags; l++) {
      let e = 0;
      for (let j = 0; j + l < block; j++) {
        const d = samples[i + j + l] - samples[i + j];
        e += d * d;
      }
      lagEnergy[l - 1] += e / Math.max(1, block - l);
    }
    blocks += 1;
  }
  if (blocks === 0) return 0;
  for (let k = 0; k < lagEnergy.length; k++) lagEnergy[k] /= blocks;
  // Wiener entropy = geomean / arithmean; clamped & shifted to [0, 1].
  let arith = 0;
  let logSum = 0;
  let positive = 0;
  for (const e of lagEnergy) {
    arith += e;
    if (e > 0) {
      logSum += Math.log(e);
      positive += 1;
    }
  }
  arith /= lagEnergy.length;
  if (arith === 0 || positive === 0) return 0;
  const geom = Math.exp(logSum / positive);
  return clamp01(geom / arith);
}

export function adjacentSampleRepetition(
  samples: ReadonlyArray<number>,
): number {
  if (samples.length < 2) return 0;
  let same = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i] === samples[i - 1]) same += 1;
  }
  return clamp01(same / (samples.length - 1));
}

// ---------------- image path (structural support) ----------------

/**
 * Extract a residual signature from raw image bytes. We treat bytes as a
 * 1-D sequence and apply the audio-style detectors at byte resolution. This
 * is sufficient for the structural test surface of Gate G13; full 2-D
 * forensic analysis is a future extension.
 */
export function extractImageSignature(bytes: Uint8Array): ResidualSignature {
  if (bytes.length === 0) {
    return {
      entropy: 0,
      burstiness: 0,
      spectralFlatness: 0,
      repetition: 0,
      kind: 'image',
    };
  }
  const samples = Array.from(bytes, (b) => (b - 128) / 128);
  const sig = extractAudioSignature(samples);
  return { ...sig, kind: 'image' };
}

// ---------------- helpers ----------------

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function coerceText(content: Asset['content']): string {
  if (typeof content === 'string') return content;
  if (content instanceof Uint8Array) {
    return new TextDecoder().decode(content);
  }
  return content.map((n) => String.fromCharCode(n & 0xff)).join('');
}

function coerceSamples(content: Asset['content']): number[] {
  if (typeof content === 'string') {
    const out: number[] = [];
    for (let i = 0; i < content.length; i++) {
      out.push((content.charCodeAt(i) - 128) / 128);
    }
    return out;
  }
  if (content instanceof Uint8Array) {
    return Array.from(content, (b) => (b - 128) / 128);
  }
  return content.slice();
}

function coerceBytes(content: Asset['content']): Uint8Array {
  if (typeof content === 'string') {
    return new TextEncoder().encode(content);
  }
  if (content instanceof Uint8Array) return content;
  return new Uint8Array(content.map((n) => n & 0xff));
}

/** Re-export for tests: the asset-kind narrowing helpers. */
export const _internal = {
  coerceText,
  coerceSamples,
  coerceBytes,
};

/** Re-export for tests / external classifiers. */
export type { AssetKind };
