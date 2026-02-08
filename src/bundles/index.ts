/**
 * Barrel exports for the bundles module.
 *
 * Exposes:
 * - Types and schemas: BundleSkillEntrySchema, BundleDefinitionSchema
 * - Parser: parseBundleYaml, parseBundleFile
 * - Activator: BundleActivator
 * - Progress tracking: BundleProgressStore, BundleProgressEntrySchema, computeSkillStatus
 * - Auto-suggestion: BundleSuggester
 */

// Types and schemas
export { BundleSkillEntrySchema, BundleDefinitionSchema } from './types.js';
export type { BundleSkillEntry, BundleDefinition } from './types.js';

// Parser
export { parseBundleYaml, parseBundleFile } from './bundle-parser.js';

// Activator
export { BundleActivator } from './bundle-activator.js';

// Progress tracking
export { BundleProgressStore, BundleProgressEntrySchema, computeSkillStatus } from './bundle-progress-tracker.js';
export type { BundleProgressEntry } from './bundle-progress-tracker.js';

// Auto-suggestion
export { BundleSuggester } from './bundle-suggester.js';
export type { BundleSuggestion, BundleSuggesterConfig } from './bundle-suggester.js';
