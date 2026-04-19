/**
 * M5 — Steps-to-Execution Graph (KVFlow-analogue Agent Step Graph).
 *
 * Tracks co-activation transitions: given the currently-active skill, emit a
 * ranked list of predicted-next skills with confidence scores. The graph is
 * learned online from trace observations — each `observe(prev, next)` call
 * updates the transition counts; `predict(prev, topN)` returns the top-N
 * successors ranked by probability.
 *
 * Additionally supports higher-order prediction: the caller may supply a
 * short prefix (the last k skills) and the predictor consults both the
 * bigram (last-skill-only) and the k-gram when confidence permits, falling
 * back to unigram observations when neither is informed.
 *
 * NEW-LAYER: no filesystem IO, no Grove writes. Pure in-memory predictor.
 *
 * @module cache/step-graph
 */

import type { StepGraphNode } from '../types/memory.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StepGraphOptions {
  /**
   * Laplace smoothing factor for confidence computation. Default: 0.5.
   * Gives unseen transitions a nonzero probability of `alpha / (N + alpha*V)`.
   */
  smoothing?: number;

  /**
   * Maximum k-gram order retained (1 = bigram only, 2 = trigram, etc.).
   * Default: 2.
   */
  maxOrder?: number;
}

// ─── Observation counts ─────────────────────────────────────────────────────

interface SuccessorCounts {
  total: number;
  bySkill: Map<string, number>;
}

// ─── StepGraph ──────────────────────────────────────────────────────────────

/**
 * Online-learned step-graph predictor.
 *
 * @example
 * ```ts
 * const g = new StepGraph();
 * g.observe(['read'], 'edit');
 * g.observe(['read'], 'edit');
 * g.observe(['read'], 'bash');
 * const node = g.predict(['read'], 3);
 * // node.predictedNext: ['edit', 'bash'], node.confidence: ~0.67
 * ```
 */
export class StepGraph {
  private readonly smoothing: number;
  private readonly maxOrder: number;

  /** key: joined prefix, value: successor counts. */
  private readonly counts = new Map<string, SuccessorCounts>();
  /** All distinct successors ever observed (for smoothing vocabulary). */
  private readonly vocab = new Set<string>();
  /** Unigram counts — fallback predictor when no prefix context exists. */
  private readonly unigram: SuccessorCounts = { total: 0, bySkill: new Map() };

  constructor(opts: StepGraphOptions = {}) {
    this.smoothing = opts.smoothing ?? 0.5;
    this.maxOrder = opts.maxOrder ?? 2;
    if (this.smoothing < 0) {
      throw new RangeError(`smoothing must be >= 0, got ${this.smoothing}`);
    }
    if (this.maxOrder < 1) {
      throw new RangeError(`maxOrder must be >= 1, got ${this.maxOrder}`);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Observe a transition: after `prefix` (1..maxOrder skills), `next` fired.
   * Updates k-gram counts for all orders 1..min(prefix.length, maxOrder).
   */
  observe(prefix: string[], next: string): void {
    if (next.length === 0) return;
    this.vocab.add(next);
    this._bumpUnigram(next);
    const maxK = Math.min(prefix.length, this.maxOrder);
    for (let k = 1; k <= maxK; k++) {
      const slice = prefix.slice(prefix.length - k);
      const key = slice.join('\u0001');
      this._bump(key, next);
    }
  }

  /**
   * Predict the top-N most likely successors given the recent prefix.
   * Returns a StepGraphNode with `predictedNext` ranked high→low and
   * `confidence` = probability of the top-ranked successor.
   *
   * Backoff: tries longest k-gram first; falls back to shorter k-grams; then
   * to the unigram distribution. If no observations exist, returns empty.
   */
  predict(prefix: string[], topN = 3): StepGraphNode {
    const id = prefix.length === 0 ? '' : prefix[prefix.length - 1];

    // Try longest k-gram first (down to bigram) via backoff.
    const maxK = Math.min(prefix.length, this.maxOrder);
    for (let k = maxK; k >= 1; k--) {
      const slice = prefix.slice(prefix.length - k);
      const key = slice.join('\u0001');
      const cnt = this.counts.get(key);
      if (cnt && cnt.total > 0) {
        return this._rank(id, cnt, topN);
      }
    }
    // Backoff to unigram distribution.
    if (this.unigram.total > 0) {
      return this._rank(id, this.unigram, topN);
    }
    return { id, predictedNext: [], confidence: 0 };
  }

  /**
   * Evaluate top-N accuracy of the predictor on a list of ground-truth
   * transitions. Returns fraction in [0, 1] where the ground-truth `next`
   * appears in the predicted top-N list.
   */
  evaluateAccuracy(
    transitions: Array<{ prefix: string[]; next: string }>,
    topN = 3,
  ): number {
    if (transitions.length === 0) return 0;
    let correct = 0;
    for (const { prefix, next } of transitions) {
      const pred = this.predict(prefix, topN);
      if (pred.predictedNext.includes(next)) correct++;
    }
    return correct / transitions.length;
  }

  /** Count distinct k-gram prefixes learned. */
  size(): number {
    return this.counts.size;
  }

  /** Reset all state. */
  clear(): void {
    this.counts.clear();
    this.vocab.clear();
    this.unigram.total = 0;
    this.unigram.bySkill.clear();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _bump(key: string, next: string): void {
    let cnt = this.counts.get(key);
    if (!cnt) {
      cnt = { total: 0, bySkill: new Map() };
      this.counts.set(key, cnt);
    }
    cnt.total++;
    cnt.bySkill.set(next, (cnt.bySkill.get(next) ?? 0) + 1);
  }

  private _bumpUnigram(next: string): void {
    this.unigram.total++;
    this.unigram.bySkill.set(next, (this.unigram.bySkill.get(next) ?? 0) + 1);
  }

  private _rank(id: string, cnt: SuccessorCounts, topN: number): StepGraphNode {
    const V = Math.max(1, this.vocab.size);
    const denom = cnt.total + this.smoothing * V;
    // Build an array of (skill, prob) pairs for ranking.
    const ranked: Array<{ skill: string; prob: number }> = [];
    for (const [skill, c] of cnt.bySkill) {
      ranked.push({ skill, prob: (c + this.smoothing) / denom });
    }
    ranked.sort((a, b) => b.prob - a.prob);
    const top = ranked.slice(0, topN);
    return {
      id,
      predictedNext: top.map((r) => r.skill),
      confidence: top.length > 0 ? top[0].prob : 0,
    };
  }
}
