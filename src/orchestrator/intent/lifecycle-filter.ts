/**
 * Lifecycle stage derivation and command filtering.
 *
 * Derives the current project lifecycle stage from ProjectState flags
 * and filters discovered commands to the stage-relevant subset.
 * Universal commands (help, progress, quick, debug, etc.) are always included.
 *
 * The UNIVERSAL_COMMANDS set and stage-specific command sets are the ONLY
 * hardcoded knowledge in the intent module. This is acceptable because they
 * define what's SEMANTICALLY valid, not what's DISCOVERED. Discovery tells
 * us what exists; lifecycle tells us what's relevant right now.
 */

import type { ProjectState } from '../state/types.js';
import type { GsdCommandMetadata } from '../discovery/types.js';
import { canonicalCommandName } from '../command-name.js';
import type { LifecycleStage } from './types.js';

// ============================================================================
// Universal Commands
// ============================================================================

/**
 * Commands valid in EVERY lifecycle stage.
 *
 * These are utility/meta commands that never depend on project state:
 * help, progress, quick tasks, debugging, settings, todos, etc.
 */
export const UNIVERSAL_COMMANDS = new Set([
  'gsd:help',
  'gsd:progress',
  'gsd:quick',
  'gsd:debug',
  'gsd:settings',
  'gsd:config',
  'gsd:capture',
  'gsd:update',
  'gsd:pause-work',
  'gsd:resume-work',
  'gsd:map-codebase',
]);

// ============================================================================
// Stage-Specific Command Mapping
// ============================================================================

/**
 * Maps each lifecycle stage to the set of stage-specific commands
 * (excluding universals, which are always added).
 */
// Every command below must exist in the shipped GSD command set — the unified
// `gsd:phase` replaced the removed granular `add|insert|remove-phase` commands,
// and `research-phase` / `list-phase-assumptions` / `plan-milestone-gaps` no
// longer ship. The ORCH-N1 drift-guard test enforces this membership.
export const STAGE_COMMANDS: Record<LifecycleStage, ReadonlySet<string>> = {
  uninitialized: new Set([
    'gsd:new-project',
  ]),
  initialized: new Set([
    'gsd:new-milestone',
  ]),
  roadmapped: new Set([
    'gsd:plan-phase',
    'gsd:discuss-phase',
    'gsd:phase',
  ]),
  planning: new Set([
    'gsd:plan-phase',
    'gsd:discuss-phase',
    'gsd:phase',
  ]),
  executing: new Set([
    'gsd:execute-phase',
    'gsd:plan-phase',
    'gsd:verify-work',
    'gsd:phase',
  ]),
  verifying: new Set([
    'gsd:verify-work',
    'gsd:execute-phase',
    'gsd:plan-phase',
    'gsd:phase',
  ]),
  'between-phases': new Set([
    'gsd:plan-phase',
    'gsd:discuss-phase',
    'gsd:phase',
    'gsd:audit-milestone',
  ]),
  'milestone-end': new Set([
    'gsd:audit-milestone',
    'gsd:complete-milestone',
    'gsd:new-milestone',
  ]),
};

// ============================================================================
// deriveLifecycleStage
// ============================================================================

/**
 * Derive the current lifecycle stage from ProjectState artifact flags.
 *
 * Reads initialized, hasRoadmap, phases, and plansByPhase to determine
 * where the project is in the GSD workflow. Does NOT use a state machine --
 * derives stage dynamically from artifact existence and completion status.
 *
 * @param state - ProjectState from the state reader
 * @returns The derived LifecycleStage
 */
export function deriveLifecycleStage(state: ProjectState): LifecycleStage {
  // 1. Not initialized at all
  if (!state.initialized) {
    return 'uninitialized';
  }

  // 2. Initialized but no roadmap
  if (!state.hasRoadmap) {
    return 'initialized';
  }

  // 3. Has roadmap -- check phases
  const { phases, plansByPhase } = state;

  // Edge case: roadmap exists but no phases parsed
  if (phases.length === 0) {
    return 'between-phases';
  }

  // Check if all phases are complete
  const allComplete = phases.every(p => p.complete);
  if (allComplete) {
    return 'milestone-end';
  }

  // Find first incomplete phase
  const currentPhase = phases.find(p => !p.complete);
  if (!currentPhase) {
    // Shouldn't happen given allComplete check, but handle gracefully
    return 'between-phases';
  }

  // Look up plans for the current phase
  const phaseKey = currentPhase.number;
  const plans = plansByPhase[phaseKey];

  // No plans entry or empty plans array -> needs planning
  if (!plans || plans.length === 0) {
    return 'roadmapped';
  }

  // Has plans -- check completion
  const allPlansComplete = plans.every(p => p.complete);
  if (allPlansComplete) {
    return 'verifying';
  }

  // Some plans incomplete -> actively executing
  return 'executing';
}

// ============================================================================
// filterByLifecycle
// ============================================================================

/**
 * Filter discovered commands to those valid for the given lifecycle stage.
 *
 * Always includes universal commands. Stage-specific commands are determined
 * by the STAGE_COMMANDS mapping. Commands not in either set are excluded.
 *
 * @param commands - All discovered GSD commands
 * @param stage - Current lifecycle stage
 * @returns Filtered subset of commands valid for the stage
 */
export function filterByLifecycle(
  commands: GsdCommandMetadata[],
  stage: LifecycleStage,
): GsdCommandMetadata[] {
  const stageSpecific = STAGE_COMMANDS[stage] ?? new Set<string>();

  return commands.filter(cmd => {
    // Discovered names arrive in hyphen form (gsd-phase); the sets are colon
    // form (gsd:phase). Canonicalize before membership so filtering works.
    const name = canonicalCommandName(cmd.name);
    return UNIVERSAL_COMMANDS.has(name) || stageSpecific.has(name);
  });
}
