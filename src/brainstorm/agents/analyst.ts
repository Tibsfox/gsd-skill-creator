/**
 * Analyst agent -- SCAMPER lens management and Six Thinking Hats coordination.
 *
 * The Analyst wraps two analytical technique instances from the
 * TechniqueEngine: scamper and six-thinking-hats.
 *
 * Two distinct capabilities:
 * 1. SCAMPER: Cycles through all 7 lenses in canonical order
 *    (substitute -> combine -> adapt -> modify -> put-to-another-use ->
 *    eliminate -> reverse). Each generated idea is tagged with scamper_lens.
 *
 * 2. Six Thinking Hats: Broadcasts hat-color changes BEFORE any agent
 *    generates in new hat mode. The broadcast creates a synchronization
 *    record with acknowledged_by tracking. CRITICAL SAFETY: Black Hat
 *    broadcasts are refused during the Diverge phase (Pitfall 1 prevention).
 *
 * All generated ideas are emitted to the capture loop for Scribe
 * consumption. The Analyst follows framework structure strictly.
 *
 * Only imports from ../shared/types.js, ../techniques/engine.js,
 * ../core/rules-engine.js, ./base.js, and
 * ../techniques/analytical/six-thinking-hats.js (SIX_HATS_PHASE_CONSTRAINT).
 * Zero imports from den/, vtm/, knowledge/.
 */

import type {
  AgentRole,
  HatColor,
  Idea,
  ScamperLens,
  SessionPhase,
  SessionState,
  TechniqueId,
} from '../shared/types.js';

import type { TechniqueEngine } from '../techniques/engine.js';
import type { RulesEngine } from '../core/rules-engine.js';

import { SIX_HATS_PHASE_CONSTRAINT } from '../techniques/analytical/six-thinking-hats.js';
import { TechniqueAgent } from './base.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Hat broadcast type -- sent before any agent generates in new hat mode.
 *
 * The Analyst creates this record when changing hat color. In Phase 311,
 * the bus integration will deliver this to all agents. For now the outbox
 * pattern is sufficient -- the broadcast is stored in hatBroadcastHistory.
 *
 * acknowledged_by tracks which agents have acknowledged the broadcast.
 * The Analyst does NOT wait for acknowledgments before proceeding --
 * synchronization is enforced at integration time (Phase 311).
 */
export type HatBroadcast = {
  hat_color: HatColor;
  session_id: string;
  phase: SessionPhase;
  broadcast_at: number;
  /** Agents that have acknowledged this broadcast. */
  acknowledged_by: AgentRole[];
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Canonical SCAMPER lens order.
 *
 * S-C-A-M-P-E-R: substitute -> combine -> adapt -> modify ->
 * put-to-another-use -> eliminate -> reverse.
 */
const SCAMPER_LENSES: ScamperLens[] = [
  'substitute',
  'combine',
  'adapt',
  'modify',
  'put-to-another-use',
  'eliminate',
  'reverse',
];

// ============================================================================
// Analyst agent
// ============================================================================

/**
 * Analyst agent -- SCAMPER framework cycling and Six Thinking Hats coordination.
 *
 * Operates 2 techniques: scamper, six-thinking-hats.
 * SCAMPER: cycles all 7 lenses in canonical order.
 * Six Thinking Hats: broadcasts hat-color changes with safety enforcement.
 */
export class Analyst extends TechniqueAgent {
  /** Techniques this agent is assigned to operate. */
  private static readonly ASSIGNED_TECHNIQUES: TechniqueId[] = [
    'scamper',
    'six-thinking-hats',
  ];

  /** Current SCAMPER lens (null when not in SCAMPER mode). */
  private currentScamperLens: ScamperLens | null = null;

  /** Current position in the SCAMPER lens cycle. */
  private scamperLensIndex = 0;

  /** History of all hat-color broadcast records. */
  private hatBroadcastHistory: HatBroadcast[] = [];

  constructor(engine: TechniqueEngine, rulesEngine: RulesEngine) {
    super('analyst', engine, rulesEngine);
  }

  /**
   * Return the 2 technique IDs this agent operates.
   */
  getAssignedTechniques(): TechniqueId[] {
    return [...Analyst.ASSIGNED_TECHNIQUES];
  }

  // ==========================================================================
  // SCAMPER capability
  // ==========================================================================

  /**
   * Generate a round of SCAMPER ideas under the current lens.
   *
   * Cycles through all 7 lenses in canonical order:
   * substitute -> combine -> adapt -> modify -> put-to-another-use ->
   * eliminate -> reverse.
   *
   * Steps:
   * 1. Load 'scamper' technique instance
   * 2. Advance lens index: scamperLensIndex = round_number % SCAMPER_LENSES.length
   * 3. Set currentScamperLens
   * 4. Initialize and call instance.generateRound(round_number)
   * 5. Enforce scamper_lens on all returned ideas
   * 6. Emit to capture loop
   * 7. Return ideas
   */
  generateScamperRound(session: SessionState, round_number: number): Idea[] {
    // 1. Load fresh technique instance
    const instance = this.engine.loadTechnique('scamper');

    // 2. Advance lens index
    this.scamperLensIndex = round_number % SCAMPER_LENSES.length;

    // 3. Set current lens
    this.currentScamperLens = SCAMPER_LENSES[this.scamperLensIndex];

    // 4. Initialize and generate
    instance.initialize(session.problem_statement, session);
    const output = instance.generateRound(round_number);

    // 5. Extract ideas and enforce scamper_lens tag
    const ideas = (output.ideas ?? []).map((idea) => ({
      ...idea,
      scamper_lens: this.currentScamperLens!,
    }));

    // 6. Emit to capture loop
    for (const idea of ideas) {
      this.emitToCapture({
        agent: 'analyst',
        content_type: 'idea',
        content: idea,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    // 7. Return ideas
    return ideas;
  }

  /**
   * Get the current SCAMPER lens (null when not in SCAMPER mode).
   */
  getCurrentScamperLens(): ScamperLens | null {
    return this.currentScamperLens;
  }

  // ==========================================================================
  // Six Thinking Hats capability
  // ==========================================================================

  /**
   * Broadcast a hat-color change BEFORE any agent generates in new mode.
   *
   * CRITICAL SAFETY: Refuses Black Hat during Diverge phase.
   * This is the Analyst's enforcement of Pitfall 1 (PITFALLS.md) --
   * Black Hat generates evaluative content (risks, weaknesses) which
   * violates Osborn's Rule 2 (No Criticism) during Diverge.
   *
   * The broadcast creates a HatBroadcast record with acknowledged_by: [].
   * In Phase 311, the bus integration delivers this to all agents.
   * For now the record is stored in hatBroadcastHistory.
   *
   * Returns the HatBroadcast if allowed, or null if refused.
   */
  broadcastHatChange(
    hat_color: HatColor,
    session_id: string,
    phase: SessionPhase,
  ): HatBroadcast | null {
    // 1. Black Hat safety check -- refuse during Diverge
    const forbidden_phases = SIX_HATS_PHASE_CONSTRAINT.black_hat_forbidden_phases;
    if (
      hat_color === 'black' &&
      (forbidden_phases as readonly string[]).includes(phase)
    ) {
      console.warn(
        `SAFETY: Refusing Black Hat broadcast during ${phase} phase ` +
        '(Pitfall 1 prevention -- Black Hat forbidden during Diverge)',
      );
      return null;
    }

    // 2. Create broadcast record
    const broadcast: HatBroadcast = {
      hat_color,
      session_id,
      phase,
      broadcast_at: Date.now(),
      acknowledged_by: [],
    };

    // 3. Store in history
    this.hatBroadcastHistory.push(broadcast);

    // 4. Return the broadcast
    return broadcast;
  }

  /**
   * Acknowledge a hat broadcast from another agent.
   *
   * Finds the most recent broadcast for the given hat_color and adds
   * the agent to its acknowledged_by array. Used in tests to simulate
   * agents acknowledging the broadcast.
   */
  acknowledgeHatBroadcast(hat_color: HatColor, agent: AgentRole): void {
    // Find the most recent broadcast for this hat_color
    for (let i = this.hatBroadcastHistory.length - 1; i >= 0; i--) {
      if (this.hatBroadcastHistory[i].hat_color === hat_color) {
        if (!this.hatBroadcastHistory[i].acknowledged_by.includes(agent)) {
          this.hatBroadcastHistory[i].acknowledged_by.push(agent);
        }
        return;
      }
    }
  }

  /**
   * Generate a round of Six Thinking Hats ideas.
   *
   * Steps:
   * 1. Load 'six-thinking-hats' technique instance
   * 2. Initialize with problem context
   * 3. Determine current hat from technique state or hat_order progression
   * 4. Broadcast hat-color change -- if refused (Black Hat during Diverge),
   *    skip this round and return []
   * 5. Generate round output
   * 6. Emit to capture loop
   * 7. Return ideas
   */
  generateHatsRound(session: SessionState, round_number: number): Idea[] {
    // 1. Load technique instance
    const instance = this.engine.loadTechnique('six-thinking-hats');

    // 2. Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // 3. Determine current hat from technique state
    const state = instance.getState();
    const current_hat = state.current_hat as HatColor;

    // 4. Broadcast hat-color change
    const broadcast = this.broadcastHatChange(
      current_hat,
      session.id,
      session.phase,
    );

    // If broadcast was refused (Black Hat during Diverge), skip round
    if (broadcast === null) {
      return [];
    }

    // 5. Generate round output
    const output = instance.generateRound(round_number);

    // 6. Extract ideas and emit to capture loop
    const ideas = output.ideas ?? [];
    for (const idea of ideas) {
      this.emitToCapture({
        agent: 'analyst',
        content_type: 'idea',
        content: idea,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    // 7. Return ideas
    return ideas;
  }

  /**
   * Get the full hat broadcast history.
   *
   * Returns a copy of the history array. Used for test verification
   * and bus integration (Phase 311).
   */
  getHatBroadcastHistory(): HatBroadcast[] {
    return [...this.hatBroadcastHistory];
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new Analyst agent instance.
 *
 * Factory function following the project's functional API + class wrapper
 * pattern.
 */
export function createAnalyst(engine: TechniqueEngine, rulesEngine: RulesEngine): Analyst {
  return new Analyst(engine, rulesEngine);
}
