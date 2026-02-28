/**
 * Brain-Netting brainstorming technique implementation.
 *
 * Asynchronous contribution to a shared idea pool with periodic prompts
 * and synthesis. Ideas can be revisited and built upon over longer
 * timeframes. Extended ideation window with no pressure to generate
 * continuously.
 *
 * Ideas have timestamps showing asynchronous spread and no specific
 * parent_id constraint.
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
// Brain-Netting technique
// ============================================================================

/**
 * Brain-Netting technique instance.
 *
 * Config: duration_ms, prompt_interval_ms.
 * Ideas are produced in asynchronous bursts with timestamps showing spread.
 * isComplete() when elapsed_ms >= duration_ms.
 */
export class BrainNettingTechnique implements TechniqueInstance {
  readonly id = 'brain-netting' as const;
  readonly config: TechniqueConfig;

  private problem = '';
  private session: SessionState | null = null;
  private start_time = 0;
  private current_round = 0;
  private total_ideas = 0;

  private readonly duration_ms: number;
  private readonly prompt_interval_ms: number;

  constructor() {
    this.duration_ms = 1_200_000;
    this.prompt_interval_ms = 300_000;

    this.config = {
      id: 'brain-netting',
      name: 'Brain-Netting',
      category: 'collaborative',
      description:
        'Asynchronous contribution to a shared idea pool. Ideas can be ' +
        'revisited and built upon over longer timeframes. No pressure to ' +
        'generate continuously -- add to the pool whenever inspiration strikes.',
      default_duration_ms: this.duration_ms,
      min_duration_ms: 600_000,
      max_duration_ms: 3_600_000,
      required_agents: ['ideator'],
      optional_agents: ['facilitator', 'scribe'],
      valid_phases: ['diverge'],
      osborn_rules: ['quantity', 'no-criticism', 'wild-ideas'],
      parameters: {
        duration_ms: this.duration_ms,
        prompt_interval_ms: this.prompt_interval_ms,
        generation_context:
          'Asynchronous contribution to a shared idea pool. Ideas can be ' +
          'revisited and built upon over longer timeframes. Add to the pool ' +
          'whenever inspiration strikes -- no pressure to generate continuously.',
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
   * Generate a round of brain-netting ideas.
   *
   * Returns Idea[] with timestamps showing asynchronous spread.
   * Uses Date.now() for timestamps. Ideas have no specific parent_id constraint.
   */
  generateRound(round_number: number): TechniqueOutput {
    this.current_round = round_number;
    const ideas: Idea[] = [];
    const now = Date.now();
    const phase = this.session?.phase ?? 'diverge';

    // Simulate asynchronous burst -- 2-5 ideas per prompt interval
    const ideas_this_round = 2 + Math.floor(round_number % 4);

    for (let i = 0; i < ideas_this_round; i++) {
      // Spread timestamps to simulate asynchronous contributions
      const timestamp_spread = Math.floor(
        (this.prompt_interval_ms / ideas_this_round) * i,
      );

      const idea: Idea = {
        id: randomUUID(),
        content: `[Brain-Netting R${round_number}] Async contribution ${i + 1} for: ${this.problem}`,
        source_agent: 'ideator',
        source_technique: 'brain-netting',
        phase,
        tags: ['brain-netting', `async-batch-${round_number}`],
        timestamp: now + timestamp_spread,
      };
      ideas.push(idea);
    }

    this.total_ideas += ideas.length;

    // Generate a periodic prompt if at the prompt interval
    const prompts: string[] = [];
    if (round_number > 1) {
      prompts.push(
        `Consider new angles on: ${this.problem}. What have we not yet explored?`,
      );
    }

    return {
      ideas,
      prompts: prompts.length > 0 ? prompts : undefined,
      metadata: {
        round: round_number,
        technique: 'brain-netting',
        duration_ms: Date.now() - (this.start_time || now),
      },
    };
  }

  getState(): Record<string, unknown> {
    const elapsed_ms = this.start_time > 0 ? Date.now() - this.start_time : 0;
    return {
      current_round: this.current_round,
      total_ideas: this.total_ideas,
      elapsed_ms,
      duration_ms: this.duration_ms,
      prompt_interval_ms: this.prompt_interval_ms,
      remaining_ms: Math.max(0, this.duration_ms - elapsed_ms),
    };
  }

  /**
   * Returns true when elapsed_ms >= duration_ms.
   */
  isComplete(): boolean {
    if (this.start_time === 0) return false;
    const elapsed_ms = Date.now() - this.start_time;
    return elapsed_ms >= this.duration_ms;
  }
}

/**
 * Factory function for Brain-Netting technique.
 */
export function createBrainNettingTechnique(): BrainNettingTechnique {
  return new BrainNettingTechnique();
}
