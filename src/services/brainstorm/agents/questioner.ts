/**
 * Questioner agent -- question-only generation with answer-to-question redirect.
 *
 * The Questioner wraps three question-focused technique instances from
 * the TechniqueEngine: question-brainstorming, starbursting, five-whys.
 *
 * Critical behavioral constraints:
 * 1. Generates questions only, never answers
 * 2. Detects answer-like content and redirects it to question form
 * 3. generateAnswer() throws unconditionally
 *
 * All generated questions are emitted to the capture loop for Scribe
 * consumption. The Questioner never generates evaluative or answer
 * content.
 *
 * Only imports from ../shared/types.js, ../techniques/engine.js,
 * ../core/rules-engine.js, and ./base.js.
 * Zero imports from den/, vtm/, knowledge/.
 */

import type {
  TechniqueId,
  SessionState,
  Question,
} from '../shared/types.js';

import type { TechniqueEngine } from '../techniques/engine.js';
import type { RulesEngine } from '../core/rules-engine.js';

import { TechniqueAgent } from './base.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * W-word prefixes that indicate a string is already in question form.
 * Case-insensitive matching applied at runtime.
 */
const QUESTION_PREFIXES = ['who', 'what', 'where', 'when', 'why', 'how'];

// ============================================================================
// Questioner agent
// ============================================================================

/**
 * Questioner agent -- pure question generation, never answers.
 *
 * Operates 3 techniques: question-brainstorming, starbursting, five-whys.
 * Emits every generated question to the capture loop. Includes
 * answer-to-question redirect for content that arrives in non-question form.
 */
export class Questioner extends TechniqueAgent {
  /** Techniques this agent is assigned to operate. */
  private static readonly ASSIGNED_TECHNIQUES: TechniqueId[] = [
    'question-brainstorming',
    'starbursting',
    'five-whys',
  ];

  constructor(engine: TechniqueEngine, rulesEngine: RulesEngine) {
    super('questioner', engine, rulesEngine);
  }

  /**
   * Return the 3 technique IDs this agent operates.
   */
  getAssignedTechniques(): TechniqueId[] {
    return [...Questioner.ASSIGNED_TECHNIQUES];
  }

  /**
   * Generate questions using the specified technique.
   *
   * Steps:
   * 1. Verify technique is in getAssignedTechniques() -- throw if not
   * 2. Load fresh TechniqueInstance via this.engine.loadTechnique()
   * 3. Call instance.initialize(problem_statement, session)
   * 4. Call instance.generateRound(round_number, previous_output)
   * 5. Extract questions from output
   * 6. Emit each question to capture loop
   * 7. Return questions
   */
  generateQuestions(
    technique_id: TechniqueId,
    session: SessionState,
    round_number: number,
    previous_output?: Question[],
  ): Question[] {
    // 1. Verify technique assignment
    if (!Questioner.ASSIGNED_TECHNIQUES.includes(technique_id)) {
      throw new Error(
        `Questioner is not assigned technique '${technique_id}'. ` +
        `Assigned techniques: ${Questioner.ASSIGNED_TECHNIQUES.join(', ')}`,
      );
    }

    // 2. Load fresh technique instance
    const instance = this.engine.loadTechnique(technique_id);

    // 3. Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // 4. Generate round output
    const output = instance.generateRound(round_number, previous_output);

    // 5. Extract questions
    const questions = output.questions ?? [];

    // 6. Emit each question to capture loop
    for (const question of questions) {
      this.emitToCapture({
        agent: 'questioner',
        content_type: 'question',
        content: question,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    // 7. Return questions
    return questions;
  }

  /**
   * Answer-to-question redirect: transforms answer-like content to question form.
   *
   * Logic:
   * 1. If input already ends with '?' -- return unchanged
   * 2. If input starts with a W-word (Who/What/Where/When/Why/How) -- append '?'
   * 3. Otherwise -- prepend "What if " and append "?"
   */
  redirectAnswerToQuestion(content: string): string {
    const trimmed = content.trim();

    // 1. Already ends with '?' -- return as-is
    if (trimmed.endsWith('?')) {
      return trimmed;
    }

    // 2. Starts with a W-word -- append '?'
    const lowerTrimmed = trimmed.toLowerCase();
    for (const prefix of QUESTION_PREFIXES) {
      if (lowerTrimmed.startsWith(prefix)) {
        // Check that the prefix is followed by a word boundary (space or end)
        const nextChar = trimmed[prefix.length];
        if (nextChar === undefined || nextChar === ' ') {
          return `${trimmed}?`;
        }
      }
    }

    // 3. Otherwise -- prepend "What if " and append "?"
    return `What if ${trimmed}?`;
  }

  /**
   * Behavioral constraint: Questioner CANNOT generate answers.
   *
   * This method exists solely to document and enforce the constraint.
   * Any attempt to call it throws unconditionally. The Questioner
   * generates questions only -- answers are redirected to question form.
   */
  generateAnswer(): never {
    throw new Error('Questioner cannot generate answers -- behavioral constraint violation');
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new Questioner agent instance.
 *
 * Factory function following the project's functional API + class wrapper
 * pattern.
 */
export function createQuestioner(engine: TechniqueEngine, rulesEngine: RulesEngine): Questioner {
  return new Questioner(engine, rulesEngine);
}
