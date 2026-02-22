/**
 * Six Thinking Hats analytical brainstorming technique (de Bono).
 *
 * All participants adopt the same thinking mode (hat color) simultaneously,
 * then rotate through all six modes. Parallel thinking prevents cross-mode
 * arguments.
 *
 * SAFETY CRITICAL: Black Hat mode generates evaluative content (risks,
 * weaknesses). This is architecturally forbidden during the Diverge phase
 * per Pitfall 1 in PITFALLS.md. The phase_constraint field in TechniqueConfig
 * encodes this rule, and generateRound() enforces it by SKIPPING the Black
 * Hat round when the session phase is 'diverge'.
 *
 * Only imports: ../../shared/types.js, ../../shared/constants.js, node:crypto.
 */

import { randomUUID } from 'node:crypto';

import type {
  HatColor,
  Idea,
  SessionPhase,
  SessionState,
  TechniqueConfig,
  TechniqueId,
} from '../../shared/types.js';

import { HAT_DESCRIPTIONS, TECHNIQUE_DEFAULTS } from '../../shared/constants.js';

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
// Phase constraint — exported for Rules Engine / Phase Controller
// ============================================================================

/**
 * Phase constraint for the Six Thinking Hats Black Hat.
 *
 * Black Hat generates evaluative content (risks, weaknesses, problems).
 * This is architecturally forbidden during the Diverge phase because it
 * violates Osborn's Rule 2 (No Criticism) in content terms, even though
 * the producing agent is the Analyst, not the Critic.
 *
 * The Rules Engine and Phase Controller MUST check this constraint.
 */
export const SIX_HATS_PHASE_CONSTRAINT = {
  black_hat_forbidden_phases: ['diverge'] as const,
} as const;

// ============================================================================
// Six Thinking Hats Technique
// ============================================================================

/**
 * Default hat order: blue (process) -> white (facts) -> green (creative)
 * -> yellow (optimistic) -> black (critical) -> red (emotional) -> blue (close).
 */
const DEFAULT_HAT_ORDER: HatColor[] = [
  'blue',
  'white',
  'green',
  'yellow',
  'black',
  'red',
  'blue',
];

/**
 * Six Thinking Hats technique implementation.
 *
 * Cycles through hat colors in the specified order. Each round produces
 * ideas tagged with the active hat_color. The critical safety check:
 * if the current hat is 'black' and the session phase is 'diverge',
 * the round is SKIPPED and the engine advances to the next hat.
 */
export class SixThinkingHatsTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'six-thinking-hats';
  readonly config: TechniqueConfig;

  // Internal state
  private current_hat_index = 0;
  private hat_idea_counts: Map<HatColor, number> = new Map();
  private current_phase: SessionPhase = 'diverge';
  private problem = '';
  private start_time = 0;
  private total_elapsed_ms = 0;
  private round_count = 0;

  constructor() {
    const defaults = TECHNIQUE_DEFAULTS['six-thinking-hats'];

    const generation_context =
      'You are thinking with the ${hat_color} hat. ${HAT_MODE_DESCRIPTION}. ' +
      'ALL ideas in this round MUST have hat_color: "${hat_color}" set. ' +
      'During Green Hat: generate creative alternatives freely. ' +
      'During Black Hat: identify risks and weaknesses ONLY (evaluation is permitted in this hat). ' +
      'During Red Hat: emotional/gut reactions, no justification needed. ' +
      'During White Hat: factual observations and data needs only.';

    this.config = {
      id: 'six-thinking-hats',
      name: 'Six Thinking Hats',
      category: 'analytical',
      description:
        'de Bono parallel thinking method. All participants adopt the same thinking mode (hat color) ' +
        'simultaneously, then rotate through all six modes to explore the problem from every angle.',
      default_duration_ms: 2_100_000,
      min_duration_ms: 600_000,
      max_duration_ms: 3_600_000,
      required_agents: defaults.agents,
      optional_agents: ['ideator', 'critic'],
      valid_phases: ['diverge', 'organize', 'converge'],
      osborn_rules: ['quantity', 'no-criticism', 'wild-ideas', 'build-combine'],
      parameters: {
        hat_order: [...DEFAULT_HAT_ORDER],
        duration_per_hat_ms: 300_000,
        // SAFETY: Black Hat generates evaluative content (risks, weaknesses).
        // This is architecturally forbidden during Diverge phase.
        // The Rules Engine and Phase Controller MUST check this field.
        phase_constraint: {
          black_hat_forbidden_phases: ['diverge'] as SessionPhase[],
          description:
            'Black Hat (critical judgment) must only run during Converge or Organize phase. ' +
            'If session phase is Diverge when Black Hat round is due, skip Black Hat and continue to Red Hat.',
        },
        generation_context,
      },
    };

    // Initialize hat counters
    const all_hats: HatColor[] = ['white', 'red', 'black', 'yellow', 'green', 'blue'];
    for (const hat of all_hats) {
      this.hat_idea_counts.set(hat, 0);
    }
  }

  /**
   * Initialize with problem context and session state.
   *
   * Stores the session phase at initialization time and logs a warning
   * if the session is in Diverge phase (Black Hat will be skipped).
   */
  initialize(problem: string, session: SessionState): void {
    this.problem = problem;
    this.current_phase = session.phase;
    this.start_time = Date.now();
    this.current_hat_index = 0;
    this.round_count = 0;
    this.total_elapsed_ms = 0;

    const all_hats: HatColor[] = ['white', 'red', 'black', 'yellow', 'green', 'blue'];
    for (const hat of all_hats) {
      this.hat_idea_counts.set(hat, 0);
    }

    // Warn if session is in Diverge — Black Hat will be skipped if reached
    if (session.phase === 'diverge') {
      console.warn(
        'Six Thinking Hats initialized during Diverge phase. ' +
        'Black Hat will be SKIPPED if reached during Diverge (Pitfall 1 prevention).',
      );
    }
  }

  /**
   * Generate a round of ideas under the current hat color.
   *
   * SAFETY CHECK: If the current hat is 'black' and the session phase
   * is 'diverge', the Black Hat round is SKIPPED. The engine advances
   * to the next hat and generates under that hat instead.
   */
  generateRound(round_number: number): TechniqueOutput {
    const hat_order = this.config.parameters.hat_order as HatColor[];
    const round_start = Date.now();

    // Resolve the active hat (with Black Hat safety skip)
    let active_hat = hat_order[this.current_hat_index % hat_order.length];

    // BLACK HAT SAFETY CHECK (Pitfall 1)
    if (active_hat === 'black' && this.current_phase === 'diverge') {
      console.warn(
        'SAFETY: Skipping Black Hat during Diverge phase (Pitfall 1 prevention)',
      );
      // Skip Black Hat — advance to next hat
      this.current_hat_index++;
      if (this.current_hat_index >= hat_order.length) {
        // All hats exhausted after skip — return empty round
        return {
          ideas: [],
          prompts: ['SAFETY: Black Hat skipped during Diverge. Hat cycle complete.'],
          metadata: {
            round: round_number,
            technique: 'six-thinking-hats',
            duration_ms: Date.now() - round_start,
          },
        };
      }
      active_hat = hat_order[this.current_hat_index % hat_order.length];
    }

    const hat_info = HAT_DESCRIPTIONS[active_hat];

    // Build resolved generation context
    const resolved_context = (this.config.parameters.generation_context as string)
      .replace(/\$\{hat_color\}/g, active_hat)
      .replace(
        /\$\{HAT_MODE_DESCRIPTION\}/g,
        `${hat_info.mode}: ${hat_info.focus}`,
      );

    // Generate 3-5 ideas under the current hat
    const idea_count = 3 + Math.floor(round_number % 3);
    const ideas: Idea[] = [];

    for (let i = 0; i < idea_count; i++) {
      const idea: Idea = {
        id: randomUUID(),
        content: `[${active_hat} hat — ${hat_info.mode}] ${hat_info.focus}: applied to ${this.problem}`,
        source_agent: 'analyst',
        source_technique: 'six-thinking-hats',
        phase: this.current_phase,
        hat_color: active_hat,
        tags: ['six-thinking-hats', active_hat],
        timestamp: Date.now(),
      };
      ideas.push(idea);
    }

    // Update hat idea counts
    const prev_count = this.hat_idea_counts.get(active_hat) ?? 0;
    this.hat_idea_counts.set(active_hat, prev_count + ideas.length);

    // Simulate time passage and advance hat after duration_per_hat_ms
    const duration_per_hat_ms = this.config.parameters.duration_per_hat_ms as number;
    const simulated_elapsed = duration_per_hat_ms / 3; // ~3 rounds per hat
    this.total_elapsed_ms += simulated_elapsed;
    this.round_count = round_number;

    // Advance hat index for next round if time budget exhausted
    const hat_rounds = Math.floor((this.hat_idea_counts.get(active_hat) ?? 0) / 3);
    if (hat_rounds >= 3) {
      // Approximately 3 rounds per hat
      this.current_hat_index++;
    }

    return {
      ideas,
      prompts: [resolved_context],
      metadata: {
        round: round_number,
        technique: 'six-thinking-hats',
        duration_ms: Date.now() - round_start,
      },
    };
  }

  /**
   * Return current technique state.
   */
  getState(): Record<string, unknown> {
    const hat_order = this.config.parameters.hat_order as HatColor[];
    const current_hat = hat_order[this.current_hat_index % hat_order.length];
    const hats_covered: HatColor[] = [];

    for (const [hat, count] of this.hat_idea_counts.entries()) {
      if (count > 0) {
        hats_covered.push(hat);
      }
    }

    let total_ideas = 0;
    for (const count of this.hat_idea_counts.values()) {
      total_ideas += count;
    }

    return {
      current_hat,
      hats_covered,
      total_ideas,
      current_hat_index: this.current_hat_index,
      phase_at_init: this.current_phase,
    };
  }

  /**
   * Check if the technique has naturally completed.
   *
   * Complete when all hats in the order have been covered OR total
   * elapsed time exceeds the default duration.
   */
  isComplete(): boolean {
    const hat_order = this.config.parameters.hat_order as HatColor[];
    return (
      this.current_hat_index >= hat_order.length ||
      this.total_elapsed_ms >= this.config.default_duration_ms
    );
  }

  /**
   * Update the current session phase.
   *
   * This allows the technique to respond to phase changes that occur
   * while the technique is running (e.g., transition from Diverge to
   * Organize mid-cycle).
   */
  setCurrentPhase(phase: SessionPhase): void {
    this.current_phase = phase;
  }
}

/**
 * Factory function for creating a Six Thinking Hats technique instance.
 */
export function createSixThinkingHatsTechnique(): TechniqueInstance {
  return new SixThinkingHatsTechnique();
}
