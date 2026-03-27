/**
 * Persona agent -- rolestorming/figure-storming with constructive-only personas.
 *
 * The Persona wraps two collaborative technique instances from the
 * TechniqueEngine: rolestorming and figure-storming.
 *
 * Critical behavioral constraints:
 * 1. Only 9 approved constructive historical figures are allowed (ALLOWED_FIGURES)
 * 2. Custom role perspectives must be constructive -- blocked hostile/demeaning terms
 * 3. All generated ideas MUST carry a non-null perspective field (perspective fidelity)
 *
 * Perspective fidelity: In v1.32 the technique engine produces placeholder content.
 * The perspective field on each Idea is the mechanism by which perspective identity
 * is preserved. When Phase 311 wires actual LLM calls, the perspective field will
 * guide generation. For now, ensuring ALL ideas from Persona have a non-null
 * perspective field is the measurable fidelity check.
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
// Constants
// ============================================================================

/**
 * The 9 allowed constructive historical figures for figure-storming.
 *
 * Only constructive personas -- no hostile, demeaning, or triggering figures.
 * Deduplicated from the plan's 10-entry list per STATE.md decision log.
 */
export const ALLOWED_FIGURES = [
  'Leonardo da Vinci',
  'Marie Curie',
  'Albert Einstein',
  'Ada Lovelace',
  'Benjamin Franklin',
  'Nikola Tesla',
  'Steve Jobs',
  'Elon Musk',
  'Archimedes',
] as const;

export type AllowedFigure = typeof ALLOWED_FIGURES[number];

/**
 * Blocked terms for custom role perspectives.
 *
 * These terms indicate hostile, demeaning, or non-constructive personas.
 * Case-insensitive substring matching applied at runtime.
 */
const BLOCKED_PERSPECTIVE_TERMS = [
  'enemy',
  'villain',
  'hostile',
  'hater',
  'troll',
  'abusive',
];

// ============================================================================
// Persona agent
// ============================================================================

/**
 * Persona agent -- perspective-faithful idea generation via rolestorming
 * and figure-storming with constructive-only personas.
 *
 * Operates 2 techniques: rolestorming, figure-storming.
 * Validates figures against ALLOWED_FIGURES, blocks hostile custom
 * perspectives, and ensures all generated ideas carry a non-null
 * perspective field.
 */
export class Persona extends TechniqueAgent {
  /** Techniques this agent is assigned to operate. */
  private static readonly ASSIGNED_TECHNIQUES: TechniqueId[] = [
    'rolestorming',
    'figure-storming',
  ];

  /** Active historical figure persona (figure-storming). */
  private activeFigure: AllowedFigure | null = null;

  /** Active custom role perspective (rolestorming). */
  private activeCustomPerspective: string | null = null;

  constructor(engine: TechniqueEngine, rulesEngine: RulesEngine) {
    super('persona', engine, rulesEngine);
  }

  /**
   * Return the 2 technique IDs this agent operates.
   */
  getAssignedTechniques(): TechniqueId[] {
    return [...Persona.ASSIGNED_TECHNIQUES];
  }

  /**
   * Activate a historical figure persona for figure-storming.
   *
   * Validates the figure is in ALLOWED_FIGURES. Throws if not found.
   * Clears any active custom perspective (mutual exclusion).
   */
  activateFigure(figure: AllowedFigure): void {
    if (!(ALLOWED_FIGURES as readonly string[]).includes(figure)) {
      throw new Error(
        `Figure '${figure}' is not in ALLOWED_FIGURES. ` +
        `Allowed: ${ALLOWED_FIGURES.join(', ')}`,
      );
    }
    this.activeFigure = figure;
    this.activeCustomPerspective = null;
  }

  /**
   * Activate a custom role perspective for rolestorming.
   *
   * Custom perspectives must be constructive: customer, expert, child,
   * investor, etc. Blocked terms (enemy, villain, hostile, hater, troll,
   * abusive) cause a throw.
   *
   * Clears any active figure persona (mutual exclusion).
   */
  activateRolePerspective(perspective: string): void {
    const lower = perspective.toLowerCase();
    for (const term of BLOCKED_PERSPECTIVE_TERMS) {
      if (lower.includes(term)) {
        throw new Error(
          `Persona perspective '${perspective}' is not constructive -- blocked term: '${term}'`,
        );
      }
    }
    this.activeCustomPerspective = perspective;
    this.activeFigure = null;
  }

  /**
   * Generate ideas from the active persona's perspective.
   *
   * Steps:
   * 1. Verify either activeFigure or activeCustomPerspective is set -- throw if neither
   * 2. Determine technique: if activeFigure set -> 'figure-storming', else 'rolestorming'
   * 3. Load fresh TechniqueInstance via this.engine.loadTechnique()
   * 4. Initialize with problem statement + perspective context
   * 5. Call instance.generateRound(round_number)
   * 6. For each returned idea, set idea.perspective = activeFigure ?? activeCustomPerspective
   *    (perspective fidelity: the perspective field MUST be populated)
   * 7. Emit each idea to capture loop
   * 8. Return ideas
   */
  generatePersonaIdeas(session: SessionState, round_number: number): Idea[] {
    // 1. Verify active persona
    const currentPersona = this.getCurrentPersona();
    if (currentPersona === null) {
      throw new Error(
        'No active persona set. Call activateFigure() or activateRolePerspective() first.',
      );
    }

    // 2. Determine technique
    const technique_id: TechniqueId = this.activeFigure !== null
      ? 'figure-storming'
      : 'rolestorming';

    // 3. Load fresh technique instance
    const instance = this.engine.loadTechnique(technique_id);

    // 4. Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // 5. Generate round output
    const output = instance.generateRound(round_number);

    // 6. Extract ideas and apply perspective fidelity
    const ideas = output.ideas ?? [];
    for (const idea of ideas) {
      // Perspective fidelity: always set, never null
      idea.perspective = currentPersona;
    }

    // 7. Emit each idea to capture loop
    for (const idea of ideas) {
      this.emitToCapture({
        agent: 'persona',
        content_type: 'idea',
        content: idea,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    // 8. Return ideas
    return ideas;
  }

  /**
   * Get the currently active persona (figure or custom perspective).
   *
   * Returns null if no persona is active.
   */
  getCurrentPersona(): AllowedFigure | string | null {
    return this.activeFigure ?? this.activeCustomPerspective;
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new Persona agent instance.
 *
 * Factory function following the project's functional API + class wrapper
 * pattern.
 */
export function createPersona(engine: TechniqueEngine, rulesEngine: RulesEngine): Persona {
  return new Persona(engine, rulesEngine);
}
