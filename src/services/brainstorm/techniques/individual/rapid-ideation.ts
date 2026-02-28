/**
 * Rapid Ideation technique implementation.
 *
 * Mechanic: Extreme time pressure to override self-censorship. SPEED OVER
 * QUALITY. Maximum 10 words per idea. No elaboration. No explanation.
 * Quantity is the ONLY metric.
 *
 * Completion: idea_count >= target_count (default 10).
 *
 * Output: Burst of short Idea[] (5-10 per round). Ideas MUST be short --
 * 10-word max enforced on content field (truncated at word boundary).
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

const RAPID_IDEATION_CONFIG: TechniqueConfig = {
  id: 'rapid-ideation',
  name: 'Rapid Ideation',
  category: 'individual',
  description: 'Extreme time pressure brainstorming to override self-censorship. Speed over quality. Short, punchy ideas fired out as fast as possible.',
  default_duration_ms: 60_000,
  min_duration_ms: 30_000,
  max_duration_ms: 180_000,
  required_agents: ['ideator'],
  optional_agents: ['scribe'],
  valid_phases: ['diverge'],
  osborn_rules: ['quantity', 'no-criticism', 'wild-ideas'],
  parameters: {
    target_count: 10,
    generation_context: 'SPEED OVER QUALITY. Maximum 10 words per idea. No elaboration. No explanation. Fire them out as fast as possible. Quantity is the ONLY metric.',
  },
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Truncate content to a maximum word count at a word boundary.
 * Ensures rapid ideation ideas stay short and punchy.
 */
function truncateToWords(content: string, maxWords: number): string {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= maxWords) return content.trim();
  return words.slice(0, maxWords).join(' ');
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Rapid Ideation technique instance.
 *
 * Produces bursts of 5-10 short ideas per round. Content is truncated
 * at 10 words to enforce the speed-over-quality mechanic. Completes
 * when target_count ideas have been generated.
 */
class RapidIdeationTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'rapid-ideation';
  readonly config: TechniqueConfig = RAPID_IDEATION_CONFIG;

  private problem: string = '';
  private start_time: number = 0;
  private idea_count: number = 0;
  private round_number: number = 0;

  /**
   * Initialize with problem context and session state.
   * Resets all internal counters.
   */
  initialize(problem: string, _session: SessionState): void {
    this.problem = problem;
    this.start_time = Date.now();
    this.idea_count = 0;
    this.round_number = 0;
  }

  /**
   * Generate a burst of rapid ideas.
   *
   * Produces 5-10 ideas per round. Each idea is truncated to 10 words max.
   * Content is deterministic placeholder based on problem + technique context.
   */
  generateRound(round_number: number, _previous_output?: Idea[] | Question[]): TechniqueOutput {
    const round_start = Date.now();
    this.round_number = round_number;

    // 5-10 ideas per burst
    const burst_size = 5 + (round_number % 6);
    const ideas: Idea[] = [];

    for (let i = 0; i < burst_size; i++) {
      const raw_content = `Quick idea ${this.idea_count + 1} about ${this.problem}`;
      const content = truncateToWords(raw_content, 10);

      const idea: Idea = {
        id: randomUUID(),
        content,
        source_agent: 'ideator',
        source_technique: 'rapid-ideation',
        phase: 'diverge',
        tags: [],
        timestamp: Date.now(),
      };
      ideas.push(idea);
      this.idea_count++;
    }

    const round_duration = Date.now() - round_start;

    return {
      ideas,
      metadata: {
        round: round_number,
        technique: 'rapid-ideation',
        duration_ms: round_duration,
      },
    };
  }

  /**
   * Return technique-specific internal state.
   */
  getState(): Record<string, unknown> {
    return {
      idea_count: this.idea_count,
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
      round_number: this.round_number,
    };
  }

  /**
   * Check if rapid ideation is complete.
   *
   * Complete when idea_count >= target_count.
   */
  isComplete(): boolean {
    if (this.start_time === 0) return false;
    const target = this.config.parameters.target_count as number;
    return this.idea_count >= target;
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new RapidIdeationTechnique instance.
 * Registered with the TechniqueEngine in its constructor.
 */
export function createRapidIdeationTechnique(): TechniqueInstance {
  return new RapidIdeationTechnique();
}

export { RapidIdeationTechnique };
