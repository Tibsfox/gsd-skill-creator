/**
 * M2 Hierarchical Hybrid Memory — αβγ Scorer
 *
 * Implements the three-axis memory scoring formula from Wang et al. 2024 §5:
 *
 *   score(e) = α · recency(ts) + β · relevance(query, e) + γ · importance(e)
 *
 * where:
 *   - recency(ts)       — exponential decay over age in hours
 *   - relevance(query)  — keyword overlap in [0, 1]
 *   - importance(e)     — annotation-based importance in [0, 1]
 *
 * Weights α + β + γ must be in [0, 1]. Default: α=0.4, β=0.4, γ=0.2.
 * Weights are validated at construction time.
 *
 * Pure + deterministic — no side effects, no IO.
 *
 * @module memory/scorer
 * @see Wang et al. 2024, "A Survey on Large Language Model based Autonomous
 *      Agents", §5 Memory.
 */

import type { MemoryEntry } from '../types/memory.js';

// ─── Config ──────────────────────────────────────────────────────────────────

export interface ScorerConfig {
  /** Weight for recency axis. Default: 0.4. Must be in [0, 1]. */
  alpha?: number;
  /** Weight for relevance axis. Default: 0.4. Must be in [0, 1]. */
  beta?: number;
  /** Weight for importance axis. Default: 0.2. Must be in [0, 1]. */
  gamma?: number;
  /** Recency decay half-life in hours. Default: 24. */
  halfLifeHours?: number;
}

export const DEFAULT_ALPHA = 0.4;
export const DEFAULT_BETA  = 0.4;
export const DEFAULT_GAMMA = 0.2;
export const DEFAULT_HALF_LIFE_HOURS = 24;

// ─── Score components ─────────────────────────────────────────────────────────

/** The three raw signal components before weighting. */
export interface ScoreComponents {
  recency: number;
  relevance: number;
  importance: number;
  /** Final weighted score = α·recency + β·relevance + γ·importance */
  score: number;
}

// ─── Keyword helpers ──────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'is', 'it', 'this', 'that', 'with', 'as', 'by', 'from', 'are',
  'was', 'be', 'has', 'had', 'have', 'not', 'no', 'do', 'does', 'did',
]);

/** Tokenize text to a lowercase Set, stripping punctuation and stop words. */
export function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/);
  const tokens = new Set<string>();
  for (const w of words) {
    if (w.length > 1 && !STOP_WORDS.has(w)) tokens.add(w);
  }
  return tokens;
}

/**
 * Jaccard-like relevance: |query ∩ content| / |query|.
 * Returns 0 when query is empty, 1 when all query terms appear in content.
 */
export function keywordRelevance(
  queryTokens: Set<string>,
  contentTokens: Set<string>,
): number {
  if (queryTokens.size === 0) return 0;
  let hits = 0;
  for (const t of queryTokens) {
    if (contentTokens.has(t)) hits++;
  }
  return hits / queryTokens.size;
}

// ─── Recency ──────────────────────────────────────────────────────────────────

/**
 * Exponential decay recency signal.
 *
 *   recency = exp(-ln(2) * ageHours / halfLifeHours)
 *
 * This gives recency = 1.0 at ts=now, 0.5 at ts=halfLife, approaching 0 for
 * old entries. Matches the standard discrete forgetting curve used in Wang §5.
 */
export function recencyScore(tsMs: number, nowMs: number, halfLifeHours: number): number {
  const ageHours = Math.max(0, (nowMs - tsMs) / (1000 * 60 * 60));
  return Math.exp((-Math.LN2 * ageHours) / halfLifeHours);
}

// ─── Importance ───────────────────────────────────────────────────────────────

/**
 * Importance signal derived from the MemoryEntry's annotation fields.
 *
 * MemoryEntry carries `alpha`, `beta`, `gamma` as per-entry axis weights
 * (set by the writer as importance hints). We use the `gamma` field directly
 * as the importance annotation. When gamma > 0.2 (above default), the entry
 * is more important; when 0, it carries no annotation boost.
 *
 * Clamped to [0, 1].
 */
export function importanceScore(entry: MemoryEntry): number {
  return Math.max(0, Math.min(1, entry.gamma));
}

// ─── Scorer ───────────────────────────────────────────────────────────────────

/**
 * αβγ scorer implementing Wang et al. 2024 §5 three-axis memory scoring.
 *
 * @example
 * ```ts
 * const scorer = new MemoryScorer({ alpha: 0.4, beta: 0.4, gamma: 0.2 });
 * const ranked = scorer.rank(entries, 'debugging session', 10);
 * ```
 */
export class MemoryScorer {
  readonly alpha: number;
  readonly beta: number;
  readonly gamma: number;
  readonly halfLifeHours: number;

  constructor(config: ScorerConfig = {}) {
    const alpha = config.alpha ?? DEFAULT_ALPHA;
    const beta  = config.beta  ?? DEFAULT_BETA;
    const gamma = config.gamma ?? DEFAULT_GAMMA;

    if (alpha < 0 || alpha > 1) throw new RangeError(`alpha must be in [0,1], got ${alpha}`);
    if (beta  < 0 || beta  > 1) throw new RangeError(`beta must be in [0,1], got ${beta}`);
    if (gamma < 0 || gamma > 1) throw new RangeError(`gamma must be in [0,1], got ${gamma}`);

    this.alpha = alpha;
    this.beta  = beta;
    this.gamma = gamma;
    this.halfLifeHours = config.halfLifeHours ?? DEFAULT_HALF_LIFE_HOURS;
  }

  /**
   * Score a single entry against a query string.
   * Returns all three components plus the final weighted score.
   */
  scoreEntry(
    entry: MemoryEntry,
    queryTokens: Set<string>,
    nowMs = Date.now(),
  ): ScoreComponents {
    const recency    = recencyScore(entry.ts, nowMs, this.halfLifeHours);
    const relevance  = keywordRelevance(queryTokens, tokenize(entry.content));
    const importance = importanceScore(entry);
    const score      = this.alpha * recency + this.beta * relevance + this.gamma * importance;

    return { recency, relevance, importance, score };
  }

  /**
   * Score all entries and return sorted (desc) slice of top-k with scores.
   */
  rank(
    entries: MemoryEntry[],
    query: string,
    topK = 10,
    nowMs = Date.now(),
  ): Array<{ entry: MemoryEntry; components: ScoreComponents }> {
    const queryTokens = tokenize(query);
    const scored = entries.map((entry) => ({
      entry,
      components: this.scoreEntry(entry, queryTokens, nowMs),
    }));

    scored.sort((a, b) => b.components.score - a.components.score);
    return scored.slice(0, topK);
  }

  /**
   * Score entries and return their updated `score` field values.
   * Mutates each entry's `score` field in-place.
   */
  applyScores(
    entries: MemoryEntry[],
    query: string,
    nowMs = Date.now(),
  ): MemoryEntry[] {
    const queryTokens = tokenize(query);
    for (const entry of entries) {
      const { score } = this.scoreEntry(entry, queryTokens, nowMs);
      entry.score = score;
    }
    return entries;
  }
}

/** Default singleton scorer with Wang-survey default weights. */
export const defaultScorer = new MemoryScorer();
