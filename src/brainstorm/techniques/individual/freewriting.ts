/**
 * Freewriting technique implementation.
 *
 * Mechanic: Continuous stream of consciousness -- no editing, no censoring,
 * no stopping. Each idea flows associatively from the previous. Ideas can
 * be rough, incomplete, tangential. The engine does NOT filter for quality.
 *
 * Completion: Stream target met (elapsed time * min_ideas_per_minute)
 * OR elapsed_ms >= default_duration_ms.
 *
 * Output: Idea[] with parent_id chains forming an associative stream.
 * Each idea is SHORT (1 sentence max).
 *
 * Only imports from ../../shared/types.js. No imports from den/, vtm/, knowledge/.
 */

import { randomUUID } from 'node:crypto';
import type {
  TechniqueId,
  TechniqueConfig,
  SessionState,
  Idea,
  Question,
} from '../../shared/types.js';
import type { TechniqueInstance, TechniqueOutput } from '../engine.js';

// ============================================================================
// Configuration
// ============================================================================

const FREEWRITING_CONFIG: TechniqueConfig = {
  id: 'freewriting',
  name: 'Freewriting',
  category: 'individual',
  description: 'Continuous stream of consciousness idea generation without editing or censoring. Ideas flow associatively, building on each other in rapid succession.',
  default_duration_ms: 600_000,
  min_duration_ms: 120_000,
  max_duration_ms: 1_800_000,
  required_agents: ['ideator'],
  optional_agents: ['scribe'],
  valid_phases: ['diverge'],
  osborn_rules: ['quantity', 'no-criticism', 'wild-ideas'],
  parameters: {
    min_ideas_per_minute: 3,
    generation_context: 'Continuous stream of consciousness -- no editing, no censoring, no stopping. Each idea flows associatively from the previous. Ideas can be rough, incomplete, tangential. DO NOT filter for quality.',
  },
};

// ============================================================================
// Implementation
// ============================================================================

/**
 * Freewriting technique instance.
 *
 * Tracks an associative chain of ideas where each idea's parent_id
 * points to the previous idea, simulating stream-of-consciousness flow.
 */
class FreewritingTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'freewriting';
  readonly config: TechniqueConfig = FREEWRITING_CONFIG;

  private problem: string = '';
  private start_time: number = 0;
  private idea_count: number = 0;
  private round_number: number = 0;
  private last_idea_id: string | undefined = undefined;

  /**
   * Initialize with problem context and session state.
   * Resets all internal counters.
   */
  initialize(problem: string, _session: SessionState): void {
    this.problem = problem;
    this.start_time = Date.now();
    this.idea_count = 0;
    this.round_number = 0;
    this.last_idea_id = undefined;
  }

  /**
   * Generate a round of freewriting ideas.
   *
   * Produces 3-5 ideas per round. Each idea is SHORT (1 sentence max).
   * parent_id chains form an associative stream (each idea references
   * the previous idea). Content uses generation_context signals to guide
   * what the implementing LLM/agent will produce.
   */
  generateRound(round_number: number, _previous_output?: Idea[] | Question[]): TechniqueOutput {
    const round_start = Date.now();
    this.round_number = round_number;

    const ideas_this_round = 3 + (round_number % 3); // 3-5 ideas per round
    const ideas: Idea[] = [];

    for (let i = 0; i < ideas_this_round; i++) {
      const idea_id = randomUUID();
      const idea: Idea = {
        id: idea_id,
        content: `[Freewriting stream ${this.idea_count + 1}] Associative idea about: ${this.problem}`,
        source_agent: 'ideator',
        source_technique: 'freewriting',
        phase: 'diverge',
        parent_id: this.last_idea_id,
        tags: [],
        timestamp: Date.now(),
      };
      ideas.push(idea);
      this.last_idea_id = idea_id;
      this.idea_count++;
    }

    const round_duration = Date.now() - round_start;

    return {
      ideas,
      metadata: {
        round: round_number,
        technique: 'freewriting',
        duration_ms: round_duration,
      },
    };
  }

  /**
   * Return technique-specific internal state.
   */
  getState(): Record<string, unknown> {
    return {
      idea_count: this.idea_count,
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
      round_number: this.round_number,
      last_idea_id: this.last_idea_id,
    };
  }

  /**
   * Check if freewriting is complete.
   *
   * Complete when stream target met (ideas >= elapsed_minutes * min_ideas_per_minute)
   * OR elapsed_ms >= default_duration_ms.
   */
  isComplete(): boolean {
    if (this.start_time === 0) return false;

    const elapsed_ms = Date.now() - this.start_time;
    const min_ideas_per_minute = this.config.parameters.min_ideas_per_minute as number;

    // Time-based completion
    if (elapsed_ms >= this.config.default_duration_ms) return true;

    // Stream target completion: enough ideas for elapsed time
    const elapsed_minutes = elapsed_ms / 60_000;
    const target_ideas = elapsed_minutes * min_ideas_per_minute;
    if (this.idea_count >= target_ideas && this.idea_count > 0) return true;

    return false;
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new FreewritingTechnique instance.
 * Registered with the TechniqueEngine in its constructor.
 */
export function createFreewritingTechnique(): TechniqueInstance {
  return new FreewritingTechnique();
}

export { FreewritingTechnique };
