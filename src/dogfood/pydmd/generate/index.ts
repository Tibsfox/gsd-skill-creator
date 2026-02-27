/**
 * Skill generation from knowledge graph.
 * Phase 406: skill-composer, reference-builder, script-generator
 */

// Plan 01: Skill composer pipeline
export { composeSkill } from './skill-composer.js';
export { formatDecisionTree } from './decision-tree-formatter.js';
export { countWords } from './word-counter.js';
export type { CompositionConfig, SkillSection, GeneratedSkill } from './types.js';

// Plan 02: Reference builder, script generator, cross-reference checker
export { buildReferences } from './reference-builder.js';
export type { ReferenceSet } from './reference-builder.js';
export { generateScripts } from './script-generator.js';
export type { ScriptSet } from './script-generator.js';
export { checkCrossReferences } from './cross-reference-checker.js';
export type { CrossRefResult } from './cross-reference-checker.js';
