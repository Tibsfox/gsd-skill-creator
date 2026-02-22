/**
 * TechniqueAgent abstract base class.
 *
 * Provides shared infrastructure for all 7 technique agents:
 * - Constraint enforcement via RulesEngine.checkMessage()
 * - Capture loop wiring via internal outbox (emitToCapture / getCaptureMessages)
 * - Energy signal emission via internal outbox (emitEnergySignal / getEnergySignals)
 * - Phase and session tracking
 *
 * Agents are pure logic -- no filesystem writes. The bus integration
 * (Phase 311) handles actual message delivery. Internal outboxes
 * use a drain pattern: getCaptureMessages() and getEnergySignals()
 * return accumulated items and clear the arrays.
 *
 * Only imports from ../shared/types.js, ../shared/constants.js,
 * ../core/rules-engine.js, ../techniques/engine.js.
 * Zero imports from den/, vtm/, knowledge/.
 */

import type {
  AgentRole,
  SessionPhase,
  EnergyLevel,
  BrainstormMessage,
  Idea,
  Question,
  Cluster,
  Evaluation,
  ActionItem,
  TechniqueId,
} from '../shared/types.js';

import type { RulesEngine } from '../core/rules-engine.js';
import type { TechniqueEngine } from '../techniques/engine.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Inter-agent message for direct agent-to-agent communication.
 *
 * Not the same as BrainstormMessage (bus message). AgentMessage is
 * for the agent coordination layer; BrainstormMessage is for the
 * filesystem bus.
 */
export type AgentMessage = {
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: BrainstormMessage['type'];
  payload: Record<string, unknown>;
  session_id: string;
  phase: SessionPhase;
};

/**
 * Message emitted to the capture loop for Scribe consumption.
 *
 * Each agent produces CaptureLoopMessages during generation. The
 * Scribe agent processes these to maintain the session transcript
 * and idea/question repositories.
 */
export type CaptureLoopMessage = {
  agent: AgentRole;
  content_type: 'idea' | 'question' | 'cluster' | 'evaluation' | 'action_item';
  content: Idea | Question | Cluster | Evaluation | ActionItem;
  session_id: string;
  timestamp: number;
};

// ============================================================================
// Abstract base class
// ============================================================================

/**
 * Abstract base class for all technique agents.
 *
 * Subclasses must implement:
 * - getAssignedTechniques(): TechniqueId[] -- which techniques the agent operates
 *
 * Provides:
 * - emitToCapture() / getCaptureMessages() -- capture loop outbox (drain pattern)
 * - emitEnergySignal() / getEnergySignals() -- energy signal outbox (drain pattern)
 * - validateOutput() -- delegates to RulesEngine.checkMessage()
 * - setPhase() / setSession() -- phase and session tracking
 */
export abstract class TechniqueAgent {
  protected readonly role: AgentRole;
  protected readonly engine: TechniqueEngine;
  protected readonly rulesEngine: RulesEngine;
  protected currentPhase: SessionPhase = 'explore';
  protected currentSessionId: string = '';

  /** Internal capture loop outbox -- drained by getCaptureMessages(). */
  private captureOutbox: CaptureLoopMessage[] = [];

  /** Internal energy signal outbox -- drained by getEnergySignals(). */
  private energyOutbox: EnergyLevel[] = [];

  constructor(role: AgentRole, engine: TechniqueEngine, rulesEngine: RulesEngine) {
    this.role = role;
    this.engine = engine;
    this.rulesEngine = rulesEngine;
  }

  // ==========================================================================
  // Abstract -- each agent must implement
  // ==========================================================================

  /**
   * Return the technique IDs this agent is assigned to operate.
   *
   * Used for validation in generation methods -- an agent cannot
   * run a technique it is not assigned to.
   */
  abstract getAssignedTechniques(): TechniqueId[];

  // ==========================================================================
  // Shared infrastructure
  // ==========================================================================

  /**
   * Emit a message to the capture loop (Scribe consumption).
   *
   * Appends to the internal outbox. No filesystem writes -- the bus
   * integration (Phase 311) handles delivery.
   */
  protected emitToCapture(msg: CaptureLoopMessage): void {
    this.captureOutbox.push(msg);
  }

  /**
   * Emit an energy signal for Facilitator consumption.
   *
   * Energy signals indicate output velocity changes and help the
   * Facilitator decide when to switch techniques.
   */
  protected emitEnergySignal(level: EnergyLevel): void {
    this.energyOutbox.push(level);
  }

  /**
   * Drain and return all accumulated capture loop messages.
   *
   * Returns the current outbox contents and clears the array.
   * Used by the bus integration layer and for test verification.
   */
  getCaptureMessages(): CaptureLoopMessage[] {
    const messages = [...this.captureOutbox];
    this.captureOutbox = [];
    return messages;
  }

  /**
   * Drain and return all accumulated energy signals.
   *
   * Returns the current outbox contents and clears the array.
   * Used by the bus integration layer and for test verification.
   */
  getEnergySignals(): EnergyLevel[] {
    const signals = [...this.energyOutbox];
    this.energyOutbox = [];
    return signals;
  }

  /**
   * Set the current session phase.
   *
   * Called by the Phase Controller when the session transitions.
   */
  setPhase(phase: SessionPhase): void {
    this.currentPhase = phase;
  }

  /**
   * Set the current session ID.
   *
   * Called when the agent is activated for a session.
   */
  setSession(session_id: string): void {
    this.currentSessionId = session_id;
  }

  /**
   * Validate agent output against active rules for the current phase.
   *
   * Delegates to RulesEngine.checkMessage(). Returns true if the
   * message is allowed, false if it violates active rules.
   */
  protected validateOutput(message: BrainstormMessage, phase: SessionPhase): boolean {
    const result = this.rulesEngine.checkMessage(message, phase);
    return result.allowed;
  }
}
