/**
 * Prompt clustering orchestrator for semantic skill discovery.
 *
 * Chains embedding, epsilon tuning, DBSCAN clustering, labeling, and
 * cross-project merging into a single pipeline. Prompts are clustered
 * per-project first (with auto-tuned epsilon), then similar clusters
 * are merged across projects using centroid cosine similarity.
 *
 * Pipeline:
 * 1. Per-project: truncate -> embed (cached) -> tuneEpsilon -> DBSCAN -> label
 * 2. Cross-project: greedy merge of similar cluster centroids (>= 0.8)
 * 3. Sort by memberCount descending, cap at maxClusters
 *
 * Implements: CLUS-01 (prompt clustering), CLUS-02 (cross-project merge)
 */

import type { CollectedPrompt } from './prompt-collector.js';
import type { PromptCluster } from './cluster-scorer.js';
import type { PromptEmbeddingCache } from './prompt-embedding-cache.js';
import type { EmbeddingService } from '../embeddings/embedding-service.js';
import { dbscan, cosineDistance } from './dbscan.js';
import { tuneEpsilon } from './epsilon-tuner.js';

// ============================================================================
// Types
// ============================================================================

/** Options for the clustering pipeline */
export interface ClusterOptions {
  /** Minimum prompts per project to include in clustering (default: 10) */
  minPromptsPerProject?: number;
  /** Minimum points for DBSCAN core point (default: 3) */
  minPts?: number;
  /** Cosine similarity threshold for cross-project merge (default: 0.8) */
  mergeSimilarityThreshold?: number;
  /** Maximum clusters to return (default: 10) */
  maxClusters?: number;
  /** Batch size for embedding API calls (default: 64) */
  batchSize?: number;
}

/** Result of the clustering pipeline */
export interface ClusterResult {
  /** Discovered prompt clusters, sorted by memberCount descending */
  clusters: PromptCluster[];
  /** Project slugs that were skipped (below minimum prompt threshold) */
  skippedProjects: string[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_MIN_PROMPTS = 10;
const DEFAULT_MIN_PTS = 3;
const DEFAULT_MERGE_THRESHOLD = 0.8;
const DEFAULT_MAX_CLUSTERS = 10;
const DEFAULT_BATCH_SIZE = 64;
const MAX_LABEL_LENGTH = 100;
const MAX_EXAMPLE_PROMPTS = 3;
const MAX_PROMPT_WORDS = 200;

// ============================================================================
// clusterPrompts
// ============================================================================

/**
 * Run the full prompt clustering pipeline.
 *
 * @param promptsByProject - Prompts grouped by project slug
 * @param embeddingService - Service for generating embeddings
 * @param cache - Prompt embedding cache for avoiding re-computation
 * @param options - Pipeline configuration options
 * @returns Clusters and list of skipped projects
 */
export async function clusterPrompts(
  promptsByProject: Map<string, CollectedPrompt[]>,
  embeddingService: EmbeddingService,
  cache: PromptEmbeddingCache,
  options?: ClusterOptions,
): Promise<ClusterResult> {
  const minPrompts = options?.minPromptsPerProject ?? DEFAULT_MIN_PROMPTS;
  const minPts = options?.minPts ?? DEFAULT_MIN_PTS;
  const mergeThreshold = options?.mergeSimilarityThreshold ?? DEFAULT_MERGE_THRESHOLD;
  const maxClusters = options?.maxClusters ?? DEFAULT_MAX_CLUSTERS;
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;

  // Empty input
  if (promptsByProject.size === 0) {
    return { clusters: [], skippedProjects: [] };
  }

  const skippedProjects: string[] = [];
  const allClusters: PromptCluster[] = [];

  // ========================================================================
  // Phase 1: Per-project clustering
  // ========================================================================

  for (const [projectSlug, prompts] of promptsByProject) {
    // Skip projects below minimum threshold
    if (prompts.length < minPrompts) {
      skippedProjects.push(projectSlug);
      continue;
    }

    // 1. Truncate prompts to 200 words
    const truncatedTexts = prompts.map((p) => truncateToWords(p.text, MAX_PROMPT_WORDS));

    // 2. Get embeddings (from cache or compute)
    const embeddings = await getEmbeddings(
      truncatedTexts,
      embeddingService,
      cache,
      batchSize,
    );

    // 3. Auto-tune epsilon for this project
    const epsilon = tuneEpsilon(embeddings, minPts, cosineDistance);

    // 4. Run DBSCAN
    const dbscanResult = dbscan(embeddings, epsilon, minPts, cosineDistance);

    // 5. Build PromptCluster for each cluster
    for (const clusterIndices of dbscanResult.clusters) {
      const cluster = buildCluster(
        clusterIndices,
        embeddings,
        prompts,
        truncatedTexts,
        [projectSlug],
      );
      allClusters.push(cluster);
    }
  }

  // ========================================================================
  // Phase 2: Cross-project merge
  // ========================================================================

  const mergedClusters = mergeCrossProject(allClusters, mergeThreshold);

  // ========================================================================
  // Phase 3: Sort and cap
  // ========================================================================

  mergedClusters.sort((a, b) => b.memberCount - a.memberCount);
  const capped = mergedClusters.slice(0, maxClusters);

  // Save cache
  await cache.save();

  return { clusters: capped, skippedProjects };
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Truncate text to the first N words.
 */
function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ');
}

/**
 * Get embeddings for texts, using cache where available.
 * Embeds uncached texts in batches via the embedding service.
 */
async function getEmbeddings(
  texts: string[],
  service: EmbeddingService,
  cache: PromptEmbeddingCache,
  batchSize: number,
): Promise<number[][]> {
  const embeddings: (number[] | null)[] = new Array(texts.length).fill(null);
  const uncachedIndices: number[] = [];

  // Check cache for each text
  for (let i = 0; i < texts.length; i++) {
    const cached = cache.get(texts[i]);
    if (cached) {
      embeddings[i] = cached;
    } else {
      uncachedIndices.push(i);
    }
  }

  // Embed uncached texts in batches
  if (uncachedIndices.length > 0) {
    const uncachedTexts = uncachedIndices.map((i) => texts[i]);

    for (let batchStart = 0; batchStart < uncachedTexts.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, uncachedTexts.length);
      const batchTexts = uncachedTexts.slice(batchStart, batchEnd);

      const results = await service.embedBatch(batchTexts);

      // Store results and update cache
      for (let j = 0; j < results.length; j++) {
        const originalIndex = uncachedIndices[batchStart + j];
        embeddings[originalIndex] = results[j].embedding;
        cache.set(texts[originalIndex], results[j].embedding);
      }
    }
  }

  return embeddings as number[][];
}

/**
 * Build a PromptCluster from DBSCAN cluster indices.
 */
function buildCluster(
  indices: number[],
  embeddings: number[][],
  prompts: CollectedPrompt[],
  truncatedTexts: string[],
  projectSlugs: string[],
): PromptCluster {
  // Compute centroid (element-wise mean of member embeddings)
  const centroid = computeCentroid(indices.map((i) => embeddings[i]));

  // Find prompts nearest to centroid
  const distancesToCentroid = indices.map((i) => ({
    index: i,
    distance: cosineDistance(embeddings[i], centroid),
  }));
  distancesToCentroid.sort((a, b) => a.distance - b.distance);

  // Label = nearest prompt text, truncated
  const nearestIdx = distancesToCentroid[0].index;
  const rawLabel = truncatedTexts[nearestIdx];
  const label = rawLabel.length > MAX_LABEL_LENGTH
    ? rawLabel.slice(0, MAX_LABEL_LENGTH)
    : rawLabel;

  // Example prompts = top 3 nearest to centroid
  const examplePrompts = distancesToCentroid
    .slice(0, MAX_EXAMPLE_PROMPTS)
    .map((d) => truncatedTexts[d.index]);

  // Collect timestamps
  const timestamps = indices.map((i) => prompts[i].timestamp);

  // Compute coherence: mean similarity to centroid (1 - mean distance)
  const meanDistance = distancesToCentroid.reduce((sum, d) => sum + d.distance, 0) / distancesToCentroid.length;
  const coherence = Math.max(0, 1 - meanDistance);

  return {
    label,
    examplePrompts,
    centroid,
    memberCount: indices.length,
    projectSlugs: [...projectSlugs],
    timestamps,
    coherence,
  };
}

/**
 * Compute the element-wise mean (centroid) of a set of vectors.
 */
function computeCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    return [];
  }

  const dim = vectors[0].length;
  const centroid = new Array<number>(dim).fill(0);

  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += vec[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= vectors.length;
  }

  return centroid;
}

/**
 * Greedy cross-project merge of similar clusters.
 *
 * Repeatedly finds the highest-similarity pair of clusters (by centroid
 * cosine similarity), merges if >= threshold, and re-checks remaining.
 */
function mergeCrossProject(
  clusters: PromptCluster[],
  threshold: number,
): PromptCluster[] {
  if (clusters.length <= 1) {
    return [...clusters];
  }

  // Work with a mutable copy
  const working = clusters.map((c) => ({ ...c }));

  let merged = true;
  while (merged) {
    merged = false;
    let bestSim = -1;
    let bestI = -1;
    let bestJ = -1;

    // Find highest-similarity pair
    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        // Only merge clusters from different projects (or multi-project clusters)
        const sim = 1 - cosineDistance(working[i].centroid, working[j].centroid);
        if (sim >= threshold && sim > bestSim) {
          bestSim = sim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    if (bestI >= 0 && bestJ >= 0) {
      // Merge bestJ into bestI
      const a = working[bestI];
      const b = working[bestJ];

      // Determine which is larger (for label selection)
      const labelSource = a.memberCount >= b.memberCount ? a : b;

      // Union projectSlugs
      const slugSet = new Set([...a.projectSlugs, ...b.projectSlugs]);

      // Recompute centroid as weighted mean
      const totalMembers = a.memberCount + b.memberCount;
      const newCentroid = new Array<number>(a.centroid.length).fill(0);
      for (let d = 0; d < a.centroid.length; d++) {
        newCentroid[d] =
          (a.centroid[d] * a.memberCount + b.centroid[d] * b.memberCount) / totalMembers;
      }

      // Merge coherence as weighted average
      const mergedCoherence =
        (a.coherence * a.memberCount + b.coherence * b.memberCount) / totalMembers;

      // Merge into bestI
      working[bestI] = {
        label: labelSource.label,
        examplePrompts: labelSource.examplePrompts,
        centroid: newCentroid,
        memberCount: totalMembers,
        projectSlugs: [...slugSet],
        timestamps: [...a.timestamps, ...b.timestamps],
        coherence: mergedCoherence,
      };

      // Remove bestJ
      working.splice(bestJ, 1);
      merged = true;
    }
  }

  return working;
}
