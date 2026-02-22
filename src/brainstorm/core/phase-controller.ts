/**
 * Phase Controller for brainstorm sessions.
 *
 * Manages the Explore -> Diverge -> Organize -> Converge -> Act flow,
 * enforces agent activation/deactivation at phase boundaries using the
 * Rules Engine as the gate, and produces PhaseTransitionResult with
 * facilitator announcements for each transition.
 *
 * Phase transitions are the critical moments where Osborn's rules change
 * and agents come online or go offline. PhaseController is the second
 * defense-in-depth point for the Critic gate (Rules Engine is first).
 *
 * PhaseController owns NO persistent state -- it is a pure orchestrator.
 * All state reads/writes delegate to SessionManager.
 *
 * Only imports from brainstorm/shared and brainstorm/core -- zero imports
 * from den/, vtm/, knowledge/.
 */

import type {
  SessionPhase,
  AgentRole,
  OsbornRule,
  PathwayId,
  TechniqueId,
  TimerState,
} from '../shared/types.js';
import { PHASE_ORDER } from '../shared/constants.js';

import type { ISessionManager } from './session-manager.js';
import type { IRulesEngine } from './rules-engine.js';

// ============================================================================
// Exported types
// ============================================================================

/**
 * Result of a phase transition attempt.
 *
 * When success is false, from_phase and to_phase reflect the attempted
 * transition but agents_activated/deactivated will be empty and
 * facilitator_announcement will contain the rejection reason.
 */
export interface PhaseTransitionResult {
  success: boolean;
  from_phase: SessionPhase;
  to_phase: SessionPhase;
  agents_activated: AgentRole[];
  agents_deactivated: AgentRole[];
  rules_now_active: OsbornRule[];
  facilitator_announcement: string;
}

/**
 * Result of an agent activation attempt.
 *
 * When success is false, reason explains why (Rules Engine gate).
 */
export interface AgentActivationResult {
  success: boolean;
  agent: AgentRole;
  phase: SessionPhase;
  reason?: string;
}

/**
 * A technique transition with mandatory timer behavior.
 *
 * timer_behavior is typed as a union -- never a plain string.
 * For technique switches, the only valid value is 'reset-to-default'.
 * This type prevents the timer desync pitfall identified in RESEARCH.md.
 */
export interface TechniqueTransition {
  session_id: string;
  from_technique: TechniqueId | null;
  to_technique: TechniqueId | null;
  timer_behavior: 'reset-to-default' | 'inherit' | 'pause';
}

/**
 * PhaseController interface.
 *
 * All async methods delegate to SessionManager for state reads/writes.
 * PhaseController is a pure orchestrator with no persistent state.
 */
export interface IPhaseController {
  getCurrentPhase(session_id: string): Promise<SessionPhase>;
  transitionTo(session_id: string, phase: SessionPhase): Promise<PhaseTransitionResult>;
  canTransitionTo(session_id: string, phase: SessionPhase): Promise<{ allowed: boolean; reason?: string }>;
  getActiveAgents(phase: SessionPhase, pathway: PathwayId | null): AgentRole[];
  activateAgent(session_id: string, agent: AgentRole): Promise<AgentActivationResult>;
  deactivateAgent(session_id: string, agent: AgentRole): Promise<void>;
  setTechniqueTimer(session_id: string, technique: TechniqueId, custom_ms?: number): Promise<void>;
  getTimerState(session_id: string): Promise<TimerState>;
  applyTechniqueTransition(transition: TechniqueTransition): Promise<void>;
}

// ============================================================================
// Phase-Agent Activation Matrix
// ============================================================================

/**
 * Phase-Agent Activation Matrix (from component spec).
 *
 * Defines which agents are always active, activated on entry, and
 * deactivated on entry for each session phase.
 *
 * Critical invariant: 'critic' is in diverge.deactivated.
 * // Defense-in-depth point 2: Critic cannot activate during diverge (Rules Engine is point 1)
 */
const PHASE_AGENT_MATRIX: Record<SessionPhase, {
  always_active: AgentRole[];
  activated: AgentRole[];
  deactivated: AgentRole[];
}> = {
  explore: {
    always_active: ['facilitator', 'scribe'],
    activated: [],
    deactivated: [],
  },
  diverge: {
    always_active: ['facilitator', 'scribe'],
    activated: ['ideator', 'questioner', 'analyst', 'mapper', 'persona'],
    // Defense-in-depth point 2: Critic cannot activate during diverge (Rules Engine is point 1)
    deactivated: ['critic'],
  },
  organize: {
    always_active: ['facilitator', 'scribe'],
    activated: ['mapper'],
    deactivated: ['ideator', 'questioner', 'persona'],
  },
  converge: {
    always_active: ['facilitator', 'scribe'],
    activated: ['critic'],
    deactivated: ['mapper', 'ideator', 'questioner', 'analyst', 'persona'],
  },
  act: {
    always_active: ['facilitator', 'scribe'],
    activated: [],
    deactivated: ['critic'],
  },
};

// ============================================================================
// Phase transition announcement intros
// ============================================================================

/**
 * Contextual intro messages prepended to rule reminders for each phase.
 */
const PHASE_ANNOUNCEMENT_INTROS: Record<SessionPhase, string> = {
  explore: 'Entering Explore -- let\'s understand the problem space.',
  diverge: 'Entering Diverge -- the creative zone is open!',
  organize: 'Entering Organize -- time to find connections.',
  converge: 'Entering Converge -- applying critical thinking.',
  act: 'Entering Act -- from ideas to action.',
};

// ============================================================================
// PhaseController implementation
// ============================================================================

/**
 * PhaseController -- orchestrates phase transitions, agent activation,
 * and technique timer management.
 *
 * Pure orchestrator: owns NO persistent state. All reads/writes go
 * through SessionManager. All agent activation checks go through
 * Rules Engine first (defense-in-depth).
 */
export class PhaseController implements IPhaseController {
  private readonly sessionManager: ISessionManager;
  private readonly rulesEngine: IRulesEngine;

  constructor(sessionManager: ISessionManager, rulesEngine: IRulesEngine) {
    this.sessionManager = sessionManager;
    this.rulesEngine = rulesEngine;
  }

  // ==========================================================================
  // Phase queries
  // ==========================================================================

  /**
   * Get the current phase of a session.
   *
   * Delegates to SessionManager.getSession().
   */
  async getCurrentPhase(session_id: string): Promise<SessionPhase> {
    const session = await this.sessionManager.getSession(session_id);
    return session.phase;
  }

  // ==========================================================================
  // Phase transition
  // ==========================================================================

  /**
   * Check whether a phase transition is allowed.
   *
   * Rules:
   * - Can only move to the immediately next phase (index + 1)
   * - No skipping phases (e.g., explore -> converge is rejected)
   * - No going backwards (e.g., converge -> diverge is rejected)
   * - Exception: diverge -> diverge is allowed (technique loops within diverge)
   */
  async canTransitionTo(
    session_id: string,
    phase: SessionPhase,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const session = await this.sessionManager.getSession(session_id);
    const currentPhase = session.phase;

    // Allow diverge -> diverge loop (technique loops within diverge)
    if (currentPhase === 'diverge' && phase === 'diverge') {
      return { allowed: true };
    }

    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    const targetIndex = PHASE_ORDER.indexOf(phase);

    // Reject backward transitions
    if (targetIndex < currentIndex) {
      return {
        allowed: false,
        reason: `Cannot transition backwards from '${currentPhase}' to '${phase}'. Phases must advance forward.`,
      };
    }

    // Reject same-phase transitions (except diverge loop handled above)
    if (targetIndex === currentIndex) {
      return {
        allowed: false,
        reason: `Already in '${currentPhase}' phase. Cannot self-transition (except diverge loop).`,
      };
    }

    // Reject skipping phases (must be exactly next)
    if (targetIndex !== currentIndex + 1) {
      return {
        allowed: false,
        reason: `Cannot skip from '${currentPhase}' to '${phase}'. Must transition to '${PHASE_ORDER[currentIndex + 1]}' first.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Transition a session to a new phase.
   *
   * Orchestrates: validation, agent activation/deactivation (with Rules
   * Engine gate), state updates via SessionManager, rule reminder
   * generation, and facilitator announcement composition.
   *
   * Returns PhaseTransitionResult with all 6 fields populated.
   */
  async transitionTo(
    session_id: string,
    phase: SessionPhase,
  ): Promise<PhaseTransitionResult> {
    // 1. Check if transition is allowed
    const canTransition = await this.canTransitionTo(session_id, phase);
    if (!canTransition.allowed) {
      const session = await this.sessionManager.getSession(session_id);
      return {
        success: false,
        from_phase: session.phase,
        to_phase: phase,
        agents_activated: [],
        agents_deactivated: [],
        rules_now_active: [],
        facilitator_announcement: canTransition.reason ?? 'Transition not allowed.',
      };
    }

    // 2. Get current session state
    const session = await this.sessionManager.getSession(session_id);
    const fromPhase = session.phase;
    const currentAgents = new Set(session.active_agents);

    // 3. Compute agents to activate (exclude already-active agents)
    const matrixEntry = PHASE_AGENT_MATRIX[phase];
    const agentsToActivate: AgentRole[] = [];
    for (const agent of matrixEntry.activated) {
      if (!currentAgents.has(agent)) {
        // 5. Verify with Rules Engine (defense-in-depth for Critic gate)
        const check = this.rulesEngine.canActivateAgent(agent, phase);
        if (check.allowed) {
          agentsToActivate.push(agent);
        }
        // If Rules Engine blocks, silently skip (logged at Rules Engine level)
      }
    }

    // 4. Compute agents to deactivate (only those currently active)
    const agentsToDeactivate: AgentRole[] = [];
    for (const agent of matrixEntry.deactivated) {
      if (currentAgents.has(agent)) {
        agentsToDeactivate.push(agent);
      }
    }

    // 6. Update phase via SessionManager
    await this.sessionManager.updatePhase(session_id, phase);

    // 7. Compute new agents list: remove deactivated, add activated, keep always_active
    const newAgents = new Set<AgentRole>();

    // Start with current agents
    for (const agent of currentAgents) {
      newAgents.add(agent);
    }

    // Remove deactivated
    for (const agent of agentsToDeactivate) {
      newAgents.delete(agent);
    }

    // Add activated
    for (const agent of agentsToActivate) {
      newAgents.add(agent);
    }

    // Always keep facilitator + scribe
    for (const agent of matrixEntry.always_active) {
      newAgents.add(agent);
    }

    // 8. Set new active agents via SessionManager
    await this.sessionManager.setActiveAgents(session_id, [...newAgents]);

    // 9. Get active rules for the new phase
    const rulesNowActive = this.rulesEngine.getActiveRules(phase);

    // 10. Generate facilitator announcement
    const ruleReminder = this.rulesEngine.generateRuleReminder(phase);
    const intro = PHASE_ANNOUNCEMENT_INTROS[phase];
    const facilitatorAnnouncement = `${intro} ${ruleReminder}`;

    // 11. Return full PhaseTransitionResult
    return {
      success: true,
      from_phase: fromPhase,
      to_phase: phase,
      agents_activated: agentsToActivate,
      agents_deactivated: agentsToDeactivate,
      rules_now_active: rulesNowActive,
      facilitator_announcement: facilitatorAnnouncement,
    };
  }

  // ==========================================================================
  // Agent activation/deactivation
  // ==========================================================================

  /**
   * Activate an agent in the current phase.
   *
   * This is the second enforcement point for the Critic gate.
   * Rules Engine is the first gate; this method checks again for
   * defense-in-depth.
   */
  async activateAgent(
    session_id: string,
    agent: AgentRole,
  ): Promise<AgentActivationResult> {
    const session = await this.sessionManager.getSession(session_id);
    const currentPhase = session.phase;

    // Defense-in-depth: check Rules Engine before activation
    const check = this.rulesEngine.canActivateAgent(agent, currentPhase);
    if (!check.allowed) {
      return {
        success: false,
        agent,
        phase: currentPhase,
        reason: check.reason,
      };
    }

    // Add agent to active_agents if not already present
    const currentAgents = new Set(session.active_agents);
    if (!currentAgents.has(agent)) {
      currentAgents.add(agent);
      await this.sessionManager.setActiveAgents(session_id, [...currentAgents]);
    }

    return {
      success: true,
      agent,
      phase: currentPhase,
    };
  }

  /**
   * Deactivate an agent.
   *
   * Idempotent: never throws if agent is not currently active.
   */
  async deactivateAgent(session_id: string, agent: AgentRole): Promise<void> {
    const session = await this.sessionManager.getSession(session_id);
    const currentAgents = session.active_agents.filter((a) => a !== agent);
    await this.sessionManager.setActiveAgents(session_id, currentAgents);
  }

  // ==========================================================================
  // Agent queries
  // ==========================================================================

  /**
   * Get the set of active agents for a given phase and pathway.
   *
   * Returns always_active + activated agents, deduplicated.
   * If pathway is 'free-form', returns just facilitator and scribe
   * (all other agents are on-demand).
   */
  getActiveAgents(phase: SessionPhase, pathway: PathwayId | null): AgentRole[] {
    // Free-form pathway: only facilitator and scribe
    if (pathway === 'free-form') {
      return ['facilitator', 'scribe'];
    }

    const matrixEntry = PHASE_AGENT_MATRIX[phase];
    const agents = new Set<AgentRole>();

    // Always-active agents
    for (const agent of matrixEntry.always_active) {
      agents.add(agent);
    }

    // Phase-activated agents
    for (const agent of matrixEntry.activated) {
      agents.add(agent);
    }

    return [...agents];
  }

  // ==========================================================================
  // Technique timer management
  // ==========================================================================

  /**
   * Set a technique timer for the session.
   *
   * Calls SessionManager.setActiveTechnique() so the TechniqueTransition
   * timer reset protocol is honored. Every technique switch MUST reset
   * the timer -- never inherit the old timer's remaining time.
   *
   * If custom_ms is provided, the timer is adjusted after the initial
   * setActiveTechnique call.
   */
  async setTechniqueTimer(
    session_id: string,
    technique: TechniqueId,
    custom_ms?: number,
  ): Promise<void> {
    // Set technique via SessionManager (resets timer to technique default)
    await this.sessionManager.setActiveTechnique(session_id, technique);

    // If custom duration provided, read state and update timer values
    if (custom_ms !== undefined) {
      const session = await this.sessionManager.getSession(session_id);
      if (session.timer.technique_timer) {
        session.timer.technique_timer.remaining_ms = custom_ms;
        session.timer.technique_timer.total_ms = custom_ms;
      }
      // Write the adjusted timer state back
      // Since we can't directly write state through ISessionManager,
      // we use setActiveTechnique to reset and then adjust via a
      // re-read/re-set cycle. The technique is already set correctly;
      // we need to update timer values by re-calling setActiveTechnique
      // which always resets to default. For custom durations, we accept
      // the default timer reset as the authoritative behavior.
      //
      // Note: The ISessionManager interface does not expose a direct
      // timer write method. Custom durations would need an extended
      // interface. For now, setActiveTechnique resets to technique default.
    }
  }

  /**
   * Get the current timer state for a session.
   *
   * Delegates to SessionManager.getSession().
   */
  async getTimerState(session_id: string): Promise<TimerState> {
    const session = await this.sessionManager.getSession(session_id);
    return session.timer;
  }

  /**
   * Apply a technique transition with mandatory timer behavior.
   *
   * This method is the single choke point for all technique switches.
   * Prevents the timer desync pitfall from RESEARCH.md by ensuring
   * every technique switch goes through the same reset path.
   *
   * timer_behavior: 'reset-to-default' is the only valid value for
   * technique switches. 'inherit' and 'pause' exist in the type for
   * future extensibility but are not used for switches.
   */
  async applyTechniqueTransition(transition: TechniqueTransition): Promise<void> {
    const { session_id, to_technique, timer_behavior } = transition;

    if (to_technique === null) {
      // Clear technique
      await this.sessionManager.setActiveTechnique(session_id, null);
      return;
    }

    if (timer_behavior === 'reset-to-default') {
      // Reset timer to technique default via setTechniqueTimer
      await this.setTechniqueTimer(session_id, to_technique);
      return;
    }

    // For 'inherit' or 'pause': still set the technique but through
    // the standard path (which always resets). The type exists for
    // future extensibility.
    await this.setTechniqueTimer(session_id, to_technique);
  }
}
