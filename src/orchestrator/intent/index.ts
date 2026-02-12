/**
 * GSD Intent Classification Module
 *
 * Provides intent classification mapping user input to GSD commands.
 * Entry point for plans 38-01 through 38-03.
 */

// Type schemas and inferred types
export {
  ClassificationResultSchema,
  ExtractedArgumentsSchema,
  LifecycleStageSchema,
  ClassifierConfigSchema,
} from './types.js';
export type {
  ClassificationResult,
  ExtractedArguments,
  LifecycleStage,
  ClassifierConfig,
} from './types.js';

// Exact match pass-through
export { exactMatch, EXACT_MATCH_REGEX } from './exact-match.js';

// Utterance augmenter
export { augmentUtterances } from './utterance-augmenter.js';

// Bayes classifier wrapper
export { GsdBayesClassifier } from './bayes-classifier.js';

// Lifecycle filtering
export { deriveLifecycleStage, filterByLifecycle, UNIVERSAL_COMMANDS } from './lifecycle-filter.js';

// Argument extraction
export { extractArguments } from './argument-extractor.js';

// Semantic matcher (embedding-based fallback)
export { SemanticMatcher } from './semantic-matcher.js';
export type { SemanticMatch } from './semantic-matcher.js';

// Main classifier
export { IntentClassifier } from './intent-classifier.js';

// Classification audit logger
export { ClassificationLogger } from './classification-logger.js';
export type { ClassificationLogEntry } from './classification-logger.js';
