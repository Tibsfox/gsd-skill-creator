/**
 * Osborn Rules Engine.
 *
 * Enforces Osborn's four brainstorming rules architecturally:
 * 1. Generate Many Ideas (quantity)
 * 2. Withhold Criticism (no-criticism) -- Critic agent gated to Converge only
 * 3. Welcome Unusual Ideas (wild-ideas)
 * 4. Combine and Build on Ideas (build-combine)
 *
 * The Critic gate in canActivateAgent() is the system's most critical safety
 * constraint -- a hard enforcement point checked BEFORE general phase rules.
 * This is the first of two defense-in-depth points (the second is the Phase
 * Controller in Phase 307).
 *
 * Only imports from brainstorm/shared -- zero imports from den/, vtm/, knowledge/.
 */

import type {
  OsbornRule,
  SessionPhase,
  AgentRole,
  BrainstormMessage,
} from '../shared/types.js';
import { AGENT_PHASE_RULES } from '../shared/constants.js';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * A recorded rule violation.
 *
 * Persists across phase transitions and is queryable by phase, agent, and rule.
 */
export interface RuleViolation {
  rule: OsbornRule;
  agent: AgentRole;
  message_id: string;
  violation_type: 'content' | 'activation' | 'timing';
  description: string;
  timestamp: number;
  phase: SessionPhase;
  action_taken: 'blocked' | 'warned' | 'logged';
}

/**
 * Configuration for the Rules Engine.
 */
export interface RulesEngineConfig {
  enforcement_mode: 'strict' | 'advisory' | 'off';
  evaluative_patterns: string[];
  encouragement_patterns: string[];
}

/**
 * Full Rules Engine interface.
 *
 * checkMessage and getViolations are stubs in Plan 01, fully implemented
 * in Plan 02 (evaluative content detection, violation logging).
 */
export interface IRulesEngine {
  checkMessage(
    message: BrainstormMessage,
    phase: SessionPhase,
  ): { allowed: boolean; violations: RuleViolation[] };

  canActivateAgent(
    agent: AgentRole,
    phase: SessionPhase,
  ): { allowed: boolean; reason?: string };

  getActiveRules(phase: SessionPhase): OsbornRule[];

  getViolations(session_id: string): RuleViolation[];

  generateRuleReminder(phase: SessionPhase): string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Phase-to-active-rules mapping.
 *
 * Encodes which Osborn rules are enforced during each session phase.
 * Diverge enforces all 4 rules. Organize retains build-combine only.
 * Explore, Converge, and Act have no active rules.
 */
const PHASE_RULE_MAP: Record<SessionPhase, OsbornRule[]> = {
  explore: [],
  diverge: ['quantity', 'no-criticism', 'wild-ideas', 'build-combine'],
  organize: ['build-combine'],
  converge: [],
  act: [],
};

/**
 * Phase-specific rule reminder messages for Facilitator display.
 */
const PHASE_REMINDERS: Record<SessionPhase, string> = {
  diverge:
    'All ideas welcome -- no evaluation. Rules in effect: ' +
    'Generate Many Ideas (quantity), Withhold Criticism (no-criticism), ' +
    'Welcome Unusual Ideas (wild-ideas), Combine and Build on Ideas (build-combine).',
  organize:
    'Build on ideas -- combine and extend. Focus on connections and categories.',
  explore:
    'Assessment mode -- explore the problem space freely.',
  converge:
    'Evaluation is now encouraged. Apply critical thinking to select the best ideas.',
  act:
    'Action planning mode -- focus on implementation steps.',
};

/**
 * Default configuration for the Rules Engine.
 *
 * evaluative_patterns: hard-block patterns for Stage 1 evaluative detection.
 * encouragement_patterns: constructive-context patterns for Stage 2 false-positive prevention.
 */
export const DEFAULT_RULES_ENGINE_CONFIG: RulesEngineConfig = {
  enforcement_mode: 'strict',
  evaluative_patterns: [
    "that won't work",
    'that will not work',
    'bad idea',
    'terrible idea',
    'not feasible',
    'unrealistic',
    'we already tried',
    "we've already tried",
    'everyone knows',
    "that's wrong",
    "that's incorrect",
    'we should not do this',
    'too risky, abandon',
    'terrible approach',
    'clearly wrong',
  ],
  encouragement_patterns: [
    'and we could',
    'what if we',
    'combined with',
    'building on',
    'could also',
    'unless we',
    'could become',
    'but if we',
    'in isolation but',
    'on its own but',
  ],
};

// ============================================================================
// RulesEngine class
// ============================================================================

/**
 * Osborn Rules Engine implementation.
 *
 * Five capabilities:
 * 1. canActivateAgent -- Critic gate (checked FIRST) + general phase rules
 * 2. getActiveRules -- phase-to-rule lookup
 * 3. generateRuleReminder -- phase-appropriate facilitator messages
 * 4. checkMessage -- two-stage evaluative content detection + Black Hat constraint
 * 5. getViolations -- accumulated violation history per session
 */
export class RulesEngine implements IRulesEngine {
  private readonly config: RulesEngineConfig;
  private readonly _violations: Map<string, RuleViolation[]> = new Map();

  constructor(config: RulesEngineConfig) {
    this.config = config;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Check whether an agent can activate in the given phase.
   *
   * CRITICAL: The Critic special case is checked FIRST, before general
   * AGENT_PHASE_RULES lookup. This ensures the Critic is architecturally
   * blocked from all non-Converge phases regardless of any other configuration.
   */
  canActivateAgent(
    agent: AgentRole,
    phase: SessionPhase,
  ): { allowed: boolean; reason?: string } {
    // Critic special case -- hard gate (defense-in-depth point 1)
    if (agent === 'critic' && phase !== 'converge') {
      return {
        allowed: false,
        reason:
          `Critic agent cannot activate during ${phase} phase. ` +
          `Osborn Rule 2 (No Criticism) is in effect. ` +
          `Critic activates only during the Converge phase.`,
      };
    }

    // General phase rules lookup
    const phaseRules = AGENT_PHASE_RULES[agent];
    if (!phaseRules.active.includes(phase)) {
      return {
        allowed: false,
        reason: `${agent} is not configured for ${phase} phase.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get the Osborn rules active during the given phase.
   */
  getActiveRules(phase: SessionPhase): OsbornRule[] {
    return PHASE_RULE_MAP[phase];
  }

  /**
   * Generate a phase-appropriate rule reminder for Facilitator display.
   *
   * Returns a non-empty string for every phase. Diverge explicitly names
   * all 4 Osborn rules.
   */
  generateRuleReminder(phase: SessionPhase): string {
    return PHASE_REMINDERS[phase];
  }

  /**
   * Check a message against active rules for the given phase.
   *
   * During non-diverge phases: always allows (no content filtering).
   * During diverge phase, applies three checks in order:
   *   1. Black Hat constraint (hat_color === 'black') -> blocked with violation_type: 'timing'
   *   2. Stage 1: evaluative pattern match (hard_block_patterns)
   *   3. Stage 2: constructive-context check (if Stage 1 matched, allows if constructive)
   */
  checkMessage(
    message: BrainstormMessage,
    phase: SessionPhase,
  ): { allowed: boolean; violations: RuleViolation[] } {
    // No content filtering outside Diverge phase
    if (phase !== 'diverge') {
      return { allowed: true, violations: [] };
    }

    // Resolve agent for violation record -- 'system' is not an AgentRole
    const agent = this.resolveAgent(message.from);

    // Black Hat constraint -- checked BEFORE evaluative content
    const hatColor = message.payload.hat_color;
    if (hatColor === 'black') {
      const violation: RuleViolation = {
        rule: 'no-criticism',
        agent,
        message_id: message.id,
        violation_type: 'timing',
        description:
          'Black Hat (critical judgment) is not permitted during Diverge phase. ' +
          'Critical thinking is reserved for the Converge phase.',
        timestamp: Date.now(),
        phase,
        action_taken: 'blocked',
      };
      this.logViolation(message.session_id, violation);
      return { allowed: false, violations: [violation] };
    }

    // Extract content -- payload.content may be undefined or non-string
    const content =
      typeof message.payload.content === 'string'
        ? message.payload.content
        : '';

    // Stage 1: evaluative pattern match
    if (this.isEvaluativeContent(content, this.config.evaluative_patterns)) {
      // Stage 2: constructive-context check (false positive prevention)
      if (this.hasConstructiveContext(content, this.config.encouragement_patterns)) {
        return { allowed: true, violations: [] };
      }

      // Blocked -- evaluative content without constructive context
      const violation: RuleViolation = {
        rule: 'no-criticism',
        agent,
        message_id: message.id,
        violation_type: 'content',
        description:
          'Message contains evaluative content during Diverge phase. ' +
          'Osborn Rule 2 (Withhold Criticism) is in effect.',
        timestamp: Date.now(),
        phase,
        action_taken: 'blocked',
      };
      this.logViolation(message.session_id, violation);
      return { allowed: false, violations: [violation] };
    }

    return { allowed: true, violations: [] };
  }

  /**
   * Get violation history for a session.
   *
   * Returns all accumulated RuleViolation records for the given session_id.
   * Returns [] if no violations have been logged for that session.
   */
  getViolations(session_id: string): RuleViolation[] {
    return this._violations.get(session_id) ?? [];
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  /**
   * Stage 1: Check if content contains any evaluative pattern (substring match).
   */
  private isEvaluativeContent(content: string, patterns: string[]): boolean {
    const lower = content.toLowerCase();
    return patterns.some((pattern) => lower.includes(pattern));
  }

  /**
   * Stage 2: Check if content contains constructive context that redeems
   * the evaluative vocabulary (false positive prevention).
   */
  private hasConstructiveContext(
    content: string,
    encouragement: string[],
  ): boolean {
    const lower = content.toLowerCase();
    return encouragement.some((pattern) => lower.includes(pattern));
  }

  /**
   * Resolve the agent role from message sender.
   * 'system' is not a valid AgentRole -- fall back to 'facilitator'.
   */
  private resolveAgent(from: BrainstormMessage['from']): AgentRole {
    return from === 'system' ? 'facilitator' : from;
  }

  /**
   * Log a violation to the per-session violation history.
   * Accumulates -- violations are never cleared.
   */
  private logViolation(sessionId: string, violation: RuleViolation): void {
    const existing = this._violations.get(sessionId);
    if (existing) {
      existing.push(violation);
    } else {
      this._violations.set(sessionId, [violation]);
    }
  }
}
