/**
 * Question Brainstorming technique implementation.
 *
 * Mechanic: Generate QUESTIONS ONLY. Never answers. Build comprehensive
 * understanding of the problem space. If an answer emerges, reframe it
 * as a deeper question. Cover all W-categories: who, what, where, when,
 * why, how.
 *
 * Completion: question_count >= min_questions (default 15).
 *
 * Output: Question[] (NOT Idea[]). Each question has a W-category,
 * source_technique, timestamp, and UUID id.
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

const QUESTION_BRAINSTORMING_CONFIG: TechniqueConfig = {
  id: 'question-brainstorming',
  name: 'Question Brainstorming',
  category: 'individual',
  description: 'Generate questions about the problem, never answers. Build comprehensive understanding of the problem space by exploring all dimensions through systematic questioning.',
  default_duration_ms: 600_000,
  min_duration_ms: 180_000,
  max_duration_ms: 1_800_000,
  required_agents: ['questioner'],
  optional_agents: ['scribe'],
  valid_phases: ['explore', 'diverge'],
  osborn_rules: ['quantity', 'no-criticism'],
  parameters: {
    min_questions: 15,
    generation_context: 'Generate QUESTIONS ONLY. Never answers. Build comprehensive understanding of the problem space. If an answer emerges, reframe it as a deeper question. Cover all W-categories: who, what, where, when, why, how.',
  },
};

// ============================================================================
// Constants
// ============================================================================

/**
 * W-categories for question generation.
 * Cycled through to ensure comprehensive coverage.
 */
const QUESTION_CATEGORIES = ['who', 'what', 'where', 'when', 'why', 'how'] as const;
type QuestionCategory = typeof QUESTION_CATEGORIES[number];

// ============================================================================
// Implementation
// ============================================================================

/**
 * Question Brainstorming technique instance.
 *
 * Generates questions across all W-categories (who, what, where, when,
 * why, how). Cycles through categories to ensure comprehensive coverage.
 * Produces Question[] only -- never Idea[].
 */
class QuestionBrainstormingTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'question-brainstorming';
  readonly config: TechniqueConfig = QUESTION_BRAINSTORMING_CONFIG;

  private problem: string = '';
  private start_time: number = 0;
  private question_count: number = 0;
  private round_number: number = 0;
  private category_index: number = 0;

  /**
   * Initialize with problem context and session state.
   * Resets all internal counters.
   */
  initialize(problem: string, _session: SessionState): void {
    this.problem = problem;
    this.start_time = Date.now();
    this.question_count = 0;
    this.round_number = 0;
    this.category_index = 0;
  }

  /**
   * Generate a round of questions.
   *
   * Produces 3-5 questions per round, cycling through W-categories.
   * Each question has a category, source_technique, timestamp, and UUID.
   * Returns Question[] only -- no Idea[].
   */
  generateRound(round_number: number, _previous_output?: Idea[] | Question[]): TechniqueOutput {
    const round_start = Date.now();
    this.round_number = round_number;

    const questions_this_round = 3 + (round_number % 3); // 3-5 questions per round
    const questions: Question[] = [];

    for (let i = 0; i < questions_this_round; i++) {
      const category = QUESTION_CATEGORIES[this.category_index % QUESTION_CATEGORIES.length];
      this.category_index++;

      const question: Question = {
        id: randomUUID(),
        content: `[${category.toUpperCase()}] Question ${this.question_count + 1} about: ${this.problem}?`,
        category,
        source_technique: 'question-brainstorming',
        timestamp: Date.now(),
      };
      questions.push(question);
      this.question_count++;
    }

    const round_duration = Date.now() - round_start;

    return {
      questions,
      metadata: {
        round: round_number,
        technique: 'question-brainstorming',
        duration_ms: round_duration,
      },
    };
  }

  /**
   * Return technique-specific internal state.
   */
  getState(): Record<string, unknown> {
    return {
      question_count: this.question_count,
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
      round_number: this.round_number,
      category_coverage: this.getCategoryCoverage(),
    };
  }

  /**
   * Check if question brainstorming is complete.
   *
   * Complete when question_count >= min_questions.
   */
  isComplete(): boolean {
    if (this.start_time === 0) return false;
    const min_questions = this.config.parameters.min_questions as number;
    return this.question_count >= min_questions;
  }

  /**
   * Get category coverage statistics.
   * Returns the number of questions generated per category.
   */
  private getCategoryCoverage(): Record<string, number> {
    const coverage: Record<string, number> = {};
    for (const cat of QUESTION_CATEGORIES) {
      // Approximate: categories are cycled sequentially
      const full_cycles = Math.floor(this.question_count / QUESTION_CATEGORIES.length);
      const remaining = this.question_count % QUESTION_CATEGORIES.length;
      const cat_idx = QUESTION_CATEGORIES.indexOf(cat);
      coverage[cat] = full_cycles + (cat_idx < remaining ? 1 : 0);
    }
    return coverage;
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new QuestionBrainstormingTechnique instance.
 * Registered with the TechniqueEngine in its constructor.
 */
export function createQuestionBrainstormingTechnique(): TechniqueInstance {
  return new QuestionBrainstormingTechnique();
}

export { QuestionBrainstormingTechnique };
