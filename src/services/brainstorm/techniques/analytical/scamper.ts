/**
 * SCAMPER analytical brainstorming technique.
 *
 * Seven structured lenses (Substitute, Combine, Adapt, Modify,
 * Put to another use, Eliminate, Reverse) applied sequentially
 * to an existing product/process/idea.
 *
 * Each idea produced is tagged with the scamper_lens that generated it.
 * The generation_context encodes per-lens prompt guidance from
 * SCAMPER_PROMPTS to prevent technique fidelity erosion (Pitfall 5).
 *
 * Only imports: ../../shared/types.js, ../../shared/constants.js, node:crypto.
 */

import { randomUUID } from 'node:crypto';

import type {
  Idea,
  ScamperLens,
  SessionPhase,
  SessionState,
  TechniqueConfig,
  TechniqueId,
} from '../../shared/types.js';

import { SCAMPER_PROMPTS, TECHNIQUE_DEFAULTS } from '../../shared/constants.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Output from a technique round.
 */
export interface TechniqueOutput {
  ideas?: Idea[];
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
// SCAMPER Technique
// ============================================================================

const ALL_LENSES: ScamperLens[] = [
  'substitute',
  'combine',
  'adapt',
  'modify',
  'put-to-another-use',
  'eliminate',
  'reverse',
];

/**
 * SCAMPER technique implementation.
 *
 * Cycles through all 7 lenses, generating ideas tagged with the active lens.
 * Each round produces 3-5 ideas under the current lens. The lens advances
 * after duration_per_lens_ms has elapsed on that lens.
 */
export class ScamperTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'scamper';
  readonly config: TechniqueConfig;

  // Internal state
  private current_lens_index = 0;
  private lens_idea_counts: Map<ScamperLens, number> = new Map();
  private elapsed_per_lens: Map<ScamperLens, number> = new Map();
  private total_elapsed_ms = 0;
  private problem = '';
  private session_phase: SessionPhase = 'diverge';
  private start_time = 0;
  private round_count = 0;

  constructor() {
    const defaults = TECHNIQUE_DEFAULTS['scamper'];

    // Build generation_context template that embeds per-lens prompts
    const generation_context =
      'Apply the ${current_lens} lens systematically. ${SCAMPER_PROMPT_FOR_LENS}. ' +
      'Every idea MUST be tagged with scamper_lens: "${current_lens}". ' +
      'Think specifically about how ${current_lens} applies to the problem — not a generic brainstorm.';

    this.config = {
      id: 'scamper',
      name: 'SCAMPER',
      category: 'analytical',
      description:
        'Seven structured lenses (Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse) ' +
        'applied systematically to transform and improve existing ideas, products, or processes.',
      default_duration_ms: 1_800_000,
      min_duration_ms: 420_000,
      max_duration_ms: 3_600_000,
      required_agents: defaults.agents,
      optional_agents: ['ideator'],
      valid_phases: ['diverge', 'organize'],
      osborn_rules: ['quantity', 'no-criticism', 'wild-ideas'],
      parameters: {
        lenses: [...ALL_LENSES],
        duration_per_lens_ms: 300_000,
        focus_lenses: null,
        generation_context,
      },
    };

    // Initialize lens counters
    for (const lens of ALL_LENSES) {
      this.lens_idea_counts.set(lens, 0);
      this.elapsed_per_lens.set(lens, 0);
    }
  }

  /**
   * Initialize with problem context and session state.
   */
  initialize(problem: string, session: SessionState): void {
    this.problem = problem;
    this.session_phase = session.phase;
    this.start_time = Date.now();
    this.current_lens_index = 0;
    this.round_count = 0;
    this.total_elapsed_ms = 0;

    for (const lens of ALL_LENSES) {
      this.lens_idea_counts.set(lens, 0);
      this.elapsed_per_lens.set(lens, 0);
    }
  }

  /**
   * Generate a round of ideas under the current SCAMPER lens.
   *
   * Each idea is tagged with scamper_lens and includes lens-specific tags.
   * After duration_per_lens_ms has elapsed on a lens, the engine advances
   * to the next lens.
   */
  generateRound(round_number: number): TechniqueOutput {
    const duration_per_lens_ms = this.config.parameters.duration_per_lens_ms as number;
    const lenses = this.getActiveLenses();
    const round_start = Date.now();

    // Check if we should advance to the next lens based on elapsed time
    const current_lens = lenses[this.current_lens_index % lenses.length];
    const lens_elapsed = this.elapsed_per_lens.get(current_lens) ?? 0;

    if (lens_elapsed >= duration_per_lens_ms && this.current_lens_index < lenses.length - 1) {
      this.current_lens_index++;
    }

    const active_lens = lenses[this.current_lens_index % lenses.length];
    const lens_prompts = SCAMPER_PROMPTS[active_lens];

    // Build the resolved generation context for this round
    const resolved_context = (this.config.parameters.generation_context as string)
      .replace(/\$\{current_lens\}/g, active_lens)
      .replace(
        /\$\{SCAMPER_PROMPT_FOR_LENS\}/g,
        lens_prompts.join(' '),
      );

    // Generate 3-5 ideas under the current lens
    const idea_count = 3 + Math.floor(round_number % 3); // 3-5 ideas per round
    const ideas: Idea[] = [];

    for (let i = 0; i < idea_count; i++) {
      const idea: Idea = {
        id: randomUUID(),
        content: `[${active_lens}] ${lens_prompts[i % lens_prompts.length]} — applied to: ${this.problem}`,
        source_agent: 'analyst',
        source_technique: 'scamper',
        phase: this.session_phase,
        scamper_lens: active_lens,
        tags: ['scamper', active_lens],
        timestamp: Date.now(),
      };
      ideas.push(idea);
    }

    // Update lens idea counts
    const prev_count = this.lens_idea_counts.get(active_lens) ?? 0;
    this.lens_idea_counts.set(active_lens, prev_count + ideas.length);

    // Update elapsed time tracking
    const round_duration = Date.now() - round_start;
    const prev_elapsed = this.elapsed_per_lens.get(active_lens) ?? 0;
    // Simulate time passage based on round duration + proportional allocation
    const simulated_elapsed = duration_per_lens_ms / 3; // ~1/3 of lens time per round
    this.elapsed_per_lens.set(active_lens, prev_elapsed + simulated_elapsed);
    this.total_elapsed_ms = Date.now() - this.start_time;
    this.round_count = round_number;

    // Check if current lens time is exhausted, advance for next round
    const updated_elapsed = this.elapsed_per_lens.get(active_lens) ?? 0;
    if (updated_elapsed >= duration_per_lens_ms && this.current_lens_index < lenses.length - 1) {
      this.current_lens_index++;
    }

    return {
      ideas,
      prompts: [resolved_context],
      metadata: {
        round: round_number,
        technique: 'scamper',
        duration_ms: round_duration,
      },
    };
  }

  /**
   * Return current technique state.
   */
  getState(): Record<string, unknown> {
    const lenses = this.getActiveLenses();
    const current_lens = lenses[this.current_lens_index % lenses.length];
    const lenses_covered = new Set<ScamperLens>();

    for (const [lens, count] of this.lens_idea_counts.entries()) {
      if (count > 0) {
        lenses_covered.add(lens);
      }
    }

    let total_ideas = 0;
    for (const count of this.lens_idea_counts.values()) {
      total_ideas += count;
    }

    return {
      current_lens,
      lenses_covered: [...lenses_covered],
      total_ideas,
      current_lens_index: this.current_lens_index,
    };
  }

  /**
   * Check if the technique has naturally completed.
   *
   * Complete when all lenses have been covered OR total elapsed time
   * exceeds the default duration.
   */
  isComplete(): boolean {
    const lenses = this.getActiveLenses();
    return (
      this.current_lens_index >= lenses.length ||
      this.total_elapsed_ms >= this.config.default_duration_ms
    );
  }

  /**
   * Get the active lens list — either focus_lenses (if set) or all lenses.
   */
  private getActiveLenses(): ScamperLens[] {
    const focus = this.config.parameters.focus_lenses as ScamperLens[] | null;
    return focus ?? ALL_LENSES;
  }
}

/**
 * Factory function for creating a SCAMPER technique instance.
 */
export function createScamperTechnique(): TechniqueInstance {
  return new ScamperTechnique();
}
