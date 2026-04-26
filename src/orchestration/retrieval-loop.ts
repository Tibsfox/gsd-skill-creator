/**
 * M5 — Multi-Turn Retrieval Loop (RAGSearch adaptation).
 *
 * Replaces single-turn skill retrieval with a bounded multi-turn loop: each
 * turn harvests evidence tokens from prior top-k, expands the query, and
 * re-scores the candidate set. The final ranking is the UNION over all
 * turns, each document keeping its best-observed score. This implements
 * RAGSearch's iterative refinement: hop-1 documents surface on turn 1 with
 * the raw query, and hop-2 documents surface on later turns because the
 * expanded query now shares vocabulary with them.
 *
 * Scoring inside the loop uses a count-based relevance metric (raw number of
 * query-token matches in the content), deliberately unnormalised by query
 * length. Normalised scoring (the αβγ scorer's `hits / |query|`) would
 * PENALISE the very expansion the loop relies on, so the selector is bypassed
 * for retrieval turns and used instead for activation-time gating.
 *
 * The retrieval loop still writes an M3 activation trace (via the optional
 * ActivationWriter) summarising the final top-k decision.
 *
 * Terminates on:
 *   - max turns reached
 *   - no new evidence harvested (the query cannot grow)
 *   - top-k convergence across consecutive turns
 *
 * @module orchestration/retrieval-loop
 */

import type { SelectorDecision, SelectorOptions } from './selector.js';
import { ActivationWriter } from '../traces/activation-writer.js';
import { anytimeGate, type AnytimeGateConfig } from './anytime-gate.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RetrievalDocument {
  /** Document id. */
  id: string;
  /** Searchable text body. */
  content: string;
  /** Optional importance hint in [0,1]. */
  importance?: number;
  /** Optional timestamp for recency. */
  ts?: number;
}

export interface RetrievalOptions {
  /** Max turns the loop may run. Default: 3. */
  maxTurns?: number;
  /** Top-k results per turn and in the final ranking. Default: 5. */
  topK?: number;
  /**
   * Convergence check: if the top-k ids of the previous turn equal those of
   * the current turn, the loop exits. Default: true.
   */
  detectConvergence?: boolean;
  /**
   * Number of distinctive evidence tokens to carry forward from each turn's
   * top-k. Default: 4.
   */
  evidenceTokensPerTurn?: number;
  /**
   * Selector options, accepted for API symmetry with retrieveSingleTurn.
   * Only `writer` is actually consumed by the multi-turn loop (to emit the
   * final activation trace). All other fields are forwarded to the selector
   * inside retrieveSingleTurn.
   */
  selector?: Omit<SelectorOptions, 'topK'>;

  /**
   * JP-002 — opt-in anytime-valid early-stop. When supplied, the loop feeds
   * a per-turn stability metric into an anytime-valid gate (Ville's-inequality
   * e-process); the loop exits early as soon as the gate rejects with at least
   * `minTurns` observations. The Type-I error bound holds at any sample size,
   * so the early stop is safe under continuous peeking.
   *
   * The default `metric` is the signed Jaccard similarity of the current and
   * previous top-k id lists, mapped from [0, 1] to [-1, 1] (1.0 = identical
   * top-k → metric +1; 0.0 = disjoint → metric -1). Callers can override with
   * any bounded-in-[-1,1] stability signal.
   *
   * `convergence: 'anytime'` is set on `RetrievalResult` when this branch
   * fires. When omitted, retrieval termination follows the original policy
   * (max turns / convergence by exact-order match / no new evidence).
   */
  anytimeStop?: {
    /** E-process configuration (e.g. `{ alpha: 0.05, hypothesis: 'one-sided' }`). */
    config?: AnytimeGateConfig;
    /** Minimum turns required before the gate may fire. Default: 2. */
    minTurns?: number;
    /**
     * Stability metric — must return a value in [-1, 1].
     * Default: `2 * jaccard(current, previous) - 1`.
     */
    metric?: (current: string[], previous: string[]) => number;
  };
}

export interface TurnResult {
  /** 1-based turn index. */
  turn: number;
  /** Query used this turn (original + evidence tokens). */
  query: string;
  /** Top-k decisions this turn. */
  decisions: SelectorDecision[];
  /** Evidence tokens harvested from this turn's top-k (for next turn). */
  evidence: string[];
}

export interface RetrievalResult {
  /** Final top-k document ids ordered by best-observed score. */
  topK: string[];
  /** Detailed per-turn history. */
  turns: TurnResult[];
  /** True if the loop exited on stable top-k rather than maxTurns. */
  converged: boolean;
  /**
   * Reason the loop exited.
   *   - `'max-turns'` — the loop ran maxTurns and did not converge
   *   - `'stable-order'` — top-k id order matched the previous turn's
   *   - `'no-evidence'` — no new evidence tokens harvested this turn
   *   - `'anytime'` — JP-002 anytime-valid gate rejected (early stop)
   */
  exitReason: 'max-turns' | 'stable-order' | 'no-evidence' | 'anytime';
}

// ─── Scoring primitives (retrieval-local) ───────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','is','it',
  'this','that','with','as','by','from','are','was','be','has','had','have',
  'not','no','do','does','did',
]);

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/);
  const tokens = new Set<string>();
  for (const w of words) {
    if (w.length > 1 && !STOP_WORDS.has(w)) tokens.add(w);
  }
  return tokens;
}

/**
 * Count-based relevance: number of query tokens present in the content.
 * Unnormalised by query length, so expanding the query adds signal instead
 * of diluting it.
 */
function countMatches(queryTokens: Set<string>, contentTokens: Set<string>): number {
  let hits = 0;
  for (const t of queryTokens) if (contentTokens.has(t)) hits++;
  return hits;
}

/**
 * Extract the top-N most distinctive terms from a document's content, ranked
 * by length (longer terms tend to be more distinctive) with stop-words and
 * already-seen tokens filtered. Deterministic.
 */
function extractEvidence(
  content: string,
  n: number,
  exclude: Set<string>,
): string[] {
  const tokens = content.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/);
  const seen = new Set<string>();
  const out: Array<{ tok: string; len: number }> = [];
  for (const t of tokens) {
    if (t.length < 4 || STOP_WORDS.has(t) || exclude.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push({ tok: t, len: t.length });
  }
  out.sort((a, b) => b.len - a.len || (a.tok < b.tok ? -1 : a.tok > b.tok ? 1 : 0));
  return out.slice(0, n).map((x) => x.tok);
}

function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Jaccard similarity of two id lists, ignoring order.
 * Returns 1.0 for identical sets, 0.0 for disjoint, NaN for two empty lists.
 */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return Number.NaN;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? Number.NaN : inter / union;
}

/**
 * Default JP-002 stability metric: signed Jaccard mapped from [0,1] to [-1,1].
 * Returns 0 (no evidence either way) when both lists are empty.
 */
function defaultStabilityMetric(current: string[], previous: string[]): number {
  const j = jaccard(current, previous);
  if (Number.isNaN(j)) return 0;
  return 2 * j - 1;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Run the multi-turn retrieval loop.
 *
 * Turn loop:
 *   1. Tokenise the current query (query + accumulated evidence).
 *   2. Score every doc by raw query-token match count; keep the top-k.
 *   3. For each doc, remember its best-observed score across all turns.
 *   4. Harvest new evidence tokens from the turn's top-k; append to query.
 *   5. Exit on convergence / max turns / no new evidence.
 *
 * Final ranking: across-turn UNION, each doc's best score used for ordering.
 */
export async function retrieve(
  query: string,
  docs: RetrievalDocument[],
  opts: RetrievalOptions = {},
): Promise<RetrievalResult> {
  const maxTurns = opts.maxTurns ?? 3;
  const topK = opts.topK ?? 5;
  const detectConvergence = opts.detectConvergence ?? true;
  const evidenceTokensPerTurn = opts.evidenceTokensPerTurn ?? 4;

  if (maxTurns < 1) {
    throw new RangeError(`maxTurns must be >= 1, got ${maxTurns}`);
  }

  const turns: TurnResult[] = [];
  const originalTokens = tokenize(query);
  let currentQueryTokens = new Set(originalTokens);
  let currentQuery = query;
  const accumulatedEvidence = new Set<string>();
  let previousTopIds: string[] = [];
  let converged = false;
  let exitReason: RetrievalResult['exitReason'] = 'max-turns';

  // JP-002 anytime-valid early-stop gate (created only when opts.anytimeStop
  // is supplied; otherwise undefined and the loop runs the original policy).
  const anytimeMinTurns = opts.anytimeStop?.minTurns ?? 2;
  const anytimeMetric = opts.anytimeStop?.metric ?? defaultStabilityMetric;
  const anytimeStopGate = opts.anytimeStop
    ? anytimeGate.create(opts.anytimeStop.config ?? {})
    : null;

  // Union: docId → best-observed match count across turns.
  const bestScore = new Map<string, number>();
  // Track per-doc tokenisation once.
  const docTokens = new Map<string, Set<string>>();
  for (const d of docs) docTokens.set(d.id, tokenize(d.content));

  for (let t = 1; t <= maxTurns; t++) {
    // Score every doc against the current query-token set.
    const scored: Array<{ id: string; score: number }> = [];
    for (const d of docs) {
      const score = countMatches(currentQueryTokens, docTokens.get(d.id)!);
      scored.push({ id: d.id, score });
    }
    scored.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const turnTop = scored.slice(0, topK);
    const ids = turnTop.map((s) => s.id);

    // Accumulate best-observed scores across turns.
    for (const s of turnTop) {
      const prev = bestScore.get(s.id) ?? 0;
      if (s.score > prev) bestScore.set(s.id, s.score);
    }

    // Build per-turn SelectorDecision shells (for logging / trace).
    const decisions: SelectorDecision[] = turnTop.map((s) => ({
      id: s.id,
      score: s.score,
      signals: { m2Score: s.score, m1Boost: 0, stepBoost: 0, sensoria: null },
      activated: s.score > 0,
    }));

    // Harvest new evidence from top-k (exclude original query & existing evidence).
    const exclude = new Set(originalTokens);
    for (const e of accumulatedEvidence) exclude.add(e);
    const turnEvidence: string[] = [];
    for (const s of turnTop) {
      const doc = docs.find((x) => x.id === s.id);
      if (!doc) continue;
      const ev = extractEvidence(doc.content, evidenceTokensPerTurn, exclude);
      for (const tok of ev) {
        if (accumulatedEvidence.has(tok)) continue;
        turnEvidence.push(tok);
        accumulatedEvidence.add(tok);
        exclude.add(tok);
        if (turnEvidence.length >= evidenceTokensPerTurn) break;
      }
      if (turnEvidence.length >= evidenceTokensPerTurn) break;
    }

    turns.push({ turn: t, query: currentQuery, decisions, evidence: turnEvidence });

    // Convergence check (by top-k id order).
    if (detectConvergence && t > 1 && sameOrder(ids, previousTopIds)) {
      converged = true;
      exitReason = 'stable-order';
      break;
    }

    // JP-002 anytime-valid early-stop. Feeds the per-turn stability metric
    // into the e-process; the gate's Type-I bound holds at any sample size,
    // so peeking after every turn is safe. Skip turn 1 (no `previous` yet).
    if (anytimeStopGate && t > 1) {
      const stability = anytimeMetric(ids, previousTopIds);
      const r = anytimeStopGate.evaluate(stability);
      if (r.rejected && t >= anytimeMinTurns) {
        converged = true;
        exitReason = 'anytime';
        previousTopIds = ids;
        break;
      }
    }

    previousTopIds = ids;

    if (turnEvidence.length === 0) {
      converged = true;
      exitReason = 'no-evidence';
      break;
    }
    currentQuery = `${query} ${[...accumulatedEvidence].join(' ')}`;
    currentQueryTokens = tokenize(currentQuery);
  }

  // Final: UNION across turns, ranked by best-observed score.
  const finalSorted: Array<{ id: string; score: number }> = [];
  for (const [id, score] of bestScore) finalSorted.push({ id, score });
  finalSorted.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const finalTopK = finalSorted.slice(0, topK).map((x) => x.id);

  // Optionally emit one summary M3 trace covering the whole retrieval call.
  const writer = opts.selector?.writer ?? null;
  if (writer instanceof ActivationWriter) {
    try {
      await writer.activation({
        actor: 'm5-retrieval-loop',
        intent: `multi-turn retrieve: ${query}`,
        reasoning: `turns=${turns.length} converged=${converged} topK=${finalTopK.length}`,
        constraints: [`maxTurns:${maxTurns}`, `topK:${topK}`],
        alternatives: [],
        outcome: `ids:${finalTopK.join(',')}`,
        entityIds: finalTopK,
      });
    } catch {
      // Trace failure is non-fatal.
    }
  }

  return { topK: finalTopK, turns, converged, exitReason };
}

/**
 * Single-turn baseline: one scoring pass, no evidence expansion. Control path
 * for CF-M5-01 recall comparisons and safe fallback when the multi-turn loop
 * is disabled.
 */
export async function retrieveSingleTurn(
  query: string,
  docs: RetrievalDocument[],
  opts: { topK?: number; selector?: Omit<SelectorOptions, 'topK'> } = {},
): Promise<RetrievalResult> {
  const topK = opts.topK ?? 5;
  const queryTokens = tokenize(query);
  const scored: Array<{ id: string; score: number }> = [];
  for (const d of docs) {
    const content = tokenize(d.content);
    scored.push({ id: d.id, score: countMatches(queryTokens, content) });
  }
  scored.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const turnTop = scored.slice(0, topK);

  const decisions: SelectorDecision[] = turnTop.map((s) => ({
    id: s.id,
    score: s.score,
    signals: { m2Score: s.score, m1Boost: 0, stepBoost: 0, sensoria: null },
    activated: s.score > 0,
  }));

  const writer = opts.selector?.writer ?? null;
  if (writer instanceof ActivationWriter) {
    try {
      await writer.activation({
        actor: 'm5-retrieval-single-turn',
        intent: `single-turn retrieve: ${query}`,
        reasoning: `topK=${turnTop.length}`,
        constraints: [`topK:${topK}`],
        alternatives: [],
        outcome: `ids:${turnTop.map(x => x.id).join(',')}`,
        entityIds: turnTop.map((x) => x.id),
      });
    } catch {
      /* ignore */
    }
  }

  return {
    topK: turnTop.map((x) => x.id),
    turns: [{ turn: 1, query, decisions, evidence: [] }],
    converged: true,
    exitReason: 'stable-order',
  };
}
