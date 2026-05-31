/**
 * M4 Branch-Context Experimentation — barrel export.
 *
 * Re-exports all public types and functions from the `src/branches/` subtree.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/index
 */

// manifest
export type { BranchManifest } from './manifest.js';
export { validateManifest } from './manifest.js';

// delta
export type { DeltaResult } from './delta.js';
export {
  MAX_DELTA_FRACTION,
  computeDelta,
  deltaRejectionMessage,
} from './delta.js';

// fork
export type { ForkOptions, ForkResult } from './fork.js';
export {
  DEFAULT_BRANCHES_DIR,
  MANIFEST_FILENAME,
  SKILL_FILENAME,
  fork,
  readManifest,
  writeManifest,
} from './fork.js';

// lifecycle-adapter
export type { BranchStateEntry } from './lifecycle-adapter.js';
export {
  BranchLifecycleResolver,
  SkillLifecycleResolver,
} from './lifecycle-adapter.js';

// explore
export type {
  SessionOutcome,
  ExploreSessionResult,
  ExploreResult,
  ExploreOptions,
  RunSkillFn,
} from './explore.js';
export { explore } from './explore.js';

// select-variant (M4 in-branch consumer of the M5 stochastic selector)
export type {
  BranchVariant,
  SelectBranchVariantOptions,
  BranchVariantSelection,
} from './select-variant.js';
export { selectBranchVariant } from './select-variant.js';

// commit
export type { CommitOptions, CommitResult, CommitOutcome } from './commit.js';
export { COMMIT_LOCK_FILENAME, commit } from './commit.js';

// abort
export type { AbortOptions, AbortResult } from './abort.js';
export { abort, branchDirectoryGone } from './abort.js';

// gc
export type { GcOptions, GcReport } from './gc.js';
export {
  DEFAULT_TERMINAL_MAX_AGE_MS,
  DEFAULT_OPEN_MAX_AGE_MS,
  gc,
} from './gc.js';
