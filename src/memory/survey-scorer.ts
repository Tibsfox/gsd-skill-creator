// src/memory/survey-scorer.ts
//
// Memory survey scorer for the OOPS-GSD per-turn memory-shed pipeline.
//
// Per docs/memory-schema.md §4:
//
//   score(entry) = relevance(context, entry) × half_life_decay(age, half_life) × confidence
//
// Pinned-rule entries (`type: 'pinned-rule'`) bypass the formula entirely
// and are NEVER shed. This is a HARD invariant enforced by
// CF-B-023-2 (`standing-rules-preservation.test.ts`).
//
// Distinct from the legacy `relevance-scorer.ts` / `memory-loader.ts` pair:
// that pair scores hot/warm/cold sections; the survey scorer scores by the
// 9-type taxonomy + half-life decay model defined in C3.P2 + C3.P3.
//
// Closes: OGA-006 (HIGH) + OGA-023 (BLOCK).

export type MemoryType =
  | 'project'
  | 'feedback'
  | 'decision'
  | 'reference'
  | 'user'
  | 'pinned-rule'
  | 'observation'
  | 'tactic'
  | 'question';

export type HalfLife = 'infinite' | '6mo' | '1mo' | '1wk' | 'transient';

export interface MemoryEntry {
  /** Stable identifier (filename without extension). */
  name: string;
  /** One-line summary, used as a relevance signal alongside the body. */
  description: string;
  type: MemoryType;
  half_life: HalfLife;
  /** ISO-8601 timestamp. */
  last_accessed: string;
  /** Confidence in `[0, 1]`. */
  confidence: number;
  body: string;
  /**
   * Estimated token cost of including this entry. Optional. Used by the
   * integration-fixture suite (CF-B-023-1) to compute the reduction ratio.
   */
  tokenCount?: number;
}

export interface ScoringConfig {
  /** Minimum score to keep. Default 0.3. */
  threshold?: number;
  /**
   * Pinned rules always pass. This is a HARD invariant; the option exists
   * only for clarity at the call site, but setting it false is rejected
   * at runtime so a reviewer who removes the line cannot accidentally
   * loosen the contract.
   */
  pinned_rule_passthrough?: true;
  /**
   * Wall-clock "now" for half-life decay. Defaults to `new Date()` at the
   * point of call; injectable for deterministic tests.
   */
  now?: Date;
}

export interface SurveyResult {
  kept: MemoryEntry[];
  shed: MemoryEntry[];
  /**
   * Per-entry scoring breakdown. Useful for debugging and for the
   * decision-trace ledger emission planned in C5.
   */
  scores: Array<{
    name: string;
    score: number;
    relevance: number;
    decay: number;
    confidence: number;
    pinned: boolean;
    reason: string;
  }>;
}

const HALF_LIFE_DAYS: Record<HalfLife, number> = {
  infinite: Number.POSITIVE_INFINITY,
  '6mo': 180,
  '1mo': 30,
  '1wk': 7,
  transient: 1,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const TOKEN_RE = /[A-Za-z0-9][A-Za-z0-9_-]+/g;

/**
 * Lowercase + tokenize a free-text input into a Set of words ≥ 2 chars.
 * Pure; no I/O.
 */
export function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  if (!text) return out;
  for (const match of text.toLowerCase().matchAll(TOKEN_RE)) {
    const t = match[0];
    if (t.length >= 2) out.add(t);
  }
  return out;
}

/**
 * Compute keyword-overlap relevance in `[0, 1]`. Both context and entry are
 * tokenized; overlap count is normalized by `min(|ctx|, k)` with `k=8`
 * so that very long contexts do not dilute the signal.
 */
export function relevance(context: string, entry: MemoryEntry): number {
  const ctxTokens = tokenize(context);
  if (ctxTokens.size === 0) return 0;
  const entryTokens = tokenize(
    `${entry.name} ${entry.description} ${entry.body}`,
  );
  if (entryTokens.size === 0) return 0;
  let overlap = 0;
  for (const t of ctxTokens) {
    if (entryTokens.has(t)) overlap++;
  }
  if (overlap === 0) return 0;
  const denom = Math.min(ctxTokens.size, 8);
  return clamp01(overlap / denom);
}

/**
 * Half-life exponential decay.
 *
 * `decay = 0.5 ^ (age_days / half_life_days)`.
 *
 * For `infinite`, decay is always 1.0. For invalid timestamps, decay
 * defaults to 1.0 (do not penalize entries we cannot date).
 */
export function halfLifeDecay(
  lastAccessedIso: string,
  halfLife: HalfLife,
  now: Date = new Date(),
): number {
  const halfLifeDays = HALF_LIFE_DAYS[halfLife];
  if (!Number.isFinite(halfLifeDays)) return 1.0;
  const t = Date.parse(lastAccessedIso);
  if (Number.isNaN(t)) return 1.0;
  const ageDays = Math.max(0, (now.getTime() - t) / MS_PER_DAY);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Survey the entries against the current task context and return
 * `{ kept, shed, scores }`. `kept` is sorted by descending score; ties
 * break on `name` ascending for deterministic output.
 *
 * **Hard invariant (CF-B-023-2):** entries with `type === 'pinned-rule'`
 * are ALWAYS in `kept`, regardless of score, threshold, or context. The
 * scorer must never shed a pinned-rule entry.
 */
export function survey(
  context: string,
  entries: MemoryEntry[],
  config: ScoringConfig = {},
): SurveyResult {
  // The pinned_rule_passthrough flag exists only to make the invariant
  // explicit at call sites. Setting it to anything other than true (or
  // omitting it) is the only allowed shape.
  if (
    config.pinned_rule_passthrough !== undefined &&
    config.pinned_rule_passthrough !== true
  ) {
    throw new Error(
      'survey-scorer: pinned_rule_passthrough must be true (or omitted). ' +
        'Pinned-rule passthrough is a HARD invariant — see CF-B-023-2.',
    );
  }

  const threshold = config.threshold ?? 0.3;
  const now = config.now ?? new Date();

  const kept: MemoryEntry[] = [];
  const shed: MemoryEntry[] = [];
  const scores: SurveyResult['scores'] = [];

  for (const entry of entries) {
    if (entry.type === 'pinned-rule') {
      kept.push(entry);
      scores.push({
        name: entry.name,
        score: 1.0,
        relevance: 1.0,
        decay: 1.0,
        confidence: clamp01(entry.confidence),
        pinned: true,
        reason: 'pinned-rule passthrough',
      });
      continue;
    }

    const r = relevance(context, entry);
    const d = halfLifeDecay(entry.last_accessed, entry.half_life, now);
    const c = clamp01(entry.confidence);
    const score = r * d * c;
    const reason =
      `relevance=${r.toFixed(3)} × decay=${d.toFixed(3)} × confidence=${c.toFixed(3)} = ${score.toFixed(3)}`;

    scores.push({
      name: entry.name,
      score,
      relevance: r,
      decay: d,
      confidence: c,
      pinned: false,
      reason,
    });

    if (score >= threshold) kept.push(entry);
    else shed.push(entry);
  }

  // Deterministic ordering: pinned first (score 1.0), then by descending
  // score, then by name ascending.
  kept.sort((a, b) => {
    if (a.type === 'pinned-rule' && b.type !== 'pinned-rule') return -1;
    if (b.type === 'pinned-rule' && a.type !== 'pinned-rule') return 1;
    const sa = scores.find((s) => s.name === a.name)?.score ?? 0;
    const sb = scores.find((s) => s.name === b.name)?.score ?? 0;
    if (sb !== sa) return sb - sa;
    return a.name.localeCompare(b.name);
  });

  return { kept, shed, scores };
}

/**
 * Sum the optional tokenCount field across an entry list. Returns 0 if any
 * entry omits tokenCount — callers who care about the reduction ratio
 * should populate the field themselves (see scorer-integration.test.ts).
 */
export function totalTokens(entries: MemoryEntry[]): number {
  let sum = 0;
  for (const e of entries) sum += e.tokenCount ?? 0;
  return sum;
}
