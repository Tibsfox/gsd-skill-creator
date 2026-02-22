/**
 * Lotus Blossom visual brainstorming technique.
 *
 * Forced elaboration: central concept -> 8 surrounding themes ->
 * each theme expands into 8 ideas. Total: 64 ideas.
 *
 * isComplete() returns true ONLY when 64 ideas are generated
 * (8 themes x 8 ideas). This is strict -- partial completion
 * is not complete.
 *
 * Ideas have parent_id pointing to their theme node UUID.
 * First idea of each theme determines the theme label.
 *
 * Includes semantic duplicate detection per PITFALLS.md:
 * if the last 3 ideas from the same theme start with the same word
 * or are shorter than 3 words, a creative redirect prompt is added.
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

import type { TechniqueInstance, TechniqueOutput } from '../engine.js';

// ============================================================================
// Configuration
// ============================================================================

const LOTUS_BLOSSOM_CONFIG: TechniqueConfig = {
  id: 'lotus-blossom',
  name: 'Lotus Blossom',
  category: 'visual',
  description: 'Central concept expands into 8 themes, each with 8 ideas. Forced elaboration to 64 ideas.',
  default_duration_ms: 900_000,
  min_duration_ms: 600_000,
  max_duration_ms: 2_700_000,
  required_agents: ['mapper', 'ideator'],
  optional_agents: [],
  valid_phases: ['diverge'],
  osborn_rules: ['quantity', 'wild-ideas', 'build-combine'],
  parameters: {
    central_concept: '',
    themes_count: 8,
    ideas_per_theme: 8,
    generation_context:
      'Lotus Blossom grid expansion. Central concept: "${central_concept}". Theme: "${current_theme}". Generate idea ${idea_number_in_theme} of 8 for this theme. This is FORCED ELABORATION -- you must generate all 8 ideas per theme, pushing past the obvious first responses into creative territory. Each idea explores a different angle of the theme.',
  },
};

// ============================================================================
// Internal types
// ============================================================================

interface ThemeState {
  id: string;
  label: string;
  ideas: Idea[];
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Lotus Blossom technique instance.
 *
 * Central node is the problem statement (not an idea itself).
 * 8 theme nodes radiate from center -- each theme is like a
 * mini-freewriting topic. 8 ideas radiate from each theme node.
 * Total: 64 ideas.
 *
 * isComplete() returns true ONLY when total_ideas >= themes_count * ideas_per_theme.
 */
export class LotusBlossom64Technique implements TechniqueInstance {
  readonly id: TechniqueId = 'lotus-blossom';
  readonly config: TechniqueConfig = LOTUS_BLOSSOM_CONFIG;

  private central_concept = '';
  private themes: Map<number, ThemeState> = new Map();
  private current_theme_index = 0;
  private total_ideas = 0;
  private start_time = 0;

  /**
   * Initialize with problem context.
   *
   * Creates 8 empty theme entries with UUID identifiers.
   * Theme IDs serve as parent_id for all ideas in that theme.
   */
  initialize(problem: string, _session: SessionState): void {
    this.central_concept = problem;
    this.themes = new Map();
    this.current_theme_index = 0;
    this.total_ideas = 0;
    this.start_time = Date.now();

    // Create 8 empty theme entries
    const themes_count = (this.config.parameters as Record<string, unknown>).themes_count as number;
    for (let i = 0; i < themes_count; i++) {
      this.themes.set(i, {
        id: randomUUID(),
        label: '',
        ideas: [],
      });
    }
  }

  /**
   * Generate 1-2 ideas for the current theme per round.
   *
   * If the current theme has 8 ideas, advances to the next theme.
   * Each idea has parent_id = theme.id (links idea to its theme node).
   *
   * Includes semantic duplicate detection: if the last 3 ideas from
   * the same theme start with the same word OR are shorter than 3 words,
   * adds a creative redirect prompt instead of forcing more duplicates.
   */
  generateRound(round_number: number): TechniqueOutput {
    const params = this.config.parameters as Record<string, unknown>;
    const ideas_per_theme = params.ideas_per_theme as number;
    const themes_count = params.themes_count as number;

    // Find the next theme that needs ideas
    while (this.current_theme_index < themes_count) {
      const theme = this.themes.get(this.current_theme_index);
      if (theme && theme.ideas.length < ideas_per_theme) {
        break;
      }
      this.current_theme_index++;
    }

    // All themes full
    if (this.current_theme_index >= themes_count) {
      return {
        ideas: [],
        prompts: ['Lotus Blossom grid is complete -- all 64 ideas generated.'],
        metadata: {
          round: round_number,
          technique: this.id,
          duration_ms: Date.now() - this.start_time,
        },
      };
    }

    const theme = this.themes.get(this.current_theme_index)!;
    const remaining = ideas_per_theme - theme.ideas.length;
    const ideas_this_round = Math.min(remaining, 2);
    const new_ideas: Idea[] = [];
    const prompts: string[] = [];

    // Check for semantic duplicates before generating
    if (this.detectDuplicatePattern(theme)) {
      prompts.push('Explore a completely different angle for this theme');
    }

    for (let i = 0; i < ideas_this_round; i++) {
      const idea_number = theme.ideas.length + 1;
      const idea: Idea = {
        id: randomUUID(),
        content: `[Lotus ${this.central_concept}] Theme ${this.current_theme_index}: idea ${idea_number} of ${ideas_per_theme}`,
        source_agent: 'ideator',
        source_technique: 'lotus-blossom',
        phase: 'diverge',
        parent_id: theme.id,
        tags: [
          'lotus-blossom',
          `theme-${this.current_theme_index}`,
          `idea-${idea_number}-of-${ideas_per_theme}`,
        ],
        timestamp: Date.now(),
      };

      new_ideas.push(idea);
      theme.ideas.push(idea);
      this.total_ideas++;

      // First idea of each theme determines the theme label
      if (theme.ideas.length === 1) {
        theme.label = idea.content.substring(0, 30);
      }
    }

    // Check for duplicate pattern after generating (for next round's prompts)
    if (this.detectDuplicatePattern(theme)) {
      prompts.push('Explore a completely different angle for this theme');
    }

    // If current theme is now full, advance
    if (theme.ideas.length >= ideas_per_theme) {
      this.current_theme_index++;
    }

    return {
      ideas: new_ideas,
      prompts: prompts.length > 0 ? prompts : undefined,
      metadata: {
        round: round_number,
        technique: this.id,
        duration_ms: Date.now() - this.start_time,
      },
    };
  }

  /**
   * Detect semantic duplicate pattern in the last 3 ideas of a theme.
   *
   * Returns true if the last 3 ideas:
   * - Start with the same word, OR
   * - Are shorter than 3 words
   *
   * Per PITFALLS.md: Lotus Blossom forced 64-idea expansion --
   * stop expansion when consecutive ideas are semantic duplicates.
   */
  private detectDuplicatePattern(theme: ThemeState): boolean {
    if (theme.ideas.length < 3) return false;

    const last3 = theme.ideas.slice(-3);

    // Check if all 3 start with the same word
    const first_words = last3.map(idea => {
      const words = idea.content.trim().split(/\s+/);
      return words[0]?.toLowerCase() ?? '';
    });

    const all_same_first_word = first_words.every(w => w === first_words[0]);

    // Check if all 3 are shorter than 3 words
    const all_short = last3.every(idea => {
      const words = idea.content.trim().split(/\s+/);
      return words.length < 3;
    });

    return all_same_first_word || all_short;
  }

  /**
   * Return technique-specific internal state.
   */
  getState(): Record<string, unknown> {
    const themes_state: Record<string, unknown>[] = [];
    for (const [index, theme] of this.themes) {
      themes_state.push({
        index,
        id: theme.id,
        label: theme.label,
        idea_count: theme.ideas.length,
      });
    }

    return {
      central_concept: this.central_concept,
      current_theme_index: this.current_theme_index,
      total_ideas: this.total_ideas,
      themes: themes_state,
      elapsed_ms: Date.now() - this.start_time,
    };
  }

  /**
   * Complete ONLY when total_ideas >= themes_count * ideas_per_theme (64).
   *
   * Strict: partial completion is not complete.
   */
  isComplete(): boolean {
    const params = this.config.parameters as Record<string, unknown>;
    const themes_count = params.themes_count as number;
    const ideas_per_theme = params.ideas_per_theme as number;
    return this.total_ideas >= themes_count * ideas_per_theme;
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a fresh LotusBlossom64Technique instance.
 *
 * Used by the TechniqueEngine registry for lazy instantiation.
 */
export function createLotusBlossomTechnique(): TechniqueInstance {
  return new LotusBlossom64Technique();
}
