/**
 * Lifecycle coordinator service.
 *
 * Wires together state reading, lifecycle stage derivation, artifact
 * scanning, and transition rules into a single suggestNextStep API.
 *
 * After any GSD command completes, the orchestrator calls suggestNextStep
 * to determine what the user should do next based on actual project state.
 */

import { join } from 'node:path';
import type { ProjectState, PhaseInfo } from '../state/types.js';
import type { NextStepSuggestion, PhaseArtifacts } from './types.js';
import { deriveLifecycleStage } from '../intent/lifecycle-filter.js';
import { scanPhaseArtifacts } from './artifact-scanner.js';
import { deriveNextActions } from './transition-rules.js';

// ============================================================================
// Stage-Level Stages (no artifact scanning needed)
// ============================================================================

/** Stages that are resolved purely from ProjectState flags */
const STAGE_LEVEL_STAGES = new Set([
  'uninitialized',
  'initialized',
  'milestone-end',
  'between-phases',
]);

// ============================================================================
// LifecycleCoordinator
// ============================================================================

/**
 * Coordinates lifecycle stage derivation, artifact scanning, and
 * transition rule application into a single API.
 *
 * Usage:
 * ```typescript
 * const coordinator = new LifecycleCoordinator('/path/to/.planning');
 * const suggestion = await coordinator.suggestNextStep(state, 'plan-phase');
 * console.log(suggestion.primary.command); // e.g., 'gsd:execute-phase'
 * ```
 */
export class LifecycleCoordinator {
  private phasesDir: string;

  constructor(private planningDir: string) {
    this.phasesDir = join(planningDir, 'phases');
  }

  /**
   * Suggest the next GSD command based on project state and artifacts.
   *
   * Flow:
   * 1. Derive lifecycle stage from ProjectState
   * 2. For stage-level states: derive actions with empty artifacts
   * 3. For phase-level states: find first incomplete phase, scan its
   *    directory for artifacts, then derive actions
   *
   * @param state - Current project state from ProjectStateReader
   * @param completedCommand - Optional hint about which command just completed
   * @returns NextStepSuggestion with primary action, alternatives, and context
   */
  async suggestNextStep(
    state: ProjectState,
    completedCommand?: string,
  ): Promise<NextStepSuggestion> {
    // 1. Derive lifecycle stage
    const stage = deriveLifecycleStage(state);

    // 2. Stage-level states don't need artifact scanning
    if (STAGE_LEVEL_STAGES.has(stage)) {
      const emptyArtifacts = this.emptyArtifacts('');
      return deriveNextActions(emptyArtifacts, stage, completedCommand);
    }

    // 3. Phase-level states: find first incomplete phase
    const currentPhase = state.phases.find(p => !p.complete);
    if (!currentPhase) {
      // Shouldn't happen given stage derivation, but handle gracefully
      const emptyArtifacts = this.emptyArtifacts('');
      return deriveNextActions(emptyArtifacts, stage, completedCommand);
    }

    // 4. Scan phase directory for artifacts
    const phaseDirectory = currentPhase.directory;
    let artifacts: PhaseArtifacts;

    if (phaseDirectory) {
      artifacts = await scanPhaseArtifacts(this.phasesDir, phaseDirectory);
    } else {
      // No directory yet -- use phase number/name to create empty artifacts
      artifacts = this.emptyArtifacts(
        `${currentPhase.number}-${currentPhase.name.toLowerCase().replace(/\s+/g, '-')}`,
      );
    }

    // 5. Resolve next-phase number if current phase is fully complete
    //    (all plans executed + UAT exists + no unexecuted plans)
    let nextPhaseNumber: string | undefined;
    if (
      artifacts.hasUat &&
      artifacts.planCount > 0 &&
      artifacts.unexecutedPlans.length === 0 &&
      artifacts.summaryCount === artifacts.planCount
    ) {
      const nextPhase = this.findNextIncompletePhase(state.phases, currentPhase.number);
      nextPhaseNumber = nextPhase?.number;
    }

    // 6. Derive next actions from artifacts + stage + next-phase context
    return deriveNextActions(artifacts, stage, completedCommand, nextPhaseNumber);
  }

  /**
   * Find the next incomplete phase after the given phase number.
   *
   * Uses array order from state.phases (NOT arithmetic on phase numbers)
   * to handle non-sequential numbering (e.g., 36, 37, 39 -- skip 38).
   *
   * @param phases - All phases from ProjectState
   * @param afterPhaseNumber - Phase number to look after
   * @returns First incomplete phase after the given one, or null
   */
  private findNextIncompletePhase(
    phases: PhaseInfo[],
    afterPhaseNumber: string,
  ): PhaseInfo | null {
    // Find the index of the current phase in the array
    const currentIndex = phases.findIndex(p => p.number === afterPhaseNumber);
    if (currentIndex === -1) return null;

    // Search forward from the next position
    for (let i = currentIndex + 1; i < phases.length; i++) {
      if (!phases[i].complete) {
        return phases[i];
      }
    }

    return null;
  }

  /**
   * Create empty PhaseArtifacts for cases where no directory exists.
   */
  private emptyArtifacts(phaseDirectory: string): PhaseArtifacts {
    const match = phaseDirectory.match(/^(\d+(?:\.\d+)?)-(.+)$/);
    return {
      phaseNumber: match ? match[1] : '',
      phaseName: match ? match[2] : phaseDirectory,
      phaseDirectory,
      hasContext: false,
      hasResearch: false,
      planIds: [],
      summaryIds: [],
      hasUat: false,
      hasVerification: false,
      planCount: 0,
      summaryCount: 0,
      unexecutedPlans: [],
    };
  }
}
