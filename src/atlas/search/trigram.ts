/**
 * Trigram index — clean-room primitive for fast substring search at scale.
 *
 * Algorithm: each indexed text is decomposed into overlapping length-3
 * character n-grams. The index maps each trigram to the set of item ids
 * that contain it. A query's trigrams are intersected (smallest set first
 * with early-out) to produce a small candidate set, which is then re-ranked
 * by `compositeScore` from `./scorer.js`.
 *
 * Targets: <1ms typical, <5ms p99 on 50K items / 8-char queries.
 *
 * See CITATION.md for algorithm references (Manber & Wu agrep / glimpse,
 * standard IR-textbook trigram tokenization).
 */

import type { TrigramIndexOptions } from './types.js';
import { compositeScore } from './scorer.js';

const TRIGRAM_LEN = 3;

function trigramsOf(text: string, out: Set<string>): void {
  const n = text.length;
  if (n < TRIGRAM_LEN) {
    // For very short texts, still index the whole thing as a degenerate gram
    // so 1-2 char items remain findable.
    if (n > 0) out.add(text);
    return;
  }
  for (let i = 0; i <= n - TRIGRAM_LEN; i++) {
    out.add(text.slice(i, i + TRIGRAM_LEN));
  }
}

export class TrigramIndex<T> {
  private readonly opts: Required<TrigramIndexOptions>;
  private readonly grams = new Map<string, Set<number>>();
  private readonly items: T[] = [];
  private readonly texts: string[] = []; // normalized text, parallel to items
  private nextId = 0;

  constructor(opts: TrigramIndexOptions = {}) {
    this.opts = {
      caseInsensitive: opts.caseInsensitive ?? true,
      maxCandidates: opts.maxCandidates ?? 1024,
    };
  }

  size(): number {
    return this.items.length;
  }

  add(item: T, text: string): void {
    const normalized = this.opts.caseInsensitive ? text.toLowerCase() : text;
    const id = this.nextId++;
    this.items.push(item);
    this.texts.push(normalized);
    const grams = new Set<string>();
    trigramsOf(normalized, grams);
    for (const g of grams) {
      let bucket = this.grams.get(g);
      if (!bucket) {
        bucket = new Set<number>();
        this.grams.set(g, bucket);
      }
      bucket.add(id);
    }
  }

  /**
   * Returns the top items matching `query`, ranked by composite score.
   * `limit` controls top-k truncation (default 50).
   */
  search(query: string, limit = 50): T[] {
    if (query.length === 0) return [];
    const q = this.opts.caseInsensitive ? query.toLowerCase() : query;

    let candidates: Set<number> | null = null;

    if (q.length < TRIGRAM_LEN) {
      // Query shorter than a trigram — fall back to substring scan.
      // The trigram inverted index can't help (no length-3 windows exist),
      // so we walk the stored normalized texts directly. Fast at our scale
      // because q is tiny and indexOf is highly optimized.
      const ids: number[] = [];
      for (let i = 0; i < this.texts.length; i++) {
        if (this.texts[i].includes(q)) ids.push(i);
      }
      candidates = new Set(ids);
    } else {
      const queryGrams: string[] = [];
      {
        const set = new Set<string>();
        trigramsOf(q, set);
        for (const g of set) queryGrams.push(g);
      }
      // Order grams by bucket size ascending for cheapest intersection.
      const buckets = queryGrams.map((g) => this.grams.get(g));
      // If any gram is missing, no match possible.
      if (buckets.some((b) => !b || b.size === 0)) return [];
      const sorted = buckets
        .filter((b): b is Set<number> => b !== undefined)
        .sort((a, b) => a.size - b.size);

      candidates = new Set<number>(sorted[0]);
      for (let i = 1; i < sorted.length && candidates.size > 0; i++) {
        const next = sorted[i];
        const surviving = new Set<number>();
        for (const id of candidates) {
          if (next.has(id)) surviving.add(id);
        }
        candidates = surviving;
        if (candidates.size === 0) break;
      }
    }

    if (!candidates || candidates.size === 0) return [];

    // Cap candidate set so a degenerate query (e.g. a single very common
    // trigram) cannot blow up scoring time.
    const idArray =
      candidates.size > this.opts.maxCandidates
        ? Array.from(candidates).slice(0, this.opts.maxCandidates)
        : Array.from(candidates);

    // Score and rank.
    const scored: { id: number; score: number }[] = [];
    for (const id of idArray) {
      const s = compositeScore(q, this.texts[id]);
      if (s > 0) scored.push({ id, score: s });
    }
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, limit);
    return top.map((s) => this.items[s.id]);
  }

  /**
   * Search returning items + scores, useful when callers need to merge or
   * threshold downstream.
   */
  searchScored(query: string, limit = 50): { item: T; score: number }[] {
    if (query.length === 0) return [];
    const q = this.opts.caseInsensitive ? query.toLowerCase() : query;
    const items = this.search(query, limit);
    return items.map((item, idx) => {
      // Recompute against stored normalized text to keep ordering stable
      // even when tests inspect score values.
      const id = this.items.indexOf(item);
      const text = id >= 0 ? this.texts[id] : '';
      return { item, score: compositeScore(q, text), _idx: idx } as {
        item: T;
        score: number;
      };
    });
  }
}
