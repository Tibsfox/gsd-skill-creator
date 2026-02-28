/**
 * Pathway Router -- maps user situations to curated technique sequences.
 *
 * The router is the educational intelligence of the brainstorm system.
 * It analyzes problem statements to recommend appropriate pathways,
 * provides technique queues for guided sessions, and supports
 * mid-session resequencing based on energy and user signals.
 *
 * Five pre-built pathways loaded from JSON configs at construction:
 * creative-exploration, problem-solving, product-innovation,
 * decision-making, free-form.
 *
 * Only imports from ../shared/types.js and node builtins.
 * No imports from den/, vtm/, knowledge/.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  PathwayConfig,
  PathwayId,
  TechniqueId,
  SessionState,
} from '../shared/types.js';
import { PathwayConfigSchema } from '../shared/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Adaptation signals for mid-session technique queue resequencing.
 *
 * These signals come from the Facilitator or energy tracker and
 * trigger queue modifications without losing completed technique output.
 */
export type AdaptationSignal =
  | { type: 'low_energy'; completed_techniques: TechniqueId[] }
  | { type: 'user_request'; requested_technique: TechniqueId }
  | { type: 'saturation'; current_technique: TechniqueId }
  | { type: 'analytical_depth_needed'; current_technique: TechniqueId };

/**
 * Public interface for the Pathway Router.
 *
 * Used by the Facilitator agent to select pathways, get technique
 * queues, and adapt sequences mid-session.
 */
export interface IPathwayRouter {
  /** Recommend a pathway based on problem statement signal words. */
  recommendPathway(problem_statement: string): PathwayId;

  /** Get the full pathway configuration by ID. */
  getPathway(id: PathwayId): PathwayConfig;

  /** Get the technique queue (ordered technique IDs) for a pathway. */
  getTechniqueQueue(pathway_id: PathwayId): TechniqueId[];

  /**
   * Adapt the remaining technique queue based on a session signal.
   *
   * ONLY modifies the remaining queue -- completed techniques are
   * tracked in session.metadata.techniques_used and are never touched.
   */
  adaptTechniqueQueue(
    current_queue: TechniqueId[],
    signal: AdaptationSignal,
    session: SessionState,
  ): TechniqueId[];
}

// ============================================================================
// High-effort techniques (for low_energy signal filtering)
// ============================================================================

/**
 * Techniques that require sustained deep focus.
 * Removed from queue when low_energy signal is received.
 */
const HIGH_EFFORT_TECHNIQUES: ReadonlySet<TechniqueId> = new Set([
  'six-thinking-hats',
  'scamper',
  'lotus-blossom',
  'starbursting',
  'brainwriting-635',
]);

/**
 * High-energy replacement techniques.
 * Preferred insertions when energy is flagging.
 */
const HIGH_ENERGY_TECHNIQUES: readonly TechniqueId[] = [
  'rapid-ideation',
  'rolestorming',
];

// ============================================================================
// Implementation
// ============================================================================

/**
 * Pathway Router implementation.
 *
 * Loads all 5 pathway configs from JSON at construction time.
 * Builds a signal word index for fast recommendation matching.
 * Supports mid-session resequencing via adaptTechniqueQueue.
 */
export class PathwayRouter implements IPathwayRouter {
  private readonly pathways: Map<PathwayId, PathwayConfig>;
  private readonly signalIndex: Map<string, PathwayId[]>;

  constructor() {
    this.pathways = new Map<PathwayId, PathwayConfig>();
    this.signalIndex = new Map<string, PathwayId[]>();

    const configDir = join(dirname(fileURLToPath(import.meta.url)), 'configs');
    const pathwayIds: PathwayId[] = [
      'creative-exploration',
      'problem-solving',
      'product-innovation',
      'decision-making',
      'free-form',
    ];

    for (const id of pathwayIds) {
      const raw = readFileSync(join(configDir, `${id}.json`), 'utf-8');
      const config = PathwayConfigSchema.parse(JSON.parse(raw));
      this.pathways.set(id, config);

      // Build signal word index from recommended_for
      for (const phrase of config.recommended_for) {
        const normalizedPhrase = phrase.toLowerCase();
        const existing = this.signalIndex.get(normalizedPhrase) ?? [];
        existing.push(id);
        this.signalIndex.set(normalizedPhrase, existing);
      }
    }
  }

  /**
   * Recommend a pathway based on problem statement signal analysis.
   *
   * Algorithm:
   * 1. Tokenize problem_statement to lowercase
   * 2. Score each pathway by counting signal word/phrase matches
   *    from its recommended_for list
   * 3. Return highest-scoring pathway
   * 4. Tie-breaking: creative-exploration wins (broadest applicability)
   * 5. No matches (all scores 0): return free-form (safest fallback)
   */
  recommendPathway(problem_statement: string): PathwayId {
    const inputLower = problem_statement.toLowerCase();

    const scores = new Map<PathwayId, number>();
    for (const [id] of this.pathways) {
      scores.set(id, 0);
    }

    // Score each pathway by checking how many of its recommended_for
    // phrases appear in the input string
    for (const [phrase, pathwayIds] of this.signalIndex) {
      if (inputLower.includes(phrase)) {
        for (const pid of pathwayIds) {
          scores.set(pid, (scores.get(pid) ?? 0) + 1);
        }
      }
    }

    // Find highest score
    let bestId: PathwayId = 'free-form';
    let bestScore = 0;

    // Iterate in a deterministic order for tie-breaking:
    // creative-exploration first (wins ties due to broadest applicability)
    const tieBreakOrder: PathwayId[] = [
      'creative-exploration',
      'problem-solving',
      'product-innovation',
      'decision-making',
      'free-form',
    ];

    for (const id of tieBreakOrder) {
      const score = scores.get(id) ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    // If no signal words matched at all, return free-form
    if (bestScore === 0) {
      return 'free-form';
    }

    return bestId;
  }

  /**
   * Get the full pathway configuration by ID.
   *
   * Throws if the pathway ID is not recognized.
   */
  getPathway(id: PathwayId): PathwayConfig {
    const config = this.pathways.get(id);
    if (!config) {
      throw new Error(`Unknown pathway: ${id}`);
    }
    return config;
  }

  /**
   * Get the ordered technique IDs for a pathway.
   *
   * For free-form, returns an empty array (user-directed).
   * For guided pathways, returns the technique_sequence IDs in order.
   */
  getTechniqueQueue(pathway_id: PathwayId): TechniqueId[] {
    const config = this.getPathway(pathway_id);
    return config.technique_sequence.map(step => step.technique);
  }

  /**
   * Adapt the remaining technique queue based on a session signal.
   *
   * CRITICAL: Only modifies the REMAINING queue passed in.
   * Completed techniques (session.metadata.techniques_used) are
   * never touched by this method.
   *
   * Signal handling:
   * - low_energy: Remove high-effort techniques, insert high-energy replacement
   * - user_request: Move/insert requested technique to front of queue
   * - saturation: Remove current technique from remaining queue (skip ahead)
   * - analytical_depth_needed: Insert starbursting or five-whys after current
   */
  adaptTechniqueQueue(
    current_queue: TechniqueId[],
    signal: AdaptationSignal,
    session: SessionState,
  ): TechniqueId[] {
    // Work on a copy to avoid mutating the input
    let queue = [...current_queue];

    switch (signal.type) {
      case 'low_energy': {
        // Remove high-effort techniques from remaining queue
        queue = queue.filter(t => !HIGH_EFFORT_TECHNIQUES.has(t));

        // Insert a high-energy technique at the front if not already there
        const energizer = HIGH_ENERGY_TECHNIQUES.find(t =>
          !signal.completed_techniques.includes(t),
        ) ?? HIGH_ENERGY_TECHNIQUES[0];

        if (queue[0] !== energizer) {
          queue.unshift(energizer);
        }
        break;
      }

      case 'user_request': {
        const { requested_technique } = signal;
        // Remove from current position if already in queue
        queue = queue.filter(t => t !== requested_technique);
        // Insert at front (next up)
        queue.unshift(requested_technique);
        break;
      }

      case 'saturation': {
        const { current_technique } = signal;
        // Remove the saturated technique from remaining queue
        queue = queue.filter(t => t !== current_technique);
        break;
      }

      case 'analytical_depth_needed': {
        // Insert starbursting or five-whys after the current position
        // Prefer starbursting if not already in queue, else five-whys
        const depthTechnique: TechniqueId =
          !queue.includes('starbursting') ? 'starbursting' : 'five-whys';

        // Insert at position 1 (after current, which is position 0)
        // If queue is empty, just add it
        if (queue.length === 0) {
          queue.push(depthTechnique);
        } else {
          queue.splice(1, 0, depthTechnique);
        }
        break;
      }
    }

    return queue;
  }
}
