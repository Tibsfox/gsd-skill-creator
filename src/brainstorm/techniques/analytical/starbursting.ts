/**
 * Starbursting analytical brainstorming technique.
 *
 * Six-pointed star with Who/What/Where/When/Why/How categories.
 * Generates questions under each category to comprehensively
 * explore the problem space.
 *
 * Output is Question[] (not Idea[]) with category field set on every
 * question. The generation_context encodes category-specific guidance
 * to prevent technique fidelity erosion (Pitfall 5).
 *
 * Only imports: ../../shared/types.js, ../../shared/constants.js, node:crypto.
 */

import { randomUUID } from 'node:crypto';

import type {
  Question,
  SessionPhase,
  SessionState,
  TechniqueConfig,
  TechniqueId,
} from '../../shared/types.js';

import { TECHNIQUE_DEFAULTS } from '../../shared/constants.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Output from a technique round.
 */
export interface TechniqueOutput {
  questions?: Question[];
  prompts?: string[];
  metadata: {
    round: number;
    technique: TechniqueId;
    duration_ms: number;
  };
}

/**
 * Instance contract for a running technique.
 */
export interface TechniqueInstance {
  id: TechniqueId;
  config: TechniqueConfig;
  initialize(problem: string, session: SessionState): void;
  generateRound(round_number: number): TechniqueOutput;
  getState(): Record<string, unknown>;
  isComplete(): boolean;
}

// ============================================================================
// Starbursting Technique
// ============================================================================

/**
 * The six W-categories of the star.
 */
const STAR_CATEGORIES = ['who', 'what', 'where', 'when', 'why', 'how'] as const;
type StarCategory = (typeof STAR_CATEGORIES)[number];

/**
 * Prompt guidance per star category to ensure each category produces
 * questions from the correct angle.
 */
const CATEGORY_PROMPTS: Record<StarCategory, string> = {
  who: 'Who is affected? Who are the stakeholders? Who will use this? Who decides?',
  what: 'What is the core problem? What are the constraints? What assumptions are we making?',
  where: 'Where does this happen? Where are the boundaries? Where are the dependencies?',
  when: 'When does this matter? When are the deadlines? When does the problem manifest?',
  why: 'Why does this problem exist? Why does it matter? Why haven\'t existing solutions worked?',
  how: 'How will this work? How will we measure success? How will users interact with it?',
};

/**
 * Starbursting technique implementation.
 *
 * Cycles through all 6 W-categories of the star, generating questions
 * under each category. Each round produces 3-5 questions. The category
 * advances after duration_per_category_ms has elapsed.
 */
export class StarburstingTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'starbursting';
  readonly config: TechniqueConfig;

  // Internal state
  private current_category_index = 0;
  private category_question_counts: Map<string, number> = new Map();
  private total_elapsed_ms = 0;
  private problem = '';
  private start_time = 0;
  private round_count = 0;

  constructor() {
    const defaults = TECHNIQUE_DEFAULTS['starbursting'];

    const generation_context =
      'Generate QUESTIONS ONLY under the "${category}" category of the 6-point star. ' +
      'No answers. One question should naturally lead to another. ' +
      'Goal: comprehensive exploration of the problem space from this angle.';

    this.config = {
      id: 'starbursting',
      name: 'Starbursting',
      category: 'analytical',
      description:
        'Six-pointed star exploration using Who/What/Where/When/Why/How categories. ' +
        'Generates comprehensive questions to map the problem space before seeking solutions.',
      default_duration_ms: 900_000,
      min_duration_ms: 360_000,
      max_duration_ms: 1_800_000,
      required_agents: defaults.agents,
      optional_agents: ['analyst'],
      valid_phases: ['explore', 'diverge'],
      osborn_rules: ['quantity', 'no-criticism'],
      parameters: {
        categories: [...STAR_CATEGORIES],
        duration_per_category_ms: 150_000,
        generation_context,
      },
    };

    // Initialize category counters
    for (const cat of STAR_CATEGORIES) {
      this.category_question_counts.set(cat, 0);
    }
  }

  /**
   * Initialize with problem context and session state.
   */
  initialize(problem: string, _session: SessionState): void {
    this.problem = problem;
    this.start_time = Date.now();
    this.current_category_index = 0;
    this.round_count = 0;
    this.total_elapsed_ms = 0;

    for (const cat of STAR_CATEGORIES) {
      this.category_question_counts.set(cat, 0);
    }
  }

  /**
   * Generate a round of questions under the current star category.
   *
   * Each question has its category field set. The category advances
   * after duration_per_category_ms has elapsed on that category.
   */
  generateRound(round_number: number): TechniqueOutput {
    const duration_per_category_ms = this.config.parameters.duration_per_category_ms as number;
    const round_start = Date.now();

    // Check if we should advance category
    const simulated_elapsed_per_category = this.round_count > 0
      ? (this.total_elapsed_ms / STAR_CATEGORIES.length)
      : 0;

    if (
      simulated_elapsed_per_category >= duration_per_category_ms &&
      this.current_category_index < STAR_CATEGORIES.length - 1
    ) {
      this.current_category_index++;
    }

    const active_category = STAR_CATEGORIES[
      this.current_category_index % STAR_CATEGORIES.length
    ];
    const category_prompt = CATEGORY_PROMPTS[active_category];

    // Build resolved generation context
    const resolved_context = (this.config.parameters.generation_context as string)
      .replace(/\$\{category\}/g, active_category);

    // Generate 3-5 questions under the current category
    const question_count = 3 + Math.floor(round_number % 3); // 3-5
    const questions: Question[] = [];

    for (let i = 0; i < question_count; i++) {
      const question: Question = {
        id: randomUUID(),
        content: `[${active_category}] ${category_prompt.split('?')[i % category_prompt.split('?').length]?.trim() ?? active_category} — regarding: ${this.problem}?`,
        category: active_category,
        source_technique: 'starbursting',
        timestamp: Date.now(),
      };
      questions.push(question);
    }

    // Update category question counts
    const prev_count = this.category_question_counts.get(active_category) ?? 0;
    this.category_question_counts.set(active_category, prev_count + questions.length);

    // Simulate time passage — each round covers ~1/3 of a category's time budget
    const simulated_elapsed = duration_per_category_ms / 3;
    this.total_elapsed_ms += simulated_elapsed;
    this.round_count = round_number;

    // Advance category if time for current category is exhausted
    const rounds_per_category = Math.ceil(duration_per_category_ms / simulated_elapsed);
    const category_rounds = this.getCategoryRoundCount(active_category);
    if (category_rounds >= rounds_per_category && this.current_category_index < STAR_CATEGORIES.length - 1) {
      this.current_category_index++;
    }

    return {
      questions,
      prompts: [resolved_context],
      metadata: {
        round: round_number,
        technique: 'starbursting',
        duration_ms: Date.now() - round_start,
      },
    };
  }

  /**
   * Return current technique state.
   */
  getState(): Record<string, unknown> {
    const active_category = STAR_CATEGORIES[
      this.current_category_index % STAR_CATEGORIES.length
    ];
    const categories_covered: string[] = [];

    for (const [cat, count] of this.category_question_counts.entries()) {
      if (count > 0) {
        categories_covered.push(cat);
      }
    }

    let total_questions = 0;
    for (const count of this.category_question_counts.values()) {
      total_questions += count;
    }

    return {
      current_category: active_category,
      categories_covered,
      total_questions,
      current_category_index: this.current_category_index,
    };
  }

  /**
   * Check if the technique has naturally completed.
   *
   * Complete when all 6 categories have been covered OR total elapsed
   * time exceeds the default duration.
   */
  isComplete(): boolean {
    return (
      this.current_category_index >= STAR_CATEGORIES.length ||
      this.total_elapsed_ms >= this.config.default_duration_ms
    );
  }

  /**
   * Count how many rounds have been spent on a given category.
   */
  private getCategoryRoundCount(category: string): number {
    return this.category_question_counts.get(category) ?? 0;
  }
}

/**
 * Factory function for creating a Starbursting technique instance.
 */
export function createStarburstingTechnique(): TechniqueInstance {
  return new StarburstingTechnique();
}
