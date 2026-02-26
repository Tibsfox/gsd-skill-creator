/**
 * Self-Improvement Lifecycle -- retrospective generation and changelog monitoring.
 *
 * @module retro
 */

// Types
export type {
  MilestoneMetrics,
  ChangelogEntry,
  FeatureClassification,
  CalibrationDelta,
  ActionItem,
  RetroTemplateData,
  ChangelogWatchResult,
} from './types.js';

export {
  MilestoneMetricsSchema,
  ChangelogEntrySchema,
  CalibrationDeltaSchema,
  ActionItemSchema,
  RetroTemplateDataSchema,
  ChangelogWatchResultSchema,
} from './types.js';

// Template generator
export { generateRetrospective } from './template-generator.js';

// Changelog watch
export { detectVersion, parseChangelog, classifyFeatures, runChangelogWatch } from './changelog-watch.js';
