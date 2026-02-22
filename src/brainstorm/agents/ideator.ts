/**
 * Ideator agent -- generation-only across 5 techniques, never evaluates.
 *
 * The Ideator wraps five generation-focused technique instances from
 * the TechniqueEngine: freewriting, rapid-ideation, brainwriting-635,
 * round-robin, and brain-netting.
 *
 * Critical behavioral constraint: The Ideator NEVER evaluates, filters,
 * scores, ranks, or otherwise judges its own output. The evaluateIdea()
 * method exists solely to document and enforce this constraint --
 * it throws unconditionally.
 *
 * All generated ideas are emitted to the capture loop for Scribe
 * consumption. The Ideator never modifies or removes ideas after
 * generation.
 *
 * Only imports from ../shared/types.js, ../techniques/engine.js,
 * ../core/rules-engine.js, and ./base.js.
 * Zero imports from den/, vtm/, knowledge/.
 */

import type {
  TechniqueId,
  SessionState,
  Idea,
} from '../shared/types.js';

import type { TechniqueEngine } from '../techniques/engine.js';
import type { RulesEngine } from '../core/rules-engine.js';

import { TechniqueAgent } from './base.js';

// ============================================================================
// Ideator agent
// ============================================================================

/**
 * Ideator agent -- pure idea generation, never evaluation.
 *
 * Operates 5 techniques: freewriting, rapid-ideation, brainwriting-635,
 * round-robin, brain-netting. Emits every generated idea to the
 * capture loop without filtering.
 */
export class Ideator extends TechniqueAgent {
  /** Techniques this agent is assigned to operate. */
  private static readonly ASSIGNED_TECHNIQUES: TechniqueId[] = [
    'freewriting',
    'rapid-ideation',
    'brainwriting-635',
    'round-robin',
    'brain-netting',
  ];

  constructor(engine: TechniqueEngine, rulesEngine: RulesEngine) {
    super('ideator', engine, rulesEngine);
  }

  /**
   * Return the 5 technique IDs this agent operates.
   */
  getAssignedTechniques(): TechniqueId[] {
    return [...Ideator.ASSIGNED_TECHNIQUES];
  }

  /**
   * Generate ideas using the specified technique.
   *
   * Steps:
   * 1. Verify technique is in getAssignedTechniques() -- throw if not
   * 2. Load fresh TechniqueInstance via this.engine.loadTechnique()
   * 3. Call instance.initialize(problem_statement, session)
   * 4. Call instance.generateRound(round_number, previous_output)
   * 5. Emit each idea to capture loop
   * 6. Return ideas -- NEVER filter or evaluate them
   */
  generateIdeas(
    technique_id: TechniqueId,
    session: SessionState,
    round_number: number,
    previous_output?: Idea[],
  ): Idea[] {
    // 1. Verify technique assignment
    if (!Ideator.ASSIGNED_TECHNIQUES.includes(technique_id)) {
      throw new Error(
        `Ideator is not assigned technique '${technique_id}'. ` +
        `Assigned techniques: ${Ideator.ASSIGNED_TECHNIQUES.join(', ')}`,
      );
    }

    // 2. Load fresh technique instance
    const instance = this.engine.loadTechnique(technique_id);

    // 3. Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // 4. Generate round output
    const output = instance.generateRound(round_number, previous_output);

    // 5. Extract ideas and emit to capture loop
    const ideas = output.ideas ?? [];
    for (const idea of ideas) {
      this.emitToCapture({
        agent: 'ideator',
        content_type: 'idea',
        content: idea,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    // 6. Return ideas -- no filtering, no evaluation
    return ideas;
  }

  /**
   * Behavioral constraint: Ideator CANNOT evaluate its output.
   *
   * This method exists solely to document and enforce the constraint.
   * Any attempt to call it throws unconditionally. The Ideator has
   * no method that filters, scores, ranks, or otherwise evaluates ideas.
   */
  evaluateIdea(): never {
    throw new Error('Ideator cannot evaluate output -- behavioral constraint violation');
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new Ideator agent instance.
 *
 * Factory function following the project's functional API + class wrapper
 * pattern.
 */
export function createIdeator(engine: TechniqueEngine, rulesEngine: RulesEngine): Ideator {
  return new Ideator(engine, rulesEngine);
}
