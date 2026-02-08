/**
 * GSD Bayes Classifier wrapper around natural.BayesClassifier.
 *
 * Trains on discovered commands using augmented utterances and
 * classifies natural language with normalized confidence scoring.
 */

import type { GsdCommandMetadata } from '../discovery/types.js';

// TODO: Implement in GREEN phase
export class GsdBayesClassifier {
  get isTrained(): boolean {
    return false;
  }

  train(_commands: GsdCommandMetadata[]): void {
    // stub
  }

  classify(
    _input: string,
    _allowedLabels?: Set<string>,
  ): Array<{ label: string; confidence: number }> {
    return [];
  }
}
