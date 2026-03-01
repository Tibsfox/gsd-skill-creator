/**
 * Lightweight TF-IDF implementation.
 *
 * Drop-in replacement for natural.TfIdf with the same API surface
 * but zero dependencies. Eliminates the need for the `natural` package
 * which pulls in pg, mongoose, redis, and 50+ transitive deps.
 */

/**
 * Tokenize text into lowercase words, filtering very short tokens.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 1);
}

/**
 * A term entry with its TF-IDF score.
 */
export interface TermScore {
  term: string;
  tfidf: number;
}

/**
 * TF-IDF (Term Frequency - Inverse Document Frequency) calculator.
 *
 * Provides the same API as natural.TfIdf:
 * - addDocument(text) — add a document string
 * - tfidfs(term, callback) — get TF-IDF scores for a term across all docs
 * - listTerms(docIndex) — get all terms with scores for a document
 */
export class TfIdf {
  private documents: string[][] = [];

  /**
   * Add a document to the corpus.
   * @param text - Document text (will be tokenized internally)
   */
  addDocument(text: string): void {
    this.documents.push(tokenize(text));
  }

  /**
   * Compute TF-IDF score for a term across all documents.
   *
   * Calls the callback for each document with (documentIndex, tfidfScore).
   *
   * @param term - The term to score
   * @param callback - Called for each document: (index, measure) => void
   */
  tfidfs(term: string, callback: (index: number, measure: number) => void): void {
    const normalizedTerm = term.toLowerCase();
    const docCount = this.documents.length;
    if (docCount === 0) return;

    // Document frequency: how many documents contain this term
    const df = this.documents.filter((doc) =>
      doc.includes(normalizedTerm)
    ).length;

    // IDF: log(1 + total docs / (1 + docs containing term))
    // Matches natural's formula — always positive, smooth for small corpora
    const idf = Math.log(1 + docCount / (1 + df));

    for (let i = 0; i < docCount; i++) {
      const doc = this.documents[i];
      // TF: occurrences of term in this document / total terms in document
      const termCount = doc.filter((t) => t === normalizedTerm).length;
      const tf = doc.length > 0 ? termCount / doc.length : 0;
      callback(i, tf * idf);
    }
  }

  /**
   * List all terms in a document with their TF-IDF scores.
   *
   * Returns terms sorted by score descending.
   *
   * @param docIndex - Index of the document (0-based, in order of addDocument calls)
   * @returns Array of { term, tfidf } sorted by score descending
   */
  listTerms(docIndex: number): TermScore[] {
    if (docIndex < 0 || docIndex >= this.documents.length) {
      return [];
    }

    const doc = this.documents[docIndex];
    const docCount = this.documents.length;
    const uniqueTerms = [...new Set(doc)];

    return uniqueTerms
      .map((term) => {
        const tf = doc.filter((t) => t === term).length / doc.length;
        const df = this.documents.filter((d) => d.includes(term)).length;
        const idf = Math.log(1 + docCount / (1 + df));
        return { term, tfidf: tf * idf };
      })
      .sort((a, b) => b.tfidf - a.tfidf);
  }
}
