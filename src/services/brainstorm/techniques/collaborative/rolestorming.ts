/**
 * Rolestorming brainstorming technique implementation.
 *
 * Adopt a persona (customer, competitor, child, expert) and brainstorm
 * from that perspective. Ideas must reflect the persona's mental model,
 * priorities, and constraints -- not just the user's ideas with a label.
 *
 * The perspective field is populated on EVERY idea with the active persona name.
 * isComplete() when all personas have been covered.
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
// Rolestorming technique
// ============================================================================

/**
 * Rolestorming technique instance.
 *
 * Internal state tracks current_persona_index and personas_completed.
 * Each round generates ideas from the current persona's perspective.
 */
export class RolestormingTechnique implements TechniqueInstance {
  readonly id = 'rolestorming' as const;
  readonly config: TechniqueConfig;

  private problem = '';
  private session: SessionState | null = null;
  private start_time = 0;
  private current_round = 0;
  private total_ideas = 0;

  private current_persona_index = 0;
  private personas_completed: string[] = [];

  private readonly personas: string[];
  private readonly duration_per_persona_ms: number;

  constructor() {
    this.personas = [
      'customer',
      'competitor',
      'first-time-user',
      'child',
      'domain-expert',
    ];
    this.duration_per_persona_ms = 300_000;

    this.config = {
      id: 'rolestorming',
      name: 'Rolestorming',
      category: 'collaborative',
      description:
        'Adopt a persona and brainstorm from that perspective. Each persona ' +
        'brings a distinct mental model, priorities, and constraints. Ideas ' +
        'must genuinely reflect the persona, not just carry a label.',
      default_duration_ms: 900_000,
      min_duration_ms: 300_000,
      max_duration_ms: 1_800_000,
      required_agents: ['persona', 'ideator'],
      optional_agents: ['facilitator', 'scribe'],
      valid_phases: ['diverge'],
      osborn_rules: ['quantity', 'no-criticism', 'wild-ideas'],
      parameters: {
        personas: this.personas,
        duration_per_persona_ms: this.duration_per_persona_ms,
        generation_context:
          "You are now thinking AS a ${persona}. Generate ideas that reflect " +
          "THIS PERSONA's mental model, priorities, and constraints -- not " +
          "your own default perspective. The persona's worldview should be " +
          'visible in the ideas.',
      },
    };
  }

  initialize(problem: string, session: SessionState): void {
    this.problem = problem;
    this.session = session;
    this.start_time = Date.now();
    this.current_round = 0;
    this.total_ideas = 0;
    this.current_persona_index = 0;
    this.personas_completed = [];
  }

  /**
   * Generate a round of rolestorming ideas.
   *
   * Returns Idea[] with perspective field populated with the active
   * persona name on EVERY idea. Advances current_persona_index after
   * each round.
   */
  generateRound(round_number: number): TechniqueOutput {
    this.current_round = round_number;
    const ideas: Idea[] = [];
    const now = Date.now();
    const phase = this.session?.phase ?? 'diverge';

    // Determine current persona
    const persona = this.personas[this.current_persona_index];
    if (!persona) {
      // All personas exhausted
      return {
        ideas: [],
        metadata: {
          round: round_number,
          technique: 'rolestorming',
          duration_ms: Date.now() - (this.start_time || now),
        },
      };
    }

    // Generate 3-4 ideas per persona per round
    const ideas_count = 3 + (round_number % 2);

    for (let i = 0; i < ideas_count; i++) {
      const idea: Idea = {
        id: randomUUID(),
        content: `[Rolestorming as ${persona}] Perspective idea ${i + 1} for: ${this.problem}`,
        source_agent: 'ideator',
        source_technique: 'rolestorming',
        phase,
        perspective: persona,
        tags: ['rolestorming', `persona-${persona}`],
        timestamp: now + i,
      };
      ideas.push(idea);
    }

    this.total_ideas += ideas.length;

    // Advance to next persona after this round
    if (!this.personas_completed.includes(persona)) {
      this.personas_completed.push(persona);
    }
    this.current_persona_index++;

    return {
      ideas,
      prompts: this.current_persona_index < this.personas.length
        ? [
            `Switching perspective to: ${this.personas[this.current_persona_index]}. ` +
              `How would they approach: ${this.problem}?`,
          ]
        : undefined,
      metadata: {
        round: round_number,
        technique: 'rolestorming',
        duration_ms: Date.now() - (this.start_time || now),
      },
    };
  }

  getState(): Record<string, unknown> {
    return {
      current_round: this.current_round,
      total_ideas: this.total_ideas,
      current_persona_index: this.current_persona_index,
      current_persona: this.personas[this.current_persona_index] ?? null,
      personas_completed: [...this.personas_completed],
      personas_remaining: this.personas.slice(this.current_persona_index),
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
    };
  }

  /**
   * Returns true when all personas have been covered.
   */
  isComplete(): boolean {
    return this.personas_completed.length >= this.personas.length;
  }
}

/**
 * Factory function for Rolestorming technique.
 */
export function createRolestormingTechnique(): RolestormingTechnique {
  return new RolestormingTechnique();
}
