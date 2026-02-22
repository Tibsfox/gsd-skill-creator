/**
 * Mapper agent -- organizational techniques without quality evaluation.
 *
 * The Mapper wraps four organizational technique instances from the
 * TechniqueEngine: mind-mapping, affinity-mapping, lotus-blossom,
 * storyboarding.
 *
 * Critical behavioral constraint: The Mapper NEVER evaluates idea
 * quality. All ideas deserve placement. The evaluateIdeaQuality()
 * method exists solely to document and enforce this constraint --
 * it throws unconditionally.
 *
 * organizeAffinity guarantees:
 * - Every input idea appears in exactly one cluster
 * - Between 2 and 8 clusters returned
 * - No idea is ever rejected on quality grounds
 *
 * All generated ideas and clusters are emitted to the capture loop
 * for Scribe consumption.
 *
 * Only imports from ../shared/types.js, ../techniques/engine.js,
 * ../core/rules-engine.js, and ./base.js.
 * Zero imports from den/, vtm/, knowledge/.
 */

import type {
  Cluster,
  Idea,
  SessionState,
  TechniqueId,
} from '../shared/types.js';

import type { TechniqueEngine } from '../techniques/engine.js';
import type { RulesEngine } from '../core/rules-engine.js';

import { TechniqueAgent } from './base.js';

// ============================================================================
// Mapper agent
// ============================================================================

/**
 * Mapper agent -- structural organization without quality evaluation.
 *
 * Operates 4 techniques: mind-mapping, affinity-mapping, lotus-blossom,
 * storyboarding. Organizes ideas into structures (mind map, affinity
 * clusters, lotus blossom grid, storyboard) without filtering any idea
 * on quality grounds.
 */
export class Mapper extends TechniqueAgent {
  /** Techniques this agent is assigned to operate. */
  private static readonly ASSIGNED_TECHNIQUES: TechniqueId[] = [
    'mind-mapping',
    'affinity-mapping',
    'lotus-blossom',
    'storyboarding',
  ];

  constructor(engine: TechniqueEngine, rulesEngine: RulesEngine) {
    super('mapper', engine, rulesEngine);
  }

  /**
   * Return the 4 technique IDs this agent operates.
   */
  getAssignedTechniques(): TechniqueId[] {
    return [...Mapper.ASSIGNED_TECHNIQUES];
  }

  // ==========================================================================
  // Mind Mapping
  // ==========================================================================

  /**
   * Generate a mind map round: builds tree structure from ideas.
   *
   * Loads 'mind-mapping' technique, generates a round, emits to capture,
   * and returns ideas. All ideas get parent_id chains forming a tree
   * structure from the TechniqueEngine.
   */
  generateMindMap(session: SessionState, round_number: number): Idea[] {
    // Load fresh technique instance
    const instance = this.engine.loadTechnique('mind-mapping');

    // Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // Generate round output
    const output = instance.generateRound(round_number);

    // Extract ideas and emit to capture loop
    const ideas = output.ideas ?? [];
    for (const idea of ideas) {
      this.emitToCapture({
        agent: 'mapper',
        content_type: 'idea',
        content: idea,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    return ideas;
  }

  // ==========================================================================
  // Affinity Mapping
  // ==========================================================================

  /**
   * Organize existing ideas into affinity clusters.
   *
   * Takes ideas already in session -- does NOT generate new ideas.
   * Returns Cluster[] (2-8 clusters covering ALL input ideas).
   *
   * CONSTRAINT: Never reject or filter any idea during this process.
   * Every input idea MUST appear in exactly one cluster.
   *
   * Guarantees:
   * - Cluster count: 2-8 (if < 2 inputs: single "All Ideas" cluster)
   * - 100% idea placement: every idea_id from input appears in output
   * - No quality evaluation: all ideas treated equally regardless of content
   */
  organizeAffinity(ideas: Idea[], session: SessionState): Cluster[] {
    // Guard: no ideas to cluster
    if (ideas.length === 0) {
      return [];
    }

    // Load affinity-mapping technique instance
    const instance = this.engine.loadTechnique('affinity-mapping');

    // Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // Generate clustering round -- pass ideas as previous_output
    instance.generateRound(1, ideas);

    // Extract clusters from technique state
    const state = instance.getState();
    let clusters = (state.clusters as Cluster[]) ?? [];

    // Edge case: fewer than 2 clusters (e.g., 1 idea input)
    if (clusters.length < 2) {
      if (ideas.length === 1) {
        // Single idea: create one "All Ideas" cluster
        clusters = [{
          id: crypto.randomUUID(),
          label: 'All Ideas',
          idea_ids: [ideas[0].id],
        }];
      } else {
        // Multiple ideas but technique returned < 2 clusters:
        // split evenly into 2 clusters
        const mid = Math.ceil(ideas.length / 2);
        clusters = [
          {
            id: crypto.randomUUID(),
            label: 'Group 1',
            idea_ids: ideas.slice(0, mid).map(i => i.id),
          },
          {
            id: crypto.randomUUID(),
            label: 'Group 2',
            idea_ids: ideas.slice(mid).map(i => i.id),
          },
        ];
      }
    }

    // Enforce max 8 clusters: merge smallest clusters until <= 8
    while (clusters.length > 8) {
      // Find the two smallest clusters
      clusters.sort((a, b) => a.idea_ids.length - b.idea_ids.length);
      const smallest = clusters[0];
      const secondSmallest = clusters[1];

      // Merge smallest into second smallest
      secondSmallest.idea_ids.push(...smallest.idea_ids);
      secondSmallest.label = `${secondSmallest.label}, ${smallest.label}`;

      // Remove the smallest
      clusters = clusters.slice(1);
    }

    // Defensive: ensure every input idea appears in exactly one cluster
    const assignedIds = new Set<string>();
    for (const cluster of clusters) {
      for (const id of cluster.idea_ids) {
        assignedIds.add(id);
      }
    }

    // Find unassigned ideas and assign to the last cluster
    const unassigned = ideas.filter(i => !assignedIds.has(i.id));
    if (unassigned.length > 0 && clusters.length > 0) {
      const lastCluster = clusters[clusters.length - 1];
      for (const idea of unassigned) {
        lastCluster.idea_ids.push(idea.id);
      }
    }

    // Emit clusters to capture loop
    for (const cluster of clusters) {
      this.emitToCapture({
        agent: 'mapper',
        content_type: 'cluster',
        content: cluster,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    return clusters;
  }

  // ==========================================================================
  // Lotus Blossom
  // ==========================================================================

  /**
   * Generate a lotus blossom round: expand problem into 8 themes,
   * each with 8 ideas = 64 total.
   *
   * Loads 'lotus-blossom' technique, generates a round, emits to capture,
   * and returns ideas. Lotus blossom produces ideas organized into 8 themes.
   */
  generateLotusRound(session: SessionState, round_number: number): Idea[] {
    // Load fresh technique instance
    const instance = this.engine.loadTechnique('lotus-blossom');

    // Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // Generate round output
    const output = instance.generateRound(round_number);

    // Extract ideas and emit to capture loop
    const ideas = output.ideas ?? [];
    for (const idea of ideas) {
      this.emitToCapture({
        agent: 'mapper',
        content_type: 'idea',
        content: idea,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    return ideas;
  }

  // ==========================================================================
  // Storyboarding
  // ==========================================================================

  /**
   * Generate a storyboard round: sequences ideas into narrative cards.
   *
   * Loads 'storyboarding' technique, generates a round, emits to capture,
   * and returns ideas. Ideas have sequence_position metadata implicit
   * in their ordering (first idea = first card, etc.).
   */
  generateStoryboard(session: SessionState, round_number: number): Idea[] {
    // Load fresh technique instance
    const instance = this.engine.loadTechnique('storyboarding');

    // Initialize with problem context
    instance.initialize(session.problem_statement, session);

    // Generate round output
    const output = instance.generateRound(round_number);

    // Extract ideas and emit to capture loop
    const ideas = output.ideas ?? [];
    for (const idea of ideas) {
      this.emitToCapture({
        agent: 'mapper',
        content_type: 'idea',
        content: idea,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }

    return ideas;
  }

  // ==========================================================================
  // Behavioral constraint
  // ==========================================================================

  /**
   * Behavioral constraint: Mapper CANNOT evaluate idea quality.
   *
   * This method exists solely to document and enforce the constraint.
   * Any attempt to call it throws unconditionally. The Mapper organizes
   * ideas structurally without ever judging their quality.
   *
   * All ideas deserve placement. No idea is "too bad to organize."
   */
  evaluateIdeaQuality(): never {
    throw new Error('Mapper cannot evaluate idea quality -- behavioral constraint violation');
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new Mapper agent instance.
 *
 * Factory function following the project's functional API + class wrapper
 * pattern.
 */
export function createMapper(engine: TechniqueEngine, rulesEngine: RulesEngine): Mapper {
  return new Mapper(engine, rulesEngine);
}
