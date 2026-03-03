/**
 * @file Review milestone gate evaluation
 * @description Evaluates mandatory and advisory gates for review milestones.
 *              Retrospective and lessons-learned are hard requirements (fail blocks close).
 *              Pacing, batch detection, and chain validation are advisory (warn only).
 *
 *              All functions are pure -- no side effects, no mutation.
 *              Advisory-first pattern: batch 'critical' maps to 'warn', not 'fail'.
 *
 * @module tools/commands/review-milestone
 */

import type { ReviewLifecycleState } from './review-config.js';
import type { ReviewMilestoneState } from './review-lifecycle.js';
import type { PacingResult } from '../../../core/validation/pacing-gate/index.js';
import type { BatchDetectionResult } from '../../../core/validation/batch-detection/index.js';
import type { ChainValidationResult } from '../lessons-chain/index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of evaluating a single review gate.
 */
export interface ReviewGateResult {
  /** Gate name (e.g., 'retrospective', 'lessons-learned', 'pacing'). */
  gate: string;

  /** Gate status: pass, warn, or fail. */
  status: 'pass' | 'warn' | 'fail';

  /** Advisory messages from this gate. */
  advisories: string[];
}

/**
 * Complete evaluation of all review gates for a milestone.
 */
export interface ReviewGateEvaluation {
  /** Milestone being evaluated. */
  milestoneId: string;

  /** Current lifecycle state of the milestone. */
  currentState: ReviewLifecycleState;

  /** Individual gate results. */
  gates: ReviewGateResult[];

  /** Worst status across all gates. */
  overallStatus: 'pass' | 'warn' | 'fail';

  /** Whether the milestone can transition to CLOSE (no 'fail' gates). */
  canTransitionToClose: boolean;

  /** Aggregated advisories from all non-pass gates. */
  advisories: string[];

  /** ISO-8601 timestamp of the evaluation. */
  timestamp: string;
}

/**
 * Parameters for review gate evaluation.
 */
export interface ReviewGateParams {
  /** Current review milestone state. */
  state: ReviewMilestoneState;

  /** Whether a retrospective document exists. */
  retrospectiveExists: boolean;

  /** Whether a lessons-learned document exists. */
  lessonsLearnedExists: boolean;

  /** Optional pacing results from prior sessions. */
  pacingResults?: PacingResult[];

  /** Optional batch detection result. */
  batchDetectionResult?: BatchDetectionResult;

  /** Optional chain validation result. */
  chainValidationResult?: ChainValidationResult;
}

// ============================================================================
// Gate Evaluators
// ============================================================================

/**
 * Evaluate the retrospective gate.
 * Hard requirement: must exist before closing.
 */
function evaluateRetrospectiveGate(exists: boolean): ReviewGateResult {
  if (exists) {
    return { gate: 'retrospective', status: 'pass', advisories: [] };
  }
  return {
    gate: 'retrospective',
    status: 'fail',
    advisories: ['Retrospective document required before closing review milestone'],
  };
}

/**
 * Evaluate the lessons-learned gate.
 * Hard requirement: must exist before closing.
 */
function evaluateLessonsLearnedGate(exists: boolean): ReviewGateResult {
  if (exists) {
    return { gate: 'lessons-learned', status: 'pass', advisories: [] };
  }
  return {
    gate: 'lessons-learned',
    status: 'fail',
    advisories: ['Lessons-learned document required before closing review milestone'],
  };
}

/**
 * Evaluate the pacing gate from PacingResult array.
 * Advisory only: worst status from all results, pass if absent.
 */
function evaluatePacingGate(results?: PacingResult[]): ReviewGateResult {
  if (!results || results.length === 0) {
    return { gate: 'pacing', status: 'pass', advisories: [] };
  }

  const advisories: string[] = [];
  let worstStatus: 'pass' | 'warn' | 'fail' = 'pass';

  for (const r of results) {
    if (r.status === 'fail' && worstStatus !== 'fail') {
      worstStatus = 'fail';
    } else if (r.status === 'warn' && worstStatus === 'pass') {
      worstStatus = 'warn';
    }
    if (r.status !== 'pass') {
      advisories.push(...r.advisories);
    }
  }

  // Advisory-first: pacing failures map to warn for review gates
  const gateStatus = worstStatus === 'fail' ? 'warn' : worstStatus;

  return { gate: 'pacing', status: gateStatus, advisories };
}

/**
 * Evaluate the batch detection gate.
 * Advisory-first: 'critical' maps to 'warn' (not 'fail'). Pass if absent.
 */
function evaluateBatchDetectionGate(result?: BatchDetectionResult): ReviewGateResult {
  if (!result) {
    return { gate: 'batch-detection', status: 'pass', advisories: [] };
  }

  if (result.overallStatus === 'pass') {
    return { gate: 'batch-detection', status: 'pass', advisories: [] };
  }

  // Both 'warn' and 'critical' map to 'warn' (advisory-first)
  return {
    gate: 'batch-detection',
    status: 'warn',
    advisories: [...result.advisories],
  };
}

/**
 * Evaluate the chain validation gate.
 * Advisory: 'broken' and 'incomplete' map to 'warn'. Pass if absent.
 */
function evaluateChainGate(result?: ChainValidationResult): ReviewGateResult {
  if (!result) {
    return { gate: 'chain', status: 'pass', advisories: [] };
  }

  if (result.overallStatus === 'intact') {
    return { gate: 'chain', status: 'pass', advisories: [] };
  }

  // Both 'broken' and 'incomplete' map to 'warn'
  return {
    gate: 'chain',
    status: 'warn',
    advisories: [...result.errors],
  };
}

// ============================================================================
// Main Evaluator
// ============================================================================

/**
 * Evaluate all review gates for a milestone.
 *
 * Evaluates 5 gates:
 * 1. **retrospective** (hard): fails if retrospective document missing
 * 2. **lessons-learned** (hard): fails if lessons-learned document missing
 * 3. **pacing** (advisory): warns on pacing violations
 * 4. **batch-detection** (advisory): warns on batch production signals
 * 5. **chain** (advisory): warns on broken/incomplete chain
 *
 * Overall status is the worst across all gates.
 * canTransitionToClose is false if any gate has 'fail' status.
 *
 * @param params - Gate evaluation parameters
 * @returns Complete evaluation with per-gate and overall results
 */
export function evaluateReviewGates(params: ReviewGateParams): ReviewGateEvaluation {
  const {
    state,
    retrospectiveExists,
    lessonsLearnedExists,
    pacingResults,
    batchDetectionResult,
    chainValidationResult,
  } = params;

  // Evaluate all gates
  const gates: ReviewGateResult[] = [
    evaluateRetrospectiveGate(retrospectiveExists),
    evaluateLessonsLearnedGate(lessonsLearnedExists),
    evaluatePacingGate(pacingResults),
    evaluateBatchDetectionGate(batchDetectionResult),
    evaluateChainGate(chainValidationResult),
  ];

  // Compute overall status (worst across all gates)
  let overallStatus: 'pass' | 'warn' | 'fail' = 'pass';
  for (const gate of gates) {
    if (gate.status === 'fail') {
      overallStatus = 'fail';
      break;
    }
    if (gate.status === 'warn') {
      overallStatus = 'warn';
    }
  }

  // Aggregate advisories from non-pass gates
  const advisories: string[] = [];
  for (const gate of gates) {
    if (gate.status !== 'pass') {
      advisories.push(...gate.advisories);
    }
  }

  return {
    milestoneId: state.milestoneId,
    currentState: state.currentState,
    gates,
    overallStatus,
    canTransitionToClose: overallStatus !== 'fail',
    advisories,
    timestamp: new Date().toISOString(),
  };
}
