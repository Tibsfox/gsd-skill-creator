/**
 * Session Continuity module barrel exports.
 *
 * Provides snapshot schema, types, manager, skill preload suggester,
 * warm-start generator, and handoff generator for seamless session transitions.
 */

export {
  SessionSnapshotSchema,
  WarmStartContextSchema,
  HandoffSkillMetaSchema,
  SENSITIVE_PATH_PATTERNS,
  filterSensitivePaths,
  DEFAULT_MAX_SNAPSHOTS,
  DEFAULT_SNAPSHOT_MAX_AGE_DAYS,
  SNAPSHOT_FILENAME,
} from './types.js';
export type { SessionSnapshot, WarmStartContext, HandoffSkillMeta } from './types.js';
export { SnapshotManager } from './snapshot-manager.js';
export type { SnapshotManagerOptions } from './snapshot-manager.js';
export { SkillPreloadSuggester } from './skill-preload-suggester.js';
export { WarmStartGenerator } from './warm-start.js';
export { HandoffGenerator } from './handoff-generator.js';
