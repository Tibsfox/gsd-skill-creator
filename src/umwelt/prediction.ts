/**
 * M7 Umwelt — prediction channel.
 *
 * Given a posterior q(I) over intent classes and the generative model,
 * compute the predicted distribution over the next observation type:
 *
 *     p_pred(o) = sum_i q(i) · p(o | i)
 *
 * On each tick the caller provides the actual observed distribution over
 * observation types (for a bundle, an empirical count); we compute
 * KL(p_actual || p_pred) and log a `SurpriseEntry` when the normalised
 * sigma exceeds a configurable threshold (default 3σ).
 *
 * Raw entries are FIFO-evicted past a configurable age/limit to prevent
 * unbounded log growth; reflection passes (M5 / M7 aggregation) are
 * expected to compress raw entries into higher-level summary types
 * separately.
 *
 * @module umwelt/prediction
 */

import type { GenerativeModel, SurpriseEntry } from '../types/umwelt.js';

export type { SurpriseEntry };

export interface SurpriseChannelOptions {
  /** Sigma threshold above which to flag `triggered=true`. Default 3. */
  sigmaThreshold?: number;
  /** Max raw entries retained before FIFO eviction. Default 10_000. */
  maxEntries?: number;
  /** Rolling window length (entries) for mean/std of the KL stream. Default 200. */
  windowSize?: number;
}

/**
 * Predicted next-observation distribution. `predicted[j]` = p(obs = j).
 */
export function predictNextObservation(
  q: readonly number[],
  model: GenerativeModel,
): number[] {
  const n = model.intentClasses.length;
  if (n === 0) return [];
  const m = model.condProbTable[0]?.length ?? 0;
  const out = new Array<number>(m).fill(0);
  for (let i = 0; i < n; i++) {
    const qi = q[i] ?? 0;
    if (qi <= 0) continue;
    const row = model.condProbTable[i];
    for (let j = 0; j < m; j++) out[j] += qi * row[j];
  }
  // Renormalise against floating-point drift
  let s = 0;
  for (const v of out) s += v;
  if (s > 0) for (let j = 0; j < m; j++) out[j] /= s;
  return out;
}

/**
 * KL-divergence D_KL(p || q). Used as the surprise signal against the
 * predicted distribution. Asymmetric — we use p = actual, q = predicted
 * so that "surprise" = excess evidence under actual not explained by
 * model.
 */
export function klDivergence(
  pActual: readonly number[],
  qPredicted: readonly number[],
): number {
  let kl = 0;
  for (let j = 0; j < pActual.length; j++) {
    const p = pActual[j];
    const q = qPredicted[j] ?? 0;
    if (p <= 0) continue;
    if (q <= 0) return Number.POSITIVE_INFINITY;
    kl += p * (Math.log(p) - Math.log(q));
  }
  return kl;
}

/**
 * Top-K indices of the predicted distribution, sorted by descending
 * probability. Ties broken by index. Used for CF-M7-04 (top-5 ≥70%).
 */
export function topK(predicted: readonly number[], k: number): number[] {
  const indexed = predicted.map((p, i) => [p, i] as const);
  indexed.sort((a, b) => {
    if (b[0] !== a[0]) return b[0] - a[0];
    return a[1] - b[1];
  });
  return indexed.slice(0, k).map(([, i]) => i);
}

/**
 * Online surprise channel. Maintains a rolling window of KL values,
 * computes a running mean/std, flags `triggered` when the current KL
 * exceeds `mean + sigmaThreshold * std`, FIFO-evicts raw entries past
 * `maxEntries`.
 */
export class SurpriseChannel {
  private readonly entries: SurpriseEntry[] = [];
  private readonly window: number[] = [];
  private readonly sigmaThreshold: number;
  private readonly maxEntries: number;
  private readonly windowSize: number;

  constructor(options: SurpriseChannelOptions = {}) {
    this.sigmaThreshold = options.sigmaThreshold ?? 3;
    this.maxEntries = options.maxEntries ?? 10_000;
    this.windowSize = options.windowSize ?? 200;
  }

  /**
   * Record a surprise tick. Returns the `SurpriseEntry` that was logged.
   * Callers pass the already-computed KL divergence so this class stays
   * agnostic to how the model generated it.
   */
  record(kl: number, ts: number = Date.now()): SurpriseEntry {
    const { mean, std } = this.windowStats();
    const sigma = std > 0 ? (kl - mean) / std : 0;
    const triggered = sigma >= this.sigmaThreshold;
    const entry: SurpriseEntry = { ts, klDivergence: kl, sigma, triggered };
    this.entries.push(entry);
    this.window.push(kl);
    if (this.window.length > this.windowSize) this.window.shift();
    if (this.entries.length > this.maxEntries) this.entries.shift();
    return entry;
  }

  /** Snapshot the current log (shallow copy, chronological order). */
  snapshot(): SurpriseEntry[] {
    return [...this.entries];
  }

  size(): number {
    return this.entries.length;
  }

  /** Rolling mean and std over the current window. */
  private windowStats(): { mean: number; std: number } {
    const n = this.window.length;
    if (n < 2) return { mean: 0, std: 0 };
    let mean = 0;
    for (const v of this.window) mean += v;
    mean /= n;
    let variance = 0;
    for (const v of this.window) {
      const d = v - mean;
      variance += d * d;
    }
    variance /= n - 1;
    return { mean, std: Math.sqrt(Math.max(0, variance)) };
  }
}
