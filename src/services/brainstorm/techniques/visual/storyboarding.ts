/**
 * Storyboarding visual brainstorming technique.
 *
 * Sequential scenes or steps arranged as cards. Each card represents
 * a moment, event, or component in a flow. Sequence matters -- ideas
 * represent positions in a flow, not isolated concepts.
 *
 * Produces Idea[] with sequence position metadata and VisualizationData
 * of type 'sequence'.
 *
 * Only imports from ../../shared/types.js and ../engine.js.
 * No imports from den/, vtm/, knowledge/.
 */

import { randomUUID } from 'node:crypto';

import type {
  TechniqueConfig,
  TechniqueId,
  SessionState,
  Idea,
} from '../../shared/types.js';

import type { TechniqueInstance, TechniqueOutput, VisualizationData } from '../engine.js';

// ============================================================================
// Configuration
// ============================================================================

const STORYBOARDING_CONFIG: TechniqueConfig = {
  id: 'storyboarding',
  name: 'Storyboarding',
  category: 'visual',
  description: 'Sequential scenes or steps arranged as cards, each representing a moment or component in a flow.',
  default_duration_ms: 900_000,
  min_duration_ms: 300_000,
  max_duration_ms: 1_800_000,
  required_agents: ['mapper'],
  optional_agents: ['ideator'],
  valid_phases: ['diverge', 'organize'],
  osborn_rules: ['quantity', 'wild-ideas'],
  parameters: {
    max_cards: 12,
    generation_context:
      'Create sequential story cards. Each card represents a moment, event, or component in a SEQUENCE. Ideas must follow a logical temporal or causal order -- they are positions in a flow, not isolated concepts. Each idea should naturally follow from the previous one.',
  },
};

// ============================================================================
// Implementation
// ============================================================================

/**
 * Storyboarding technique instance.
 *
 * Generates sequential storyboard cards with position tags.
 * Each round produces 2-3 cards. Returns VisualizationData
 * of type 'sequence' with all cards as nodes.
 */
export class StoryboardingTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'storyboarding';
  readonly config: TechniqueConfig = STORYBOARDING_CONFIG;

  private cards: Idea[] = [];
  private sequence_position = 0;
  private problem = '';
  private start_time = 0;

  /**
   * Initialize with problem context. Resets internal counters.
   */
  initialize(problem: string, _session: SessionState): void {
    this.problem = problem;
    this.cards = [];
    this.sequence_position = 0;
    this.start_time = Date.now();
  }

  /**
   * Generate 2-3 storyboard cards per round.
   *
   * Each card Idea has tags ['storyboard-card', 'position-N']
   * and sequence_position increments for each card.
   *
   * Returns TechniqueOutput with ideas AND visualization data.
   */
  generateRound(round_number: number): TechniqueOutput {
    const max_cards = (this.config.parameters as Record<string, unknown>).max_cards as number;
    const remaining = max_cards - this.cards.length;
    const cards_this_round = Math.min(remaining, round_number === 1 ? 3 : 2);

    if (cards_this_round <= 0) {
      return {
        ideas: [],
        prompts: ['Storyboard is complete.'],
        metadata: {
          round: round_number,
          technique: this.id,
          duration_ms: Date.now() - this.start_time,
        },
      };
    }

    const new_cards: Idea[] = [];

    for (let i = 0; i < cards_this_round; i++) {
      this.sequence_position++;
      const card: Idea = {
        id: randomUUID(),
        content: `[Storyboard card ${this.sequence_position}] ${this.problem}`,
        source_agent: 'mapper',
        source_technique: 'storyboarding',
        phase: 'diverge',
        parent_id: this.cards.length > 0
          ? this.cards[this.cards.length - 1].id
          : undefined,
        tags: ['storyboard-card', `position-${this.sequence_position}`],
        timestamp: Date.now(),
      };
      new_cards.push(card);
      this.cards.push(card);
    }

    const visualization: VisualizationData = {
      type: 'sequence',
      nodes: this.cards.map(c => ({
        id: c.id,
        label: c.content,
      })),
    };

    return {
      ideas: new_cards,
      visualization,
      metadata: {
        round: round_number,
        technique: this.id,
        duration_ms: Date.now() - this.start_time,
      },
    };
  }

  /**
   * Return technique-specific internal state.
   */
  getState(): Record<string, unknown> {
    return {
      card_count: this.cards.length,
      sequence_position: this.sequence_position,
      elapsed_ms: Date.now() - this.start_time,
      max_cards: (this.config.parameters as Record<string, unknown>).max_cards,
    };
  }

  /**
   * Complete when max_cards reached OR default duration exceeded.
   */
  isComplete(): boolean {
    const max_cards = (this.config.parameters as Record<string, unknown>).max_cards as number;
    const elapsed = Date.now() - this.start_time;
    return this.cards.length >= max_cards || elapsed >= this.config.default_duration_ms;
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a fresh StoryboardingTechnique instance.
 *
 * Used by the TechniqueEngine registry for lazy instantiation.
 */
export function createStoryboardingTechnique(): TechniqueInstance {
  return new StoryboardingTechnique();
}
