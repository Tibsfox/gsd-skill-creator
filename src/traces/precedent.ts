/**
 * M3 Decision-Trace Ledger — semantic-handoff precedent query.
 *
 * Given a new task intent, returns the top-k historical DecisionTraces whose
 * intent signature is most similar.  Each result preserves intent / reasoning /
 * constraints / alternatives in full (lossless round-trip, CF-M3-03).
 *
 * Similarity algorithm:
 *   Token-overlap Jaccard similarity on normalised intent tokens.
 *   No embedding model required (no new runtime deps).  Tunable threshold.
 *   Returns results sorted descending by similarity score.
 *
 * The query is intentionally conservative: it returns empty when the log is
 * empty or no trace meets the threshold, rather than surfacing false matches.
 * The threshold is tunable and defaults to 0.05 (low floor) so the API is
 * useful out of the box while still filtering pure noise.
 *
 * Phase 644, Wave 1 Track D (M3).
 *
 * @module traces/precedent
 */

import { readTraces } from './reader.js';
import type { DecisionTrace } from '../types/memory.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default top-k results to return. */
export const DEFAULT_TOP_K = 5;

/** Default minimum Jaccard similarity threshold (0–1). */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.05;

// ─── Tokenisation ─────────────────────────────────────────────────────────────

/** Stop-words filtered out before token overlap. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'that', 'this', 'it', 'as', 'not',
]);

/**
 * Normalise an intent string into a set of lowercase alpha tokens,
 * excluding stop-words and tokens shorter than 3 characters.
 */
export function tokenise(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

/**
 * Jaccard similarity between two token sets: |A ∩ B| / |A ∪ B|.
 * Returns 0 when both sets are empty.
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Precedent result ────────────────────────────────────────────────────────

export interface PrecedentResult {
  /** Similarity score (0–1). */
  score: number;
  /** Full lossless DecisionTrace. */
  trace: DecisionTrace;
}

// ─── Query function ───────────────────────────────────────────────────────────

/**
 * Query historical traces for precedent on a new task intent.
 *
 * Returns the top-k traces ranked by intent similarity, filtered to those
 * meeting `minSimilarity`.  Each result includes the full trace (intent,
 * reasoning, constraints, alternatives) — lossless round-trip (CF-M3-03).
 *
 * @param newIntent   - Intent string for the new task
 * @param logPath     - Path to the decisions JSONL log
 * @param topK        - Maximum results to return
 * @param minSimilarity - Minimum Jaccard score to include a result
 */
export async function queryPrecedent(
  newIntent: string,
  logPath: string,
  topK: number = DEFAULT_TOP_K,
  minSimilarity: number = DEFAULT_SIMILARITY_THRESHOLD,
): Promise<PrecedentResult[]> {
  const traces = await readTraces(logPath);
  if (traces.length === 0) return [];

  const queryTokens = tokenise(newIntent);

  const scored: PrecedentResult[] = traces
    .map((trace) => ({
      score: jaccardSimilarity(queryTokens, tokenise(trace.intent)),
      trace,
    }))
    .filter((r) => r.score >= minSimilarity)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

// ─── PrecedentEngine class ────────────────────────────────────────────────────

/**
 * Stateful precedent query engine bound to a log path.
 * Used by M5 applicator and M4 branch lifecycle.
 */
export class PrecedentEngine {
  constructor(
    private readonly logPath: string,
    private readonly topK: number = DEFAULT_TOP_K,
    private readonly minSimilarity: number = DEFAULT_SIMILARITY_THRESHOLD,
  ) {}

  /**
   * Return top-k precedents for the given intent.
   * Lossless: full trace returned per result (CF-M3-03).
   */
  query(newIntent: string): Promise<PrecedentResult[]> {
    return queryPrecedent(newIntent, this.logPath, this.topK, this.minSimilarity);
  }

  /** Utility: tokenise an intent string (exposed for testing). */
  static tokenise(text: string): Set<string> {
    return tokenise(text);
  }

  /** Utility: Jaccard similarity (exposed for testing). */
  static jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    return jaccardSimilarity(a, b);
  }
}
