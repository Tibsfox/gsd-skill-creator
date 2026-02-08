/**
 * Barrel exports for the bundles module.
 *
 * Exposes:
 * - Types and schemas: BundleSkillEntrySchema, BundleDefinitionSchema
 * - Parser: parseBundleYaml, parseBundleFile
 * - Activator: BundleActivator
 */

// Types and schemas
export { BundleSkillEntrySchema, BundleDefinitionSchema } from './types.js';
export type { BundleSkillEntry, BundleDefinition } from './types.js';

// Parser
export { parseBundleYaml, parseBundleFile } from './bundle-parser.js';

// Activator
export { BundleActivator } from './bundle-activator.js';
