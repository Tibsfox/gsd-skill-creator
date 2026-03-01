/**
 * Lightweight Naive Bayes text classifier.
 *
 * Drop-in replacement for natural.BayesClassifier with the same API surface
 * but zero dependencies. Uses multinomial Naive Bayes with Laplace smoothing.
 */

/**
 * Tokenize text into lowercase words.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 1);
}

/**
 * A classification result with label and raw score.
 */
export interface Classification {
  label: string;
  value: number;
}

/**
 * Multinomial Naive Bayes text classifier.
 *
 * Provides the same API as natural.BayesClassifier:
 * - addDocument(text, label) — add a training example
 * - train() — finalize training (computes log-probabilities)
 * - getClassifications(text) — get scores for all labels
 */
export class BayesClassifier {
  private documents: Array<{ tokens: string[]; label: string }> = [];
  private vocabulary = new Set<string>();

  // Computed during train()
  private labelPriors = new Map<string, number>();
  private termLikelihoods = new Map<string, Map<string, number>>();
  private trained = false;

  /**
   * Add a training document with its label.
   * @param text - Document text
   * @param label - Category label
   */
  addDocument(text: string, label: string): void {
    const tokens = tokenize(text);
    this.documents.push({ tokens, label });
    for (const token of tokens) {
      this.vocabulary.add(token);
    }
    this.trained = false;
  }

  /**
   * Train the classifier on all added documents.
   * Computes log-prior and log-likelihood for each label/term pair.
   */
  train(): void {
    if (this.documents.length === 0) {
      this.trained = true;
      return;
    }

    const totalDocs = this.documents.length;
    const vocabSize = this.vocabulary.size;

    // Group documents by label
    const labelDocs = new Map<string, string[][]>();
    for (const doc of this.documents) {
      if (!labelDocs.has(doc.label)) {
        labelDocs.set(doc.label, []);
      }
      labelDocs.get(doc.label)!.push(doc.tokens);
    }

    // Compute log-priors: log(P(label))
    this.labelPriors.clear();
    for (const [label, docs] of labelDocs) {
      this.labelPriors.set(label, Math.log(docs.length / totalDocs));
    }

    // Compute log-likelihoods: log(P(term|label)) with Laplace smoothing
    this.termLikelihoods.clear();
    for (const [label, docs] of labelDocs) {
      // Count all term occurrences in this label's documents
      const termCounts = new Map<string, number>();
      let totalTerms = 0;
      for (const tokens of docs) {
        for (const token of tokens) {
          termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
          totalTerms++;
        }
      }

      // Compute smoothed log-likelihood for each vocabulary term
      const likelihoods = new Map<string, number>();
      for (const term of this.vocabulary) {
        const count = termCounts.get(term) ?? 0;
        // Laplace smoothing: (count + 1) / (totalTerms + vocabSize)
        likelihoods.set(
          term,
          Math.log((count + 1) / (totalTerms + vocabSize))
        );
      }
      this.termLikelihoods.set(label, likelihoods);
    }

    this.trained = true;
  }

  /**
   * Get classification scores for all labels.
   *
   * Returns unnormalized log-probability scores converted to positive values.
   * Sorted descending by score.
   *
   * @param text - Text to classify
   * @returns Array of { label, value } sorted by value descending
   */
  getClassifications(text: string): Classification[] {
    if (!this.trained || this.labelPriors.size === 0) {
      return [];
    }

    const tokens = tokenize(text);
    const scores: Classification[] = [];

    for (const [label, logPrior] of this.labelPriors) {
      const likelihoods = this.termLikelihoods.get(label)!;

      // Sum log-prior + log-likelihoods for each token
      let logScore = logPrior;
      for (const token of tokens) {
        if (likelihoods.has(token)) {
          logScore += likelihoods.get(token)!;
        }
        // Unknown terms are implicitly smoothed via vocabulary size
      }

      scores.push({ label, value: logScore });
    }

    // Convert log-scores to positive values using softmax-like normalization
    // This matches natural's behavior of returning positive values
    const maxScore = Math.max(...scores.map((s) => s.value));
    for (const score of scores) {
      score.value = Math.exp(score.value - maxScore);
    }

    // Sort descending by value
    scores.sort((a, b) => b.value - a.value);

    return scores;
  }
}
