/**
 * Utterance augmenter for Bayes classifier training data generation.
 *
 * Generates training phrases from GsdCommandMetadata without
 * hardcoded command knowledge -- all derived from metadata fields.
 */

import type { GsdCommandMetadata } from '../discovery/types.js';

// TODO: Implement in GREEN phase
export function augmentUtterances(_command: GsdCommandMetadata): string[] {
  return [];
}
