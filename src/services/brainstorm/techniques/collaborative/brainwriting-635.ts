/**
 * Brainwriting 6-3-5 technique implementation.
 *
 * The most complex collaborative technique. Key mechanic: progressive
 * building -- each round BUILDS on the previous round's ideas. 6 rounds,
 * 3 ideas per round per participant, 5 minutes per round. In the AI-assisted
 * version, simulated participants each see the previous round's output and
 * contribute ideas that explicitly build on what came before.
 *
 * Round 1: Generate ideas with NO parent_id (nothing to build on yet).
 * Rounds 2-6: Each idea has parent_id referencing an idea from the PREVIOUS round.
 *
 * Maximum potential: rounds * ideas_per_round * simulated_participants ideas.
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
// Brainwriting 6-3-5 technique
// ============================================================================

/**
 * Brainwriting 6-3-5 technique instance.
 *
 * Internal state:
 * - rounds: Map<number, Idea[]> -- round_number to ideas from that round
 * - current_round: number (starts at 1)
 * - total_ideas: number
 */
export class Brainwriting635Technique implements TechniqueInstance {
  readonly id = 'brainwriting-635' as const;
  readonly config: TechniqueConfig;

  private problem = '';
  private session: SessionState | null = null;
  private start_time = 0;
  private rounds: Map<number, Idea[]> = new Map();
  private current_round = 0;
  private total_ideas = 0;

  private readonly rounds_total: number;
  private readonly ideas_per_round: number;
  private readonly round_duration_ms: number;
  private readonly simulated_participants: number;

  constructor() {
    this.rounds_total = 6;
    this.ideas_per_round = 3;
    this.round_duration_ms = 300_000;
    this.simulated_participants = 4;

    this.config = {
      id: 'brainwriting-635',
      name: 'Brainwriting 6-3-5',
      category: 'collaborative',
      description:
        '6 rounds of progressive idea building. Each round, participants generate 3 ideas that build on the previous round. AI-simulated participants ensure diverse perspectives.',
      default_duration_ms: 1_800_000,
      min_duration_ms: 900_000,
      max_duration_ms: 3_600_000,
      required_agents: ['ideator'],
      optional_agents: ['facilitator', 'scribe'],
      valid_phases: ['diverge'],
      osborn_rules: ['quantity', 'no-criticism', 'wild-ideas', 'build-combine'],
      parameters: {
        rounds: this.rounds_total,
        ideas_per_round: this.ideas_per_round,
        round_duration_ms: this.round_duration_ms,
        simulated_participants: this.simulated_participants,
        generation_context:
          'You are participant ${participant_number} of 4. Round ${round}. ' +
          'Previous participants wrote: [${previous_round_summaries}]. ' +
          'Generate 3 new ideas that EXPLICITLY BUILD ON what previous participants wrote. ' +
          'Each idea must reference or extend a previous idea (set parent_id to the idea ' +
          'you are building on). Ideas should be progressively more developed than Round 1.',
      },
    };
  }

  initialize(problem: string, session: SessionState): void {
    this.problem = problem;
    this.session = session;
    this.start_time = Date.now();
    this.rounds = new Map();
    this.current_round = 0;
    this.total_ideas = 0;
  }

  /**
   * Generate a round of brainwriting ideas.
   *
   * Round 1: Generate ideas_per_round * simulated_participants ideas (12 total)
   * with NO parent_id.
   *
   * Rounds 2-6: For each idea, set parent_id to an idea from the PREVIOUS round.
   * Distribute: participant 1 builds on idea[0], participant 2 builds on idea[1],
   * cycling if needed.
   */
  generateRound(
    round_number: number,
    previous_output?: Idea[],
  ): TechniqueOutput {
    this.current_round = round_number;
    const ideas: Idea[] = [];
    const now = Date.now();
    const phase = this.session?.phase ?? 'diverge';

    const total_ideas_this_round =
      this.ideas_per_round * this.simulated_participants;

    // Get previous round ideas for parent_id assignment
    const prev_round_ideas = round_number > 1
      ? (previous_output ?? this.rounds.get(round_number - 1) ?? [])
      : [];

    for (let i = 0; i < total_ideas_this_round; i++) {
      const participant_number = (i % this.simulated_participants) + 1;
      const idea_in_round = Math.floor(i / this.simulated_participants) + 1;

      // Round 1: no parent_id. Rounds 2+: parent_id from previous round
      let parent_id: string | undefined;
      if (round_number > 1 && prev_round_ideas.length > 0) {
        // Cycle through previous round ideas for distribution
        const parent_index = i % prev_round_ideas.length;
        parent_id = prev_round_ideas[parent_index].id;
      }

      const idea: Idea = {
        id: randomUUID(),
        content:
          round_number === 1
            ? `[Brainwriting R${round_number} P${participant_number}] Initial idea ${idea_in_round} for: ${this.problem}`
            : `[Brainwriting R${round_number} P${participant_number}] Building on previous round - developed idea ${idea_in_round}`,
        source_agent: 'ideator',
        source_technique: 'brainwriting-635',
        phase,
        parent_id,
        tags: [
          `brainwriting-round-${round_number}`,
          `participant-${participant_number}`,
        ],
        timestamp: now + i,
      };

      ideas.push(idea);
    }

    // Store the round result
    this.rounds.set(round_number, ideas);
    this.total_ideas += ideas.length;

    return {
      ideas,
      metadata: {
        round: round_number,
        technique: 'brainwriting-635',
        duration_ms: Date.now() - (this.start_time || now),
      },
    };
  }

  getState(): Record<string, unknown> {
    return {
      current_round: this.current_round,
      total_rounds: this.rounds_total,
      total_ideas: this.total_ideas,
      ideas_per_round: this.ideas_per_round,
      simulated_participants: this.simulated_participants,
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
      rounds_completed: this.rounds.size,
    };
  }

  /**
   * Returns true when current_round >= rounds (6 completed).
   */
  isComplete(): boolean {
    return this.current_round >= this.rounds_total;
  }
}

/**
 * Factory function for Brainwriting 6-3-5 technique.
 */
export function createBrainwriting635Technique(): Brainwriting635Technique {
  return new Brainwriting635Technique();
}
