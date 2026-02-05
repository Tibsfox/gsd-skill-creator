/**
 * Activation likelihood scoring module.
 *
 * Provides fast, local predictions of how reliably skill descriptions
 * will trigger Claude's auto-activation feature, with optional LLM-based
 * deep analysis.
 */

export { ActivationScorer } from './activation-scorer.js';
export { ActivationFormatter } from './activation-formatter.js';
export type { FormatOptions, BatchFormatOptions } from './activation-formatter.js';
export { ActivationSuggester } from './activation-suggester.js';
export type { ActivationSuggestion } from './activation-suggester.js';
export { LLMActivationAnalyzer } from './llm-activation-analyzer.js';
