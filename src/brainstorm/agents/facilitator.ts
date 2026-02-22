/**
 * Facilitator Agent -- problem assessment and transition scoring.
 *
 * The Facilitator is the session orchestrator (FLIGHT director). This module
 * contains the core pure-function logic: assessProblem() classifies user
 * problem statements by nature/complexity and recommends a pathway;
 * evaluateTransitionReadiness() computes a weighted confidence score for
 * phase/technique transitions.
 *
 * Plan 309-01 delivers these two tested functions plus the IFacilitatorAgent
 * interface and FacilitatorAgent class stub. Plan 309-02 fills in the
 * remaining 6 methods.
 *
 * Only imports from ../shared/types.js, ../shared/constants.js,
 * ../pathways/router.js, ../core/session-manager.js, ../core/phase-controller.js.
 * No imports from den/, vtm/, knowledge/.
 */

import type {
  SessionState,
  SessionPhase,
  PathwayId,
  TechniqueId,
  AgentRole,
  EnergyLevel,
  BrainstormMessage,
} from '../shared/types.js';
import { PHASE_ORDER, TECHNIQUE_DEFAULTS } from '../shared/constants.js';
import type { IPathwayRouter } from '../pathways/router.js';
import type { ISessionManager } from '../core/session-manager.js';
import type { IPhaseController } from '../core/phase-controller.js';

// ============================================================================
// Exported types
// ============================================================================

/**
 * Result of problem statement assessment.
 *
 * nature: the inferred category of the problem.
 * complexity: estimated difficulty.
 * recommended_pathway: which guided pathway to use.
 * recommended_techniques: first 2-3 techniques from the pathway.
 * estimated_duration_ms: sum of default durations for recommended techniques.
 * rationale: human-readable explanation of the mapping.
 */
export interface ProblemAssessment {
  nature: 'open-ended' | 'analytical' | 'improvement' | 'decision' | 'explicit' | 'mixed';
  complexity: 'simple' | 'moderate' | 'complex';
  recommended_pathway: PathwayId;
  recommended_techniques: TechniqueId[];
  estimated_duration_ms: number;
  rationale: string;
}

/**
 * Signal indicating a phase or technique transition is warranted.
 *
 * type: what triggered the signal.
 * confidence: 0-1 weighted score.
 * recommendation: next phase or technique.
 * rationale: human-readable explanation.
 */
export interface TransitionSignal {
  type: 'timer_expiry' | 'user_request' | 'energy_low' |
        'saturation_detected' | 'natural_completion' | 'technique_switch';
  confidence: number;
  recommendation: SessionPhase | TechniqueId;
  rationale: string;
}

/**
 * Guidance message from the Facilitator to the user or system.
 */
export interface FacilitatorGuidance {
  message: string;
  internal_action?: string;
  urgency: 'immediate' | 'next-pause' | 'advisory';
}

/**
 * Full Facilitator agent interface.
 *
 * 8 methods total. Plan 309-01 implements assessProblem and
 * evaluateTransitionReadiness. Plan 309-02 fills the remaining 6.
 */
export interface IFacilitatorAgent {
  assessProblem(problem_statement: string, user_context?: Record<string, unknown>): ProblemAssessment;
  recommendPathway(assessment: ProblemAssessment): PathwayId;
  adaptTechniqueQueue(session: SessionState, signal: TransitionSignal): TechniqueId[];
  evaluateTransitionReadiness(session: SessionState): TransitionSignal | null;
  generateGuidance(session: SessionState): FacilitatorGuidance;
  handleEnergySignal(level: EnergyLevel, session: SessionState): FacilitatorGuidance;
  redirectEvaluation(agent: AgentRole, content: string): FacilitatorGuidance;
  generateSessionSummary(session: SessionState): string;
}

// ============================================================================
// Signal word constants (stubs -- will be populated in GREEN phase)
// ============================================================================

const OPEN_ENDED_SIGNALS: string[] = [];
const ANALYTICAL_SIGNALS: string[] = [];
const IMPROVEMENT_SIGNALS: string[] = [];
const DECISION_SIGNALS: string[] = [];
const EXPLICIT_SIGNALS: string[] = [];
const USER_READY_SIGNALS: string[] = [];

// ============================================================================
// Pathway -> technique mapping (stubs)
// ============================================================================

const PATHWAY_TECHNIQUES: Record<PathwayId, TechniqueId[]> = {
  'creative-exploration': [],
  'problem-solving': [],
  'product-innovation': [],
  'decision-making': [],
  'free-form': [],
};

// ============================================================================
// Standalone functions (pure, no class dependency)
// ============================================================================

/**
 * Assess a problem statement to determine its nature, complexity,
 * recommended pathway, and techniques.
 *
 * STUB: Returns hardcoded values -- tests will FAIL.
 */
export function assessProblem(
  problem_statement: string,
  _user_context?: Record<string, unknown>,
): ProblemAssessment {
  return {
    nature: 'mixed',
    complexity: 'moderate',
    recommended_pathway: 'free-form',
    recommended_techniques: [],
    estimated_duration_ms: 0,
    rationale: 'Stub implementation',
  };
}

/**
 * Evaluate whether a session is ready for a phase or technique transition.
 *
 * STUB: Always returns null -- tests will FAIL.
 */
export function evaluateTransitionReadiness(
  _session: SessionState,
): TransitionSignal | null {
  return null;
}

// ============================================================================
// FacilitatorAgent class
// ============================================================================

/**
 * FacilitatorAgent -- the session FLIGHT director.
 *
 * Wraps the standalone pure functions and provides the full
 * IFacilitatorAgent interface. Methods not implemented in Plan 309-01
 * throw Error('not implemented').
 */
export class FacilitatorAgent implements IFacilitatorAgent {
  private readonly sessionManager: ISessionManager;
  private readonly phaseController: IPhaseController;
  private readonly pathwayRouter: IPathwayRouter;

  constructor(
    sessionManager: ISessionManager,
    phaseController: IPhaseController,
    pathwayRouter: IPathwayRouter,
  ) {
    this.sessionManager = sessionManager;
    this.phaseController = phaseController;
    this.pathwayRouter = pathwayRouter;
  }

  assessProblem(problem_statement: string, user_context?: Record<string, unknown>): ProblemAssessment {
    return assessProblem(problem_statement, user_context);
  }

  evaluateTransitionReadiness(session: SessionState): TransitionSignal | null {
    return evaluateTransitionReadiness(session);
  }

  recommendPathway(_assessment: ProblemAssessment): PathwayId {
    throw new Error('not implemented -- Plan 309-02');
  }

  adaptTechniqueQueue(_session: SessionState, _signal: TransitionSignal): TechniqueId[] {
    throw new Error('not implemented -- Plan 309-02');
  }

  generateGuidance(_session: SessionState): FacilitatorGuidance {
    throw new Error('not implemented -- Plan 309-02');
  }

  handleEnergySignal(_level: EnergyLevel, _session: SessionState): FacilitatorGuidance {
    throw new Error('not implemented -- Plan 309-02');
  }

  redirectEvaluation(_agent: AgentRole, _content: string): FacilitatorGuidance {
    throw new Error('not implemented -- Plan 309-02');
  }

  generateSessionSummary(_session: SessionState): string {
    throw new Error('not implemented -- Plan 309-02');
  }
}
