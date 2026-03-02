/**
 * Practice Builder -- public API barrel export.
 *
 * Assembles sessions from any combination of the 8 Mind-Body wings
 * at 4 time commitments (5, 15, 30, 60 minutes). Provides a 9-week
 * progressive structure guiding users from breath fundamentals to
 * personalized practice.
 *
 * @module departments/mind-body/practice-builder
 */

// Session Generator
export { SessionGenerator } from './session-generator.js';
export type { SessionSegment, GeneratedSession, SafetyFilter } from './session-generator.js';

// Session Templates
export {
  microTemplate,
  morningTemplate,
  fullTemplate,
  deepTemplate,
  allTemplates,
} from './session-templates.js';
export type { Template, TemplateSegment, TemplateSegmentType } from './session-templates.js';

// Progressive Structure
export {
  foundationPhase,
  expansionPhase,
  integrationPhase,
  personalizationPhase,
  allPhases,
  getPhaseForWeek,
  getRecommendedModules,
} from './progressive-structure.js';
export type { ProgressivePhase } from './progressive-structure.js';
