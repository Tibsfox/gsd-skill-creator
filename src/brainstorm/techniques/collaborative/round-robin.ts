/**
 * Round Robin brainstorming technique implementation.
 *
 * Participants take turns contributing one idea each in rotation until
 * ideas are exhausted or time expires. Balanced participation -- no
 * agent dominates. Natural rhythm builds momentum.
 *
 * Each round produces simulated_agents ideas (one per simulated turn).
 * Each idea has source_agent: 'ideator' and tags including the round number.
 *
 * Only imports from ../../shared/types.js and the engine interface.
 * No imports from den/, vtm/, knowledge/.
 */

import { randomUUID } from 'node:crypto';
import type {
  Idea,
  SessionState,
  TechniqueConfig,
} from '../../shared/types.js';
import type { TechniqueInstance, TechniqueOutput } from '../engine.js';

// ============================================================================
// Round Robin technique
// ============================================================================

/**
 * Round Robin technique instance.
 *
 * Config: max_rounds, ideas_per_turn, round_timeout_ms, simulated_agents.
 * Each round produces one idea per simulated agent.
 */
export class RoundRobinTechnique implements TechniqueInstance {
  readonly id = 'round-robin' as const;
  readonly config: TechniqueConfig;

  private problem = '';
  private session: SessionState | null = null;
  private start_time = 0;
  private current_round = 0;
  private total_ideas = 0;

  private readonly max_rounds: number;
  private readonly ideas_per_turn: number;
  private readonly round_timeout_ms: number;
  private readonly simulated_agents: number;

  constructor() {
    this.max_rounds = 10;
    this.ideas_per_turn = 1;
    this.round_timeout_ms = 120_000;
    this.simulated_agents = 4;

    this.config = {
      id: 'round-robin',
      name: 'Round Robin',
      category: 'collaborative',
      description:
        'Participants take turns contributing one idea each in rotation. ' +
        'Balanced participation ensures no single voice dominates. ' +
        'Natural rhythm builds creative momentum.',
      default_duration_ms: 900_000,
      min_duration_ms: 300_000,
      max_duration_ms: 1_800_000,
      required_agents: ['ideator'],
      optional_agents: ['facilitator', 'scribe'],
      valid_phases: ['diverge'],
      osborn_rules: ['quantity', 'no-criticism', 'wild-ideas'],
      parameters: {
        max_rounds: this.max_rounds,
        ideas_per_turn: this.ideas_per_turn,
        round_timeout_ms: this.round_timeout_ms,
        simulated_agents: this.simulated_agents,
        generation_context:
          'Round robin turn. Each participant contributes exactly 1 idea per turn. ' +
          'No agent dominates. Natural rhythm builds momentum. ' +
          'Your turn: add one idea building on the session so far.',
      },
    };
  }

  initialize(problem: string, session: SessionState): void {
    this.problem = problem;
    this.session = session;
    this.start_time = Date.now();
    this.current_round = 0;
    this.total_ideas = 0;
  }

  /**
   * Generate a round of round-robin ideas.
   *
   * Returns simulated_agents ideas (one per simulated turn), each with
   * source_agent: 'ideator' and tagged with the round number.
   */
  generateRound(round_number: number): TechniqueOutput {
    this.current_round = round_number;
    const ideas: Idea[] = [];
    const now = Date.now();
    const phase = this.session?.phase ?? 'diverge';

    for (let agent = 0; agent < this.simulated_agents; agent++) {
      for (let turn = 0; turn < this.ideas_per_turn; turn++) {
        const idea: Idea = {
          id: randomUUID(),
          content: `[Round Robin R${round_number} Agent${agent + 1}] Idea for: ${this.problem}`,
          source_agent: 'ideator',
          source_technique: 'round-robin',
          phase,
          tags: [`round-robin-turn-${round_number}`, `agent-${agent + 1}`],
          timestamp: now + agent * this.ideas_per_turn + turn,
        };
        ideas.push(idea);
      }
    }

    this.total_ideas += ideas.length;

    return {
      ideas,
      metadata: {
        round: round_number,
        technique: 'round-robin',
        duration_ms: Date.now() - (this.start_time || now),
      },
    };
  }

  getState(): Record<string, unknown> {
    return {
      current_round: this.current_round,
      max_rounds: this.max_rounds,
      total_ideas: this.total_ideas,
      simulated_agents: this.simulated_agents,
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
    };
  }

  /**
   * Returns true when current_round >= max_rounds.
   */
  isComplete(): boolean {
    return this.current_round >= this.max_rounds;
  }
}

/**
 * Factory function for Round Robin technique.
 */
export function createRoundRobinTechnique(): RoundRobinTechnique {
  return new RoundRobinTechnique();
}
