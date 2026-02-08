/**
 * Transition rules for lifecycle coordination.
 *
 * Maps artifact patterns and lifecycle stages to NextStepSuggestion
 * objects. The logic derives suggestions from artifact existence
 * (LIFE-03) rather than a hardcoded state machine.
 *
 * Stage-level shortcuts (uninitialized, initialized, milestone-end,
 * between-phases) return pre-defined suggestions immediately.
 *
 * Phase-level logic (roadmapped, planning, executing, verifying)
 * reads PhaseArtifacts to determine what exists and derives the
 * primary suggestion accordingly.
 */

import type { LifecycleStage } from '../intent/types.js';
import type { PhaseArtifacts, ActionSuggestion, NextStepSuggestion } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create an ActionSuggestion.
 */
function action(
  command: string,
  reason: string,
  args?: string,
  clearContext?: boolean,
): ActionSuggestion {
  const suggestion: ActionSuggestion = { command, reason };
  if (args !== undefined) suggestion.args = args;
  if (clearContext !== undefined) suggestion.clearContext = clearContext;
  return suggestion;
}

/**
 * Create a NextStepSuggestion.
 */
function suggestion(
  primary: ActionSuggestion,
  alternatives: ActionSuggestion[],
  stage: LifecycleStage,
  context: string,
): NextStepSuggestion {
  return { primary, alternatives, stage, context };
}

/**
 * Enrich context with completedCommand hint if provided.
 */
function enrichContext(baseContext: string, completedCommand?: string): string {
  if (!completedCommand) return baseContext;
  return `After ${completedCommand}: ${baseContext}`;
}

// ============================================================================
// Stage-Level Transitions
// ============================================================================

/**
 * Return pre-defined suggestion for stage-level states that
 * don't need artifact scanning.
 */
function stageLevelSuggestion(
  stage: LifecycleStage,
  completedCommand?: string,
): NextStepSuggestion | null {
  switch (stage) {
    case 'uninitialized':
      return suggestion(
        action('gsd:new-project', 'Project not initialized. Run new-project to set up .planning/ structure.'),
        [],
        stage,
        enrichContext('No .planning/ directory found. Initialize the project to begin.', completedCommand),
      );

    case 'initialized':
      return suggestion(
        action('gsd:new-milestone', 'Project initialized but no roadmap. Create a milestone to define phases.'),
        [],
        stage,
        enrichContext('Project structure exists but no roadmap. Create a milestone to plan work.', completedCommand),
      );

    case 'milestone-end':
      return suggestion(
        action('gsd:audit-milestone', 'All phases complete. Audit the milestone for quality and completeness.'),
        [
          action('gsd:complete-milestone', 'Archive the milestone and prepare for the next one.'),
          action('gsd:new-milestone', 'Start a new milestone immediately.'),
        ],
        stage,
        enrichContext('All phases complete. Audit or close the milestone.', completedCommand),
      );

    case 'between-phases':
      return suggestion(
        action('gsd:plan-phase', 'Between phases. Plan the next phase to continue.'),
        [
          action('gsd:discuss-phase', 'Discuss approach before planning.'),
          action('gsd:audit-milestone', 'Check milestone-level progress.'),
        ],
        stage,
        enrichContext('Between phases. Ready to plan the next one.', completedCommand),
      );

    default:
      return null;
  }
}

// ============================================================================
// Phase-Level Transitions
// ============================================================================

/**
 * Derive suggestion from phase artifacts for phase-level stages.
 */
function phaseLevelSuggestion(
  artifacts: PhaseArtifacts,
  stage: LifecycleStage,
  completedCommand?: string,
): NextStepSuggestion {
  const phaseNum = artifacts.phaseNumber;

  // No plans exist yet
  if (artifacts.planCount === 0) {
    // Has research -> ready to plan
    if (artifacts.hasResearch) {
      return suggestion(
        action('gsd:plan-phase', 'Research complete. Create execution plans from research findings.', phaseNum, true),
        [
          action('gsd:discuss-phase', 'Discuss approach before committing to plans.', phaseNum),
        ],
        stage,
        enrichContext(`Phase ${phaseNum} has research but no plans. Ready to plan.`, completedCommand),
      );
    }

    // Has context -> ready to plan
    if (artifacts.hasContext) {
      return suggestion(
        action('gsd:plan-phase', 'Context captured. Create detailed execution plans.', phaseNum, true),
        [
          action('gsd:research-phase', 'Research the domain before planning.', phaseNum),
          action('gsd:discuss-phase', 'Continue discussing approach.', phaseNum),
        ],
        stage,
        enrichContext(`Phase ${phaseNum} has context discussion but no plans. Ready to plan.`, completedCommand),
      );
    }

    // No context, no research, no plans -> discuss first
    return suggestion(
      action('gsd:discuss-phase', 'No context or plans yet. Discuss the phase approach first.', phaseNum),
      [
        action('gsd:plan-phase', 'Skip discussion and create plans directly.', phaseNum, true),
        action('gsd:research-phase', 'Research the domain before planning.', phaseNum),
      ],
      stage,
      enrichContext(`Phase ${phaseNum} has no artifacts. Discuss or plan to begin.`, completedCommand),
    );
  }

  // Has unexecuted plans -> execute them
  if (artifacts.unexecutedPlans.length > 0) {
    const remaining = artifacts.unexecutedPlans.length;
    const total = artifacts.planCount;
    const completed = artifacts.summaryCount;

    return suggestion(
      action('gsd:execute-phase', `${remaining} of ${total} plans remaining. Continue execution.`, phaseNum, true),
      [
        action('gsd:verify-work', 'Verify completed work before continuing.', phaseNum),
        action('gsd:plan-phase', 'Review or update plans.', phaseNum),
      ],
      stage,
      enrichContext(
        `Phase ${phaseNum}: ${completed}/${total} plans executed, ${remaining} remaining.`,
        completedCommand,
      ),
    );
  }

  // All plans have summaries
  if (artifacts.planCount > 0 && artifacts.summaryCount === artifacts.planCount) {
    // Has UAT -> phase is verified, suggest next phase
    if (artifacts.hasUat) {
      return suggestion(
        action('gsd:plan-phase', 'Phase verified. Move to the next phase.', String(Number(phaseNum) + 1)),
        [
          action('gsd:audit-milestone', 'Check milestone-level progress.'),
        ],
        stage,
        enrichContext(`Phase ${phaseNum} complete and verified. Ready for next phase.`, completedCommand),
      );
    }

    // No UAT -> verify work
    return suggestion(
      action('gsd:verify-work', 'All plans executed. Verify the work before moving on.', phaseNum),
      [
        action('gsd:plan-phase', 'Plan the next phase (skip verification).', String(Number(phaseNum) + 1)),
        action('gsd:execute-phase', 'Re-execute plans if needed.', phaseNum, true),
      ],
      stage,
      enrichContext(`Phase ${phaseNum}: all ${artifacts.planCount} plans executed. Ready for verification.`, completedCommand),
    );
  }

  // Fallback: shouldn't reach here, but handle gracefully
  return suggestion(
    action('gsd:progress', 'Check project progress to determine next step.'),
    [],
    stage,
    enrichContext(`Phase ${phaseNum} in ambiguous state. Check progress.`, completedCommand),
  );
}

// ============================================================================
// deriveNextActions
// ============================================================================

/**
 * Derive next-step suggestions from artifact patterns and lifecycle stage.
 *
 * Stage-level states (uninitialized, initialized, milestone-end,
 * between-phases) return pre-defined suggestions immediately.
 *
 * Phase-level states (roadmapped, planning, executing, verifying)
 * analyze artifacts to determine the primary suggestion.
 *
 * If completedCommand is provided, it enriches the context field
 * without overriding the artifact-derived primary suggestion.
 *
 * @param artifacts - Phase artifact scan results
 * @param stage - Current lifecycle stage
 * @param completedCommand - Optional hint about which command just completed
 * @returns Complete NextStepSuggestion with primary, alternatives, and context
 */
export function deriveNextActions(
  artifacts: PhaseArtifacts,
  stage: LifecycleStage,
  completedCommand?: string,
): NextStepSuggestion {
  // Try stage-level shortcut first
  const stageResult = stageLevelSuggestion(stage, completedCommand);
  if (stageResult) return stageResult;

  // Phase-level logic for roadmapped, planning, executing, verifying
  return phaseLevelSuggestion(artifacts, stage, completedCommand);
}
