/**
 * MD-1 Shallow Learned Embeddings — co-occurrence pair extractor.
 *
 * Mines (center, context) entity pairs from an M3 DecisionTrace stream
 * using a sliding temporal window. Each trace contributes the set of
 * `refs.entityIds` it carries; pairs are formed between entities inside
 * the same trace and between entities in traces that fall within
 * `windowSize` of one another (ordered chronologically by `ts`).
 *
 * Deterministic: given a trace list sorted by `(ts, id)` and a window size,
 * the emitted pair sequence is fully determined.
 *
 * @module embeddings/co-occurrence
 */

import type { DecisionTrace } from '../types/memory.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single directed (center, context) co-occurrence pair. */
export interface CoOccurrencePair {
  center: string;
  context: string;
}

export interface CoOccurrenceOptions {
  /**
   * Number of adjacent traces (inclusive) on either side of the center
   * that contribute to its context set. Default 5 per MD-1 proposal.
   * `windowSize=1` means only same-trace pairs.
   */
  windowSize?: number;
  /**
   * Minimum number of times an entity must appear across all traces to
   * be included in the vocabulary. Default 2 (matches Mikolov 2013).
   * Rare entities are dropped entirely.
   */
  minCount?: number;
  /**
   * If `true`, same-trace same-entity pairs are dropped (center != context
   * always holds). Default `true`.
   */
  excludeSelfPairs?: boolean;
  /**
   * If `true`, deduplicate identical (center, context) pairs across the
   * whole stream. Default `false` — repeated co-occurrence is training
   * signal. Tests use `true` to assert extraction correctness.
   */
  deduplicate?: boolean;
}

export interface CoOccurrenceResult {
  /** Sorted vocabulary (entity ids passing minCount filter). */
  vocabulary: string[];
  /** Map from entity id → index into `vocabulary`. */
  vocabIndex: Map<string, number>;
  /** Emitted pairs using entity ids (pre-index). Order is deterministic. */
  pairs: CoOccurrencePair[];
  /** Raw frequency count of each vocab entity across all traces. */
  counts: Map<string, number>;
}

// ─── Core extraction ────────────────────────────────────────────────────────

/**
 * Extract co-occurrence pairs from a trace stream.
 *
 * Algorithm:
 *   1. Sort traces by `(ts, id)` for deterministic order.
 *   2. Count entity frequencies; drop entities with count < minCount.
 *   3. Build chronological list of entity-sets per trace.
 *   4. For each trace index i, emit pairs (e, f) where:
 *        - e ∈ traces[i].entities
 *        - f ∈ traces[j].entities for j in [i - (windowSize-1), i + (windowSize-1)]
 *        - (excludeSelfPairs ⇒ e ≠ f)
 *        - f ≠ e inside the same trace is always permitted when
 *          excludeSelfPairs is true.
 *      Note: `windowSize=1` collapses to intra-trace pairs only.
 *   5. Optionally deduplicate.
 *
 * The vocabulary is returned sorted ascending (string compare) for stable
 * index assignment across runs.
 */
export function extractCoOccurrencePairs(
  traces: readonly DecisionTrace[],
  options: CoOccurrenceOptions = {},
): CoOccurrenceResult {
  const windowSize = options.windowSize ?? 5;
  const minCount = options.minCount ?? 2;
  const excludeSelfPairs = options.excludeSelfPairs ?? true;
  const deduplicate = options.deduplicate ?? false;

  if (windowSize < 1) {
    throw new Error(`windowSize must be >= 1, got ${windowSize}`);
  }
  if (minCount < 1) {
    throw new Error(`minCount must be >= 1, got ${minCount}`);
  }

  // Step 1: sort traces deterministically.
  const sorted = traces.slice().sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  // Step 2: count entity frequencies (count each entity once per trace).
  const counts = new Map<string, number>();
  for (const t of sorted) {
    const ids = t.refs?.entityIds;
    if (!ids || ids.length === 0) continue;
    const seenInTrace = new Set<string>();
    for (const id of ids) {
      if (seenInTrace.has(id)) continue;
      seenInTrace.add(id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  // Filter vocabulary by minCount.
  const vocabulary = Array.from(counts.keys())
    .filter((id) => (counts.get(id) ?? 0) >= minCount)
    .sort();
  const vocabIndex = new Map<string, number>();
  vocabulary.forEach((id, i) => vocabIndex.set(id, i));

  // Step 3: project each trace to its in-vocab entity set (dedup within
  // trace; preserve deterministic order by sorting).
  const perTrace: string[][] = sorted.map((t) => {
    const ids = t.refs?.entityIds ?? [];
    const set = new Set<string>();
    for (const id of ids) {
      if (vocabIndex.has(id)) set.add(id);
    }
    return Array.from(set).sort();
  });

  // Step 4: emit pairs within the sliding window.
  const pairs: CoOccurrencePair[] = [];
  const seenPair = deduplicate ? new Set<string>() : null;
  const reach = windowSize - 1;

  for (let i = 0; i < perTrace.length; i++) {
    const lo = Math.max(0, i - reach);
    const hi = Math.min(perTrace.length - 1, i + reach);
    for (const e of perTrace[i]) {
      for (let j = lo; j <= hi; j++) {
        for (const f of perTrace[j]) {
          if (excludeSelfPairs && e === f) continue;
          if (seenPair !== null) {
            const key = `${e}\u0000${f}`;
            if (seenPair.has(key)) continue;
            seenPair.add(key);
          }
          pairs.push({ center: e, context: f });
        }
      }
    }
  }

  return { vocabulary, vocabIndex, pairs, counts };
}

// ─── Vocab-id projection ────────────────────────────────────────────────────

/**
 * Convert string pairs into integer pairs aligned with the vocabulary.
 * Pairs referencing out-of-vocab entities are dropped (can happen if the
 * caller mutates vocabulary after extraction).
 */
export function projectPairsToIds(
  pairs: readonly CoOccurrencePair[],
  vocabIndex: Map<string, number>,
): Array<{ center: number; context: number }> {
  const out: Array<{ center: number; context: number }> = [];
  for (const p of pairs) {
    const c = vocabIndex.get(p.center);
    const o = vocabIndex.get(p.context);
    if (c === undefined || o === undefined) continue;
    out.push({ center: c, context: o });
  }
  return out;
}
