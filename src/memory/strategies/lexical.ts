/**
 * BM25 lexical retrieval channel. Implements the Okapi BM25 ranking
 * function over an inverted index, conforming to the RetrievalStrategy
 * contract. The 2026 finding (arxiv `2605.14503v1`) is that retriever
 * choice dominates generator choice on retrieval-heavy tasks, and BM25
 * specifically wins on surface-form queries (identifiers, error
 * messages, exact phrases) where dense embeddings underperform.
 *
 * Hyperparameters use the standard defaults: k1 = 1.5 controls term
 * frequency saturation, b = 0.75 controls document-length normalisation.
 * Both are configurable via the constructor.
 *
 * @module memory/strategies/lexical
 */

import type {
  RetrievalDoc,
  RetrievalQuery,
  RetrievalResult,
  RetrievalStrategy,
} from './types.js';

interface IndexedDoc {
  doc: RetrievalDoc;
  length: number;
  termFreqs: Map<string, number>;
}

export interface BM25Options {
  /** Term-frequency saturation parameter (default 1.5). */
  k1?: number;
  /** Length-normalisation parameter in [0, 1] (default 0.75). */
  b?: number;
  /**
   * Tokeniser. Receives raw text, returns lowercase tokens. Default
   * splits on non-word characters and lowercases. Override to add
   * stemming, stopwording, or language-specific behaviour.
   */
  tokenize?: (text: string) => string[];
}

function defaultTokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const match of text.toLowerCase().matchAll(/[a-z0-9]+/g)) {
    tokens.push(match[0]);
  }
  return tokens;
}

/**
 * BM25 retrieval strategy. Constructs an in-memory inverted index and
 * scores documents using the Okapi BM25 formula:
 *
 *     score(q, d) = Σ_t IDF(t) · f(t,d)·(k1+1) / (f(t,d) + k1·(1 − b + b·|d|/avgdl))
 *
 * where IDF(t) = ln((N − n(t) + 0.5) / (n(t) + 0.5) + 1) is the BM25
 * smoothed IDF (always non-negative).
 */
export class BM25Strategy implements RetrievalStrategy {
  readonly name = 'bm25';

  private readonly k1: number;
  private readonly b: number;
  private readonly tokenize: (text: string) => string[];

  private readonly docs = new Map<string, IndexedDoc>();
  private readonly termToDocs = new Map<string, Map<string, number>>();
  private totalTokens = 0;

  constructor(options: BM25Options = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.75;
    this.tokenize = options.tokenize ?? defaultTokenize;
    if (this.k1 < 0) throw new Error('BM25Strategy: k1 must be >= 0');
    if (this.b < 0 || this.b > 1) throw new Error('BM25Strategy: b must be in [0, 1]');
  }

  index(doc: RetrievalDoc): void {
    if (this.docs.has(doc.id)) this.remove(doc.id);
    const tokens = this.tokenize(doc.text);
    const termFreqs = new Map<string, number>();
    for (const t of tokens) {
      termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1);
    }
    const indexed: IndexedDoc = { doc, length: tokens.length, termFreqs };
    this.docs.set(doc.id, indexed);
    this.totalTokens += tokens.length;
    for (const [term, freq] of termFreqs) {
      let postings = this.termToDocs.get(term);
      if (postings === undefined) {
        postings = new Map<string, number>();
        this.termToDocs.set(term, postings);
      }
      postings.set(doc.id, freq);
    }
  }

  indexAll(docs: RetrievalDoc[]): void {
    for (const d of docs) this.index(d);
  }

  remove(id: string): void {
    const existing = this.docs.get(id);
    if (existing === undefined) return;
    this.docs.delete(id);
    this.totalTokens -= existing.length;
    for (const term of existing.termFreqs.keys()) {
      const postings = this.termToDocs.get(term);
      if (postings === undefined) continue;
      postings.delete(id);
      if (postings.size === 0) this.termToDocs.delete(term);
    }
  }

  size(): number {
    return this.docs.size;
  }

  clear(): void {
    this.docs.clear();
    this.termToDocs.clear();
    this.totalTokens = 0;
  }

  search(query: RetrievalQuery): RetrievalResult[] {
    const topK = query.topK ?? 10;
    if (this.docs.size === 0 || topK <= 0) return [];

    const queryTerms = this.tokenize(query.text);
    if (queryTerms.length === 0) return [];

    // Dedupe query terms; BM25 conventionally sums per unique term.
    const uniqueTerms = new Set(queryTerms);
    const N = this.docs.size;
    const avgdl = this.totalTokens / N;

    const scores = new Map<string, number>();

    for (const term of uniqueTerms) {
      const postings = this.termToDocs.get(term);
      if (postings === undefined) continue;
      const n = postings.size;
      const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1);
      for (const [docId, tf] of postings) {
        const docLen = this.docs.get(docId)!.length;
        const denom = tf + this.k1 * (1 - this.b + (this.b * docLen) / avgdl);
        const contribution = idf * ((tf * (this.k1 + 1)) / denom);
        scores.set(docId, (scores.get(docId) ?? 0) + contribution);
      }
    }

    if (scores.size === 0) return [];

    const results: RetrievalResult[] = [];
    for (const [docId, score] of scores) {
      const indexed = this.docs.get(docId);
      if (indexed === undefined) continue;
      results.push({ doc: indexed.doc, score, source: this.name });
    }

    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.doc.id.localeCompare(b.doc.id);
    });

    return results.slice(0, topK);
  }
}
