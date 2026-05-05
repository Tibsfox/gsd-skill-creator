/**
 * Provenance subsystem — public API (v1.49.607 W1 Track B).
 *
 * Re-exports the linker, blame parser, and attribution scorer that
 * back the AtlasKB provenance methods (`listFilesChangedByMission`,
 * `listMissionsForFile`, `listProvenanceForLine`).
 */

export { ProvenanceLinker, parseGitLogNameStatusNumstat, resolveMissionCommits } from './linker.js';
export type { LinkerResult } from './linker.js';
export { parseBlamePorcelain } from './blame-parser.js';
export {
  attributeBlameLine,
  attributeFile,
  buildShaToMissionIndex,
} from './mission-attribution.js';
export type {
  BlameLine,
  GitFileChange,
  LineAttribution,
  LinkerConfig,
  MissionCommitMap,
  MissionLinkRef,
} from './types.js';
