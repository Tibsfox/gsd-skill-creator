/**
 * Figure Storming brainstorming technique implementation.
 *
 * Ask "How would [specific figure] solve this?" -- a historical inventor,
 * business leader, scientist, etc. Leverages the figure's known approach,
 * values, and methods.
 *
 * SAFETY CONSTRAINT (per spec): ALLOWED_FIGURES must be a curated allow-list
 * of constructive historical figures. Never use figures known for harmful
 * ideologies. Validates in constructor that all configured figures are in
 * the allow-list. Throws if a custom figure is not in the allow-list.
 *
 * The perspective field is populated on EVERY idea with the figure name.
 * isComplete() when all figures have been covered.
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
// Constructive figures allow-list
// ============================================================================

/**
 * Curated allow-list of constructive historical figures.
 *
 * Only figures known for positive contributions to human knowledge,
 * creativity, science, or engineering are included. Figures known for
 * harmful ideologies are explicitly excluded.
 *
 * This list is intentionally restrictive -- it is safer to reject a
 * valid figure than to permit a harmful one.
 */
export const ALLOWED_FIGURES: readonly string[] = [
  'Leonardo da Vinci',
  'Marie Curie',
  'Steve Jobs',
  'Ada Lovelace',
  'Nikola Tesla',
  'Albert Einstein',
  'Grace Hopper',
  'Richard Feynman',
  'Amelia Earhart',
] as const;

// ============================================================================
// Figure Storming technique
// ============================================================================

/**
 * Figure Storming technique instance.
 *
 * Internal state tracks current_figure_index and figures_completed.
 * Each round generates ideas from the current figure's perspective.
 * Constructor validates all figures against the allow-list.
 */
export class FigureStormingTechnique implements TechniqueInstance {
  readonly id = 'figure-storming' as const;
  readonly config: TechniqueConfig;

  private problem = '';
  private session: SessionState | null = null;
  private start_time = 0;
  private current_round = 0;
  private total_ideas = 0;

  private current_figure_index = 0;
  private figures_completed: string[] = [];

  private readonly figures: string[];
  private readonly duration_per_figure_ms: number;

  /**
   * Construct a Figure Storming technique instance.
   *
   * @param custom_figures - Optional custom figure list. Each figure
   *   MUST be in the ALLOWED_FIGURES list. Throws if any figure is not
   *   in the allow-list.
   */
  constructor(custom_figures?: string[]) {
    this.duration_per_figure_ms = 300_000;

    // Use custom figures if provided, otherwise use default set
    const requested_figures = custom_figures ?? [
      'Leonardo da Vinci',
      'Marie Curie',
      'Steve Jobs',
      'Ada Lovelace',
      'Nikola Tesla',
    ];

    // SAFETY: Validate all figures against the allow-list
    for (const figure of requested_figures) {
      if (!ALLOWED_FIGURES.includes(figure)) {
        throw new Error(
          `Figure not in constructive personas allow-list: ${figure}`,
        );
      }
    }

    this.figures = requested_figures;

    this.config = {
      id: 'figure-storming',
      name: 'Figure Storming',
      category: 'collaborative',
      description:
        'Ask "How would [historical figure] solve this?" Leverage the ' +
        "figure's known approach, values, and methods. Only constructive " +
        'historical figures are permitted.',
      default_duration_ms: 900_000,
      min_duration_ms: 300_000,
      max_duration_ms: 1_800_000,
      required_agents: ['persona', 'ideator'],
      optional_agents: ['facilitator', 'scribe'],
      valid_phases: ['diverge'],
      osborn_rules: ['quantity', 'no-criticism', 'wild-ideas'],
      parameters: {
        figures: this.figures,
        duration_per_figure_ms: this.duration_per_figure_ms,
        allowed_figures: [...ALLOWED_FIGURES],
        generation_context:
          "You are now thinking as ${figure_name}. Use this figure's known " +
          'approach, values, and methods. Generate ideas as this historical ' +
          'figure would generate them, leveraging their known worldview and expertise.',
      },
    };
  }

  initialize(problem: string, session: SessionState): void {
    this.problem = problem;
    this.session = session;
    this.start_time = Date.now();
    this.current_round = 0;
    this.total_ideas = 0;
    this.current_figure_index = 0;
    this.figures_completed = [];
  }

  /**
   * Generate a round of figure storming ideas.
   *
   * Returns Idea[] with perspective field populated with the figure name
   * on EVERY idea. Advances current_figure_index after each round.
   */
  generateRound(round_number: number): TechniqueOutput {
    this.current_round = round_number;
    const ideas: Idea[] = [];
    const now = Date.now();
    const phase = this.session?.phase ?? 'diverge';

    // Determine current figure
    const figure = this.figures[this.current_figure_index];
    if (!figure) {
      // All figures exhausted
      return {
        ideas: [],
        metadata: {
          round: round_number,
          technique: 'figure-storming',
          duration_ms: Date.now() - (this.start_time || now),
        },
      };
    }

    // Generate 3-4 ideas per figure per round
    const ideas_count = 3 + (round_number % 2);

    for (let i = 0; i < ideas_count; i++) {
      const idea: Idea = {
        id: randomUUID(),
        content: `[Figure Storming as ${figure}] How ${figure} would approach: ${this.problem}`,
        source_agent: 'ideator',
        source_technique: 'figure-storming',
        phase,
        perspective: figure,
        tags: ['figure-storming', `figure-${figure.toLowerCase().replace(/\s+/g, '-')}`],
        timestamp: now + i,
      };
      ideas.push(idea);
    }

    this.total_ideas += ideas.length;

    // Advance to next figure after this round
    if (!this.figures_completed.includes(figure)) {
      this.figures_completed.push(figure);
    }
    this.current_figure_index++;

    return {
      ideas,
      prompts: this.current_figure_index < this.figures.length
        ? [
            `Now thinking as: ${this.figures[this.current_figure_index]}. ` +
              `How would they approach: ${this.problem}?`,
          ]
        : undefined,
      metadata: {
        round: round_number,
        technique: 'figure-storming',
        duration_ms: Date.now() - (this.start_time || now),
      },
    };
  }

  getState(): Record<string, unknown> {
    return {
      current_round: this.current_round,
      total_ideas: this.total_ideas,
      current_figure_index: this.current_figure_index,
      current_figure: this.figures[this.current_figure_index] ?? null,
      figures_completed: [...this.figures_completed],
      figures_remaining: this.figures.slice(this.current_figure_index),
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
    };
  }

  /**
   * Returns true when all figures have been covered.
   */
  isComplete(): boolean {
    return this.figures_completed.length >= this.figures.length;
  }
}

/**
 * Factory function for Figure Storming technique.
 *
 * @param custom_figures - Optional custom figure list. All must be in ALLOWED_FIGURES.
 */
export function createFigureStormingTechnique(
  custom_figures?: string[],
): FigureStormingTechnique {
  return new FigureStormingTechnique(custom_figures);
}
