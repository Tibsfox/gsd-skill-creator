/**
 * Affinity Mapping visual brainstorming technique.
 *
 * UNIQUE behavior: organizes EXISTING ideas into clusters rather than
 * generating new ones. Operates on previous_output (Idea[]) and returns
 * Cluster[] via visualization data. The Mapper agent uses this during
 * the Organize phase.
 *
 * Cluster count is always clamped between 2 and 8 (enforced).
 * Returns empty ideas[] -- clusters are communicated via visualization
 * and stored in internal state for the Mapper agent to read.
 *
 * Uses natural.TfIdf for content-based clustering with a fallback
 * to even splitting when TfIdf is unavailable.
 *
 * Only imports from ../../shared/types.js, ../engine.js, and 'natural'.
 * No imports from den/, vtm/, knowledge/.
 */

import { randomUUID } from 'node:crypto';
import natural from 'natural';

import type {
  TechniqueConfig,
  TechniqueId,
  SessionState,
  Idea,
  Question,
  Cluster,
} from '../../shared/types.js';

import type { TechniqueInstance, TechniqueOutput, VisualizationData } from '../engine.js';

// ============================================================================
// Configuration
// ============================================================================

const AFFINITY_MAPPING_CONFIG: TechniqueConfig = {
  id: 'affinity-mapping',
  name: 'Affinity Mapping',
  category: 'visual',
  description: 'Sort existing ideas into natural groupings, find themes, and label clusters.',
  default_duration_ms: 900_000,
  min_duration_ms: 300_000,
  max_duration_ms: 1_800_000,
  required_agents: ['mapper'],
  optional_agents: [],
  valid_phases: ['organize'],
  osborn_rules: [],
  parameters: {
    min_clusters: 2,
    max_clusters: 8,
    generation_context:
      'Sort the provided ideas into natural groupings. Find themes. Label each cluster with a descriptive name. All ideas deserve placement -- do not discard any. Generate between 2 and 8 clusters.',
  },
};

// ============================================================================
// Clustering helpers
// ============================================================================

/**
 * Clamp a number between min and max (inclusive).
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute pairwise TF-IDF similarity between ideas and group into clusters.
 *
 * Uses natural.TfIdf to build a document-term matrix, then groups ideas
 * with high term overlap. Falls back to even splitting on error.
 */
function clusterWithTfIdf(
  ideas: Idea[],
  min_clusters: number,
  max_clusters: number,
): Cluster[] {
  try {
    const tfidf = new natural.TfIdf();

    // Add each idea as a document
    for (const idea of ideas) {
      tfidf.addDocument(idea.content);
    }

    // Build term vectors for each document
    const vectors: Map<number, Map<string, number>> = new Map();
    for (let i = 0; i < ideas.length; i++) {
      const terms = new Map<string, number>();
      tfidf.listTerms(i).forEach((item: { term: string; tfidf: number }) => {
        terms.set(item.term, item.tfidf);
      });
      vectors.set(i, terms);
    }

    // Simple greedy clustering: assign each idea to the most similar existing cluster
    const target_clusters = clamp(
      Math.ceil(ideas.length / 5),
      min_clusters,
      max_clusters,
    );

    // Initialize cluster seeds
    const cluster_assignments: number[] = new Array(ideas.length).fill(-1);
    const cluster_centroids: Array<Map<string, number>> = [];

    // Seed clusters with evenly spaced ideas
    const step = Math.max(1, Math.floor(ideas.length / target_clusters));
    for (let c = 0; c < target_clusters; c++) {
      const seed_idx = Math.min(c * step, ideas.length - 1);
      cluster_assignments[seed_idx] = c;
      cluster_centroids.push(new Map(vectors.get(seed_idx) ?? []));
    }

    // Assign remaining ideas to the closest centroid
    for (let i = 0; i < ideas.length; i++) {
      if (cluster_assignments[i] !== -1) continue;

      const idea_terms = vectors.get(i) ?? new Map<string, number>();
      let best_cluster = 0;
      let best_sim = -1;

      for (let c = 0; c < cluster_centroids.length; c++) {
        const centroid = cluster_centroids[c];
        let dot = 0;
        let norm_a = 0;
        let norm_b = 0;

        for (const [term, weight] of idea_terms) {
          const cw = centroid.get(term) ?? 0;
          dot += weight * cw;
          norm_a += weight * weight;
        }
        for (const [, weight] of centroid) {
          norm_b += weight * weight;
        }

        const sim = (norm_a > 0 && norm_b > 0)
          ? dot / (Math.sqrt(norm_a) * Math.sqrt(norm_b))
          : 0;

        if (sim > best_sim) {
          best_sim = sim;
          best_cluster = c;
        }
      }

      cluster_assignments[i] = best_cluster;
    }

    // Build clusters from assignments
    const cluster_map = new Map<number, Idea[]>();
    for (let i = 0; i < ideas.length; i++) {
      const c = cluster_assignments[i];
      if (!cluster_map.has(c)) {
        cluster_map.set(c, []);
      }
      cluster_map.get(c)!.push(ideas[i]);
    }

    // Generate cluster labels from most significant terms
    const clusters: Cluster[] = [];
    for (const [cluster_idx, cluster_ideas] of cluster_map) {
      // Find the most common significant terms across ideas in this cluster
      const term_freq = new Map<string, number>();
      for (const idea of cluster_ideas) {
        const idea_idx = ideas.indexOf(idea);
        const terms = vectors.get(idea_idx) ?? new Map<string, number>();
        for (const [term, weight] of terms) {
          if (term.length > 2 && weight > 0) {
            term_freq.set(term, (term_freq.get(term) ?? 0) + weight);
          }
        }
      }

      // Sort terms by cumulative weight, take top 2-3 for label
      const top_terms = [...term_freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([term]) => term);

      const label = top_terms.length > 0
        ? top_terms.join(', ')
        : `Cluster ${cluster_idx + 1}`;

      clusters.push({
        id: randomUUID(),
        label,
        idea_ids: cluster_ideas.map(i => i.id),
        theme: label,
      });
    }

    return clusters;
  } catch {
    // Fallback: split evenly
    return fallbackClustering(ideas, min_clusters, max_clusters);
  }
}

/**
 * Fallback clustering: split ideas evenly into clusters.
 *
 * Used when TfIdf is unavailable or throws.
 */
function fallbackClustering(
  ideas: Idea[],
  min_clusters: number,
  max_clusters: number,
): Cluster[] {
  const num_clusters = clamp(
    Math.ceil(ideas.length / 5),
    min_clusters,
    max_clusters,
  );

  const clusters: Cluster[] = [];
  const chunk_size = Math.ceil(ideas.length / num_clusters);

  for (let c = 0; c < num_clusters; c++) {
    const start = c * chunk_size;
    const end = Math.min(start + chunk_size, ideas.length);
    const chunk = ideas.slice(start, end);

    if (chunk.length > 0) {
      clusters.push({
        id: randomUUID(),
        label: `Cluster ${c + 1}`,
        idea_ids: chunk.map(i => i.id),
        theme: `Group ${c + 1}`,
      });
    }
  }

  return clusters;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Affinity Mapping technique instance.
 *
 * CRITICAL: This technique organizes EXISTING ideas from previous_output.
 * It does NOT generate new ideas. If previous_output is undefined or empty,
 * returns empty TechniqueOutput with a prompt message.
 *
 * Cluster count is always between 2 and 8 (enforced via clamp).
 * Completes after first successful clustering pass (one pass is sufficient).
 */
export class AffinityMappingTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'affinity-mapping';
  readonly config: TechniqueConfig = AFFINITY_MAPPING_CONFIG;

  private clusters: Cluster[] = [];
  private is_complete_flag = false;
  private start_time = 0;

  /**
   * Initialize with problem context. Resets internal state.
   */
  initialize(_problem: string, _session: SessionState): void {
    this.clusters = [];
    this.is_complete_flag = false;
    this.start_time = Date.now();
  }

  /**
   * Organize previous_output ideas into clusters.
   *
   * previous_output is REQUIRED. If undefined or empty, returns empty
   * TechniqueOutput with a prompt asking for generative technique first.
   *
   * Uses TF-IDF similarity for clustering with fallback to even splitting.
   * Returns empty ideas[] and populates visualization field.
   */
  generateRound(
    round_number: number,
    previous_output?: Idea[] | Question[],
  ): TechniqueOutput {
    const params = this.config.parameters as Record<string, unknown>;
    const min_clusters = params.min_clusters as number;
    const max_clusters = params.max_clusters as number;

    // Filter to only Idea objects (have source_agent field, unlike Question)
    const ideas: Idea[] = previous_output
      ? (previous_output as Array<Idea | Question>).filter(
          (item): item is Idea => 'source_agent' in item,
        )
      : [];

    // Guard: no ideas to cluster
    if (ideas.length === 0) {
      return {
        ideas: [],
        prompts: ['No ideas to cluster -- run a generative technique first'],
        metadata: {
          round: round_number,
          technique: this.id,
          duration_ms: Date.now() - this.start_time,
        },
      };
    }

    // Cluster the ideas
    this.clusters = clusterWithTfIdf(ideas, min_clusters, max_clusters);

    // Build ideas lookup for visualization labels
    const ideas_map = new Map<string, Idea>();
    for (const idea of ideas) {
      ideas_map.set(idea.id, idea);
    }

    // Build visualization with cluster hierarchy
    const visualization: VisualizationData = {
      type: 'clusters',
      nodes: this.clusters.flatMap(c =>
        c.idea_ids.map(id => ({
          id,
          label: ideas_map.get(id)?.content ?? id,
          parent_id: c.id,
        })),
      ),
    };

    // Mark complete after first successful pass
    this.is_complete_flag = true;

    return {
      ideas: [],
      visualization,
      metadata: {
        round: round_number,
        technique: this.id,
        duration_ms: Date.now() - this.start_time,
      },
    };
  }

  /**
   * Return technique-specific internal state.
   */
  getState(): Record<string, unknown> {
    return {
      cluster_count: this.clusters.length,
      clusters: this.clusters,
      is_complete: this.is_complete_flag,
      elapsed_ms: Date.now() - this.start_time,
    };
  }

  /**
   * Complete after first clustering pass.
   */
  isComplete(): boolean {
    return this.is_complete_flag;
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a fresh AffinityMappingTechnique instance.
 *
 * Used by the TechniqueEngine registry for lazy instantiation.
 */
export function createAffinityMappingTechnique(): TechniqueInstance {
  return new AffinityMappingTechnique();
}
