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
 * evaluative_patterns and encouragement_patterns are empty arrays here;
 * populated with detection patterns in Plan 02.
 */
export const DEFAULT_RULES_ENGINE_CONFIG: RulesEngineConfig = {
  enforcement_mode: 'strict',
  evaluative_patterns: [],
  encouragement_patterns: [],
};

// ============================================================================
// RulesEngine class
// ============================================================================

/**
 * Osborn Rules Engine implementation.
 *
 * Provides three capabilities in Plan 01:
 * 1. canActivateAgent -- Critic gate (checked FIRST) + general phase rules
 * 2. getActiveRules -- phase-to-rule lookup
 * 3. generateRuleReminder -- phase-appropriate facilitator messages
 *
 * checkMessage and getViolations are stubbed (Plan 02).
 */
export class RulesEngine implements IRulesEngine {
  private readonly config: RulesEngineConfig;
  private readonly violations: RuleViolation[] = [];

  constructor(config: RulesEngineConfig) {
    this.config = config;
  }

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
   * STUB -- returns safe defaults. Full evaluative content detection
   * implemented in Plan 02.
   */
  checkMessage(
    _message: BrainstormMessage,
    _phase: SessionPhase,
  ): { allowed: boolean; violations: RuleViolation[] } {
    return { allowed: true, violations: [] };
  }

  /**
   * Get violation history for a session.
   *
   * STUB -- returns empty array. Violation logging implemented in Plan 02.
   */
  getViolations(_session_id: string): RuleViolation[] {
    return [];
  }
}
