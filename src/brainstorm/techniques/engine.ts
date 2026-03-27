/**
 * Technique Engine -- pluggable interface for brainstorming technique management.
 *
 * The engine is the foundation that all agents call into. It provides:
 * - Lazy factory registry for technique instantiation
 * - Configuration lookup by ID, category, or situation
 * - Consistent TechniqueInstance interface for all 16 techniques
 *
 * Individual technique modules export factory functions that the engine
 * registers in its constructor. Agents call loadTechnique() to get a
 * fully configured TechniqueInstance.
 *
 * Only imports from ../shared/types.js and ../shared/constants.js.
 * No imports from den/, vtm/, knowledge/, or any other project module.
 */

import type {
  TechniqueId,
  TechniqueCategory,
  TechniqueConfig,
  SessionState,
  Idea,
  Question,
} from '../shared/types.js';

import { TECHNIQUE_DEFAULTS } from '../shared/constants.js';

import { createFreewritingTechnique } from './individual/freewriting.js';
import { createMindMappingTechnique } from './individual/mind-mapping.js';
import { createRapidIdeationTechnique } from './individual/rapid-ideation.js';
import { createQuestionBrainstormingTechnique } from './individual/question-brainstorming.js';

// Collaborative techniques (5)
import { createBrainwriting635Technique } from './collaborative/brainwriting-635.js';
import { createRoundRobinTechnique } from './collaborative/round-robin.js';
import { createBrainNettingTechnique } from './collaborative/brain-netting.js';
import { createRolestormingTechnique } from './collaborative/rolestorming.js';
import { createFigureStormingTechnique } from './collaborative/figure-storming.js';

// Analytical techniques (4)
import { createScamperTechnique } from './analytical/scamper.js';
import { createSixThinkingHatsTechnique } from './analytical/six-thinking-hats.js';
import { createStarburstingTechnique } from './analytical/starbursting.js';
import { createFiveWhysTechnique } from './analytical/five-whys.js';

// Visual techniques (3)
import { createStoryboardingTechnique } from './visual/storyboarding.js';
import { createAffinityMappingTechnique } from './visual/affinity-mapping.js';
import { createLotusBlossomTechnique } from './visual/lotus-blossom.js';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Visualization data for future GSD-OS rendering.
 *
 * Stored as structured output, not rendered in v1.32.
 * Supports tree (mind mapping), grid (lotus blossom),
 * sequence (storyboarding), and clusters (affinity mapping).
 */
export type VisualizationData = {
  type: 'tree' | 'grid' | 'sequence' | 'clusters';
  nodes: Array<{
    id: string;
    label: string;
    parent_id?: string;
    position?: { x: number; y: number };
  }>;
};

/**
 * Output from a single round of technique execution.
 *
 * A round produces ideas, questions, or both -- plus optional prompts
 * and visualization data. Metadata tracks provenance.
 */
export type TechniqueOutput = {
  ideas?: Idea[];
  questions?: Question[];
  prompts?: string[];
  visualization?: VisualizationData;
  metadata: {
    round: number;
    technique: TechniqueId;
    duration_ms: number;
  };
};

/**
 * A loaded, stateful technique instance.
 *
 * Created by TechniqueEngine.loadTechnique(). Each instance tracks its
 * own internal state (idea count, elapsed time, round number, etc.)
 * and exposes a consistent interface regardless of technique type.
 */
export interface TechniqueInstance {
  readonly id: TechniqueId;
  readonly config: TechniqueConfig;

  /** Initialize with problem context and session state. Resets internal counters. */
  initialize(problem: string, session: SessionState): void;

  /** Generate the next batch of output for the given round. */
  generateRound(round_number: number, previous_output?: Idea[] | Question[]): TechniqueOutput;

  /** Return technique-specific internal state (idea_count, elapsed_ms, round_number, etc.). */
  getState(): Record<string, unknown>;

  /** Check if the technique has naturally completed based on its completion criteria. */
  isComplete(): boolean;
}

/**
 * The public interface for the Technique Engine.
 *
 * Agents interact with techniques exclusively through this interface.
 * The engine manages the registry of technique factories and provides
 * lookup by ID, category, or situation keywords.
 */
export interface ITechniqueEngine {
  /** Load and instantiate a technique by ID. Throws if unknown. */
  loadTechnique(id: TechniqueId): TechniqueInstance;

  /** Get the static configuration for a technique. */
  getConfig(id: TechniqueId): TechniqueConfig;

  /** List all techniques in a given category, sorted by name. */
  listByCategory(category: TechniqueCategory): TechniqueConfig[];

  /** Search techniques by situation string (lightweight keyword matching). */
  listBySituation(situation: string): TechniqueConfig[];
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Technique Engine implementation.
 *
 * Maintains a lazy factory registry: Map<TechniqueId, () => TechniqueInstance>.
 * Factories are registered in the constructor. Each call to loadTechnique()
 * creates a fresh instance -- instances are not cached.
 */
export class TechniqueEngine implements ITechniqueEngine {
  private readonly registry: Map<TechniqueId, () => TechniqueInstance>;

  constructor() {
    this.registry = new Map<TechniqueId, () => TechniqueInstance>();

    // Individual techniques (4)
    this.register('freewriting', createFreewritingTechnique);
    this.register('mind-mapping', createMindMappingTechnique);
    this.register('rapid-ideation', createRapidIdeationTechnique);
    this.register('question-brainstorming', createQuestionBrainstormingTechnique);

    // Collaborative techniques (5)
    this.register('brainwriting-635', createBrainwriting635Technique);
    this.register('round-robin', createRoundRobinTechnique);
    this.register('brain-netting', createBrainNettingTechnique);
    this.register('rolestorming', createRolestormingTechnique);
    this.register('figure-storming', createFigureStormingTechnique);

    // Analytical techniques (4)
    this.register('scamper', createScamperTechnique);
    this.register('six-thinking-hats', createSixThinkingHatsTechnique);
    this.register('starbursting', createStarburstingTechnique);
    this.register('five-whys', createFiveWhysTechnique);

    // Visual techniques (3)
    this.register('storyboarding', createStoryboardingTechnique);
    this.register('affinity-mapping', createAffinityMappingTechnique);
    this.register('lotus-blossom', createLotusBlossomTechnique);
  }

  /**
   * Register a technique factory in the engine.
   *
   * Called internally during construction. Each factory produces
   * a fresh TechniqueInstance when invoked.
   */
  private register(id: TechniqueId, factory: () => TechniqueInstance): void {
    this.registry.set(id, factory);
  }

  /**
   * Load and instantiate a technique by ID.
   *
   * Creates a fresh instance on each call (not cached).
   * Throws Error('Unknown technique: ${id}') if the technique is not registered.
   */
  loadTechnique(id: TechniqueId): TechniqueInstance {
    const factory = this.registry.get(id);
    if (!factory) {
      throw new Error(`Unknown technique: ${id}`);
    }
    return factory();
  }

  /**
   * Get the static configuration for a technique.
   *
   * Loads the technique to access its config property.
   */
  getConfig(id: TechniqueId): TechniqueConfig {
    const instance = this.loadTechnique(id);
    return instance.config;
  }

  /**
   * List all registered techniques in a given category, sorted by name.
   *
   * Iterates the registry, loads each technique, filters by category,
   * and returns TechniqueConfig[] sorted alphabetically by name.
   */
  listByCategory(category: TechniqueCategory): TechniqueConfig[] {
    const configs: TechniqueConfig[] = [];
    for (const [id] of this.registry) {
      const instance = this.loadTechnique(id);
      if (instance.config.category === category) {
        configs.push(instance.config);
      }
    }
    return configs.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search techniques by situation string using simple keyword matching.
   *
   * Splits the situation string into lowercase keywords and checks each
   * technique's name and description for matches. Returns techniques
   * with at least one keyword match, sorted by match count (descending).
   *
   * This is lightweight hint matching -- not the Pathway Router's
   * signal analysis. Good enough for quick lookups.
   */
  listBySituation(situation: string): TechniqueConfig[] {
    const keywords = situation.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    if (keywords.length === 0) return [];

    const scored: Array<{ config: TechniqueConfig; score: number }> = [];

    for (const [id] of this.registry) {
      const instance = this.loadTechnique(id);
      const config = instance.config;
      const searchText = `${config.name} ${config.description}`.toLowerCase();

      let score = 0;
      for (const keyword of keywords) {
        if (searchText.includes(keyword)) {
          score++;
        }
      }

      if (score > 0) {
        scored.push({ config, score });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.config);
  }
}
