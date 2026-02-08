/**
 * Session Continuity module barrel exports.
 *
 * Provides snapshot schema, types, manager, and skill preload suggester
 * for seamless session transitions.
 */

export {
  SessionSnapshotSchema,
  DEFAULT_MAX_SNAPSHOTS,
  DEFAULT_SNAPSHOT_MAX_AGE_DAYS,
  SNAPSHOT_FILENAME,
} from './types.js';
export type { SessionSnapshot } from './types.js';
export { SnapshotManager } from './snapshot-manager.js';
export type { SnapshotManagerOptions } from './snapshot-manager.js';
export { SkillPreloadSuggester } from './skill-preload-suggester.js';
