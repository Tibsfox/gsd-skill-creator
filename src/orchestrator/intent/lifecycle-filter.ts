/**
 * Lifecycle stage derivation and command filtering.
 *
 * Derives the current project lifecycle stage from ProjectState flags
 * and filters discovered commands to the stage-relevant subset.
 * Universal commands (help, progress, quick, debug, etc.) are always included.
 */

import type { ProjectState } from '../state/types.js';
import type { GsdCommandMetadata } from '../discovery/types.js';
import type { LifecycleStage } from './types.js';

// TODO: Implement in GREEN phase

export const UNIVERSAL_COMMANDS = new Set<string>();

export function deriveLifecycleStage(_state: ProjectState): LifecycleStage {
  return 'uninitialized';
}

export function filterByLifecycle(
  _commands: GsdCommandMetadata[],
  _stage: LifecycleStage,
): GsdCommandMetadata[] {
  return [];
}
