/**
 * ME-2 Per-Skill Model Affinity — Barrel export.
 *
 * Public API surface for the model-affinity module.
 * Internal modules import directly from their paths; this barrel is
 * for external consumers (M5 selector, CLI, tests).
 *
 * @module model-affinity
 */

// Schema types
export type { ModelFamily, ModelAffinity } from './schema.js';
export { MODEL_TIER, MODEL_FAMILIES_ORDERED, isModelAffinity, pickNextTierUp } from './schema.js';

// Frontmatter resolver
export type { ModelAffinitySource, ResolvedModelAffinity } from './frontmatter.js';
export { resolveModelAffinity, serializeModelAffinity } from './frontmatter.js';

// Policy
export type { AffinityDecision } from './policy.js';
export { evaluateMatch, EscalationRateLimiter } from './policy.js';

// Settings
export type { ModelAffinitySettings } from './settings.js';
export {
  DEFAULT_MODEL_AFFINITY_SETTINGS,
  resolveModelAffinitySettings,
  readModelAffinityEnabledFlag,
} from './settings.js';

// Read API (for M5 selector)
export type { CandidateAffinityInput, EscalationSummary } from './api.js';
export { getAffinityDecision, batchAffinityDecisions, summariseEscalations } from './api.js';

// CLI
export type { ModelAffinityCliOptions } from './cli.js';
export { modelAffinityCommand, modelAffinityHelp, DEFAULT_SCAN_DIRS } from './cli.js';
