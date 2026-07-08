import { TfIdf } from '../nlp/tfidf.js';
import type { EmbeddingVector } from '../types/embeddings.js';

/**
 * Heuristic embedder for fallback when the transformer model is unavailable.
 *
 * Generates deterministic, L2-normalized embeddings usable with cosine
 * similarity by hashing tokens to fixed dimensions.
 *
 * Weighting depends on whether a corpus has been seeded via `addDocument()`:
 * - No corpus (the default, and how EmbeddingService uses it): a hashed,
 *   log-scaled *term-frequency* bag-of-words — there is NO IDF weighting.
 * - With a corpus: TF-IDF weights, scoring each text against the seeded
 *   documents. EmbeddingService never seeds a corpus, so this path is only
 *   reached by callers that call `addDocument()` themselves.
 */
export class HeuristicEmbedder {
  private tfidf: TfIdf;
  private vocabulary: Map<string, number>;
  private dimension: number;
  private documentCount: number;

  /**
   * Create a new heuristic embedder.
   * @param dimension - Target embedding dimension (default: 384 to match BGE-small)
   */
  constructor(dimension: number = 384) {
    this.tfidf = new TfIdf();
    this.vocabulary = new Map();
    this.dimension = dimension;
    this.documentCount = 0;
  }

  /**
   * Add a document to build the vocabulary.
   * Call this with representative documents before generating embeddings.
   * @param text - Document text to add
   */
  addDocument(text: string): void {
    this.tfidf.addDocument(text);
    this.documentCount++;

    // Build vocabulary from unique tokens
    const tokens = this.tokenize(text);
    for (const token of tokens) {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabulary.size);
      }
    }
  }

  /**
   * Generate an embedding for the given text.
   *
   * If no documents have been added, the text is tokenized and hashed directly.
   * This ensures deterministic output even without a pre-built corpus.
   *
   * @param text - Text to embed
   * @returns Normalized embedding vector of configured dimension
   */
  embed(text: string): EmbeddingVector {
    const tokens = this.tokenize(text);

    if (tokens.length === 0) {
      // Return zero vector for empty text
      return new Array(this.dimension).fill(0);
    }

    // Initialize sparse vector
    const vector = new Array(this.dimension).fill(0);

    if (this.documentCount > 0) {
      // Use TF-IDF weights if we have a corpus
      this.populateWithTfIdf(text, tokens, vector);
    } else {
      // Fall back to simple term frequency with hashing
      this.populateWithTermFrequency(tokens, vector);
    }

    // L2 normalize for cosine similarity
    return this.normalize(vector);
  }

  /**
   * Generate embeddings for multiple texts.
   * @param texts - Array of texts to embed
   * @returns Array of embedding vectors
   */
  embedBatch(texts: string[]): EmbeddingVector[] {
    return texts.map((text) => this.embed(text));
  }

  /**
   * Get the number of documents added to the corpus.
   */
  getDocumentCount(): number {
    return this.documentCount;
  }

  /**
   * Get the vocabulary size (number of unique tokens).
   */
  getVocabularySize(): number {
    return this.vocabulary.size;
  }

  /**
   * Reset the embedder to initial state.
   */
  reset(): void {
    this.tfidf = new TfIdf();
    this.vocabulary.clear();
    this.documentCount = 0;
  }

  /**
   * Tokenize text into lowercase words, filtering short tokens.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2);
  }

  /**
   * Populate vector using TF-IDF weights from the corpus.
   */
  private populateWithTfIdf(
    text: string,
    tokens: string[],
    vector: number[]
  ): void {
    // Add document temporarily to get TF-IDF scores
    const tempDocIndex = this.documentCount;
    this.tfidf.addDocument(text);

    // Get TF-IDF weights for each unique token
    const tokenSet = new Set(tokens);
    for (const token of tokenSet) {
      const dimIndex = this.hashToDimension(token);
      // Get TF-IDF value for this token in the temp document
      const tfidfValues: number[] = [];
      this.tfidf.tfidfs(token, (_, measure) => {
        tfidfValues.push(measure);
      });
      const weight = tfidfValues[tempDocIndex] ?? 0;
      vector[dimIndex] += weight;
    }

    // Remove the temporary query document so it does not leak into the corpus.
    // Previously this called a no-op rebuildTfidf(), so every embed() in corpus
    // mode grew the corpus — biasing IDF and misaligning tempDocIndex until the
    // vector could collapse to zeros. (RET-6)
    this.tfidf.removeLastDocument();
  }

  /**
   * Populate vector using simple term frequency (when no corpus available).
   */
  private populateWithTermFrequency(tokens: string[], vector: number[]): void {
    // Count term frequencies
    const termFreq = new Map<string, number>();
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
    }

    // Apply to vector with hashing
    for (const [token, freq] of termFreq) {
      const dimIndex = this.hashToDimension(token);
      // Log-scale frequency to dampen high-frequency terms
      vector[dimIndex] += 1 + Math.log(freq);
    }
  }

  /**
   * Hash a token to a dimension index (deterministic).
   * Uses DJB2 hash algorithm for simplicity and speed.
   */
  private hashToDimension(token: string): number {
    let hash = 5381;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 33) ^ token.charCodeAt(i);
    }
    return Math.abs(hash) % this.dimension;
  }

  /**
   * L2 normalize a vector (magnitude becomes 1.0).
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) {
      return vector; // Return zero vector as-is
    }

    return vector.map((val) => val / magnitude);
  }
}
