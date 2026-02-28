/**
 * GSD Bayes Classifier wrapper around natural.BayesClassifier.
 *
 * Trains on discovered commands using augmented utterances and
 * classifies natural language with normalized confidence scoring.
 * Train once, classify many times. Supports lifecycle filtering
 * via allowedLabels parameter.
 */

import natural from 'natural';
import type { GsdCommandMetadata } from '../discovery/types.js';
import { augmentUtterances } from './utterance-augmenter.js';

// ============================================================================
// GSD Bayes Classifier
// ============================================================================

/**
 * Wrapper around natural.BayesClassifier with training from discovered
 * commands and normalized confidence scoring.
 *
 * @example
 * ```ts
 * const classifier = new GsdBayesClassifier();
 * classifier.train(discoveredCommands);
 * const results = classifier.classify('plan the next phase');
 * // => [{ label: 'gsd:plan-phase', confidence: 0.62 }, ...]
 * ```
 */
export class GsdBayesClassifier {
  private classifier: natural.BayesClassifier;
  private trained: boolean = false;
  private commandLabels: Set<string> = new Set();

  constructor() {
    this.classifier = new natural.BayesClassifier();
  }

  /**
   * Whether the classifier has been trained.
   */
  get isTrained(): boolean {
    return this.trained;
  }

  /**
   * Train the classifier on a set of discovered commands.
   *
   * For each command, generates augmented utterances and adds them
   * as training documents. Calls train() once after all documents
   * are added.
   *
   * @param commands - Array of discovered GSD commands to train on
   */
  train(commands: GsdCommandMetadata[]): void {
    // Reset classifier for fresh training
    this.classifier = new natural.BayesClassifier();
    this.commandLabels.clear();

    for (const command of commands) {
      const utterances = augmentUtterances(command);
      for (const utterance of utterances) {
        this.classifier.addDocument(utterance, command.name);
      }
      this.commandLabels.add(command.name);
    }

    this.classifier.train();
    this.trained = true;
  }

  /**
   * Classify input text against trained commands.
   *
   * Returns normalized confidence scores (summing to ~1.0) sorted
   * descending. If allowedLabels is provided, only those command
   * labels are included in results (with re-normalization).
   *
   * @param input - User input text to classify
   * @param allowedLabels - Optional set of command names to filter results to
   * @returns Array of { label, confidence } sorted by confidence descending
   */
  classify(
    input: string,
    allowedLabels?: Set<string>,
  ): Array<{ label: string; confidence: number }> {
    if (!this.trained) {
      return [];
    }

    // Get raw classifications from natural
    const raw = this.classifier.getClassifications(input) as Array<{
      label: string;
      value: number;
    }>;

    // Filter by allowed labels if provided
    let filtered = allowedLabels
      ? raw.filter((r) => allowedLabels.has(r.label))
      : raw;

    // Handle edge case: all values are zero or filtered is empty
    if (filtered.length === 0) {
      return [];
    }

    // Normalize values to sum to 1.0
    const sum = filtered.reduce((acc, r) => acc + r.value, 0);

    const normalized = filtered.map((r) => ({
      label: r.label,
      confidence: sum > 0 ? r.value / sum : 0,
    }));

    // Sort descending by confidence
    normalized.sort((a, b) => b.confidence - a.confidence);

    return normalized;
  }
}
