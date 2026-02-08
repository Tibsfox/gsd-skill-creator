/**
 * Cluster-specific scoring and candidate ranking for semantic clustering.
 *
 * Scores cluster candidates using a 4-factor formula separate from tool
 * pattern scoring: size (log-scaled), cross-project breadth, coherence
 * (mean intra-cluster similarity), and recency (exponential decay with
 * 14-day half-life). Weights emphasize coherence and cross-project
 * (0.30 each) over size and recency (0.20 each).
 *
 * Also provides cluster name generation (kebab-case slug from natural
 * language label), description generation, and full candidate ranking
 * pipeline with deduplication against existing skills.
 */

import type { ExistingSkill } from './candidate-ranker.js';
import { extractKeywords, jaccardSimilarity } from './text-utils.js';

// ============================================================================
// Types
// ============================================================================

/** A prompt cluster from the semantic clustering pipeline */
export interface PromptCluster {
  label: string;
  examplePrompts: string[];
  centroid: number[];
  memberCount: number;
  projectSlugs: string[];
  timestamps: string[];
  coherence: number; // Mean similarity to centroid (0-1, higher is more cohesive)
}

/** Individual factor scores for a single cluster */
export interface ClusterScoreBreakdown {
  size: number;
  crossProject: number;
  coherence: number;
  recency: number;
}

/** Combined score and per-factor breakdown for a cluster */
export interface ClusterScore {
  score: number;
  breakdown: ClusterScoreBreakdown;
}

/** Configurable weights for the cluster scoring formula */
export interface ClusterScoringWeights {
  size: number;         // default 0.20
  crossProject: number; // default 0.30
  coherence: number;    // default 0.30
  recency: number;      // default 0.20
}

/** A scored and ranked cluster candidate */
export interface ClusterCandidate {
  label: string;
  suggestedName: string;
  suggestedDescription: string;
  clusterSize: number;
  coherence: number;
  score: number;
  scoreBreakdown: ClusterScoreBreakdown;
  examplePrompts: string[];
  evidence: {
    projects: string[];
    promptCount: number;
    lastSeen: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

/** Default cluster scoring weights (must sum to 1.0) */
export const DEFAULT_CLUSTER_WEIGHTS: ClusterScoringWeights = {
  size: 0.20,
  crossProject: 0.30,
  coherence: 0.30,
  recency: 0.20,
};

/** Recency half-life in days for exponential decay */
const RECENCY_HALF_LIFE_DAYS = 14;

/** ln(2) used in exponential decay calculation */
const LN2 = 0.693;

/** Milliseconds per day */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Maximum words in a cluster name slug */
const MAX_SLUG_WORDS = 5;

/** Default Jaccard similarity threshold for deduplication */
const DEFAULT_DEDUP_THRESHOLD = 0.5;

// ============================================================================
// scoreCluster
// ============================================================================

/**
 * Score a cluster using four weighted factors.
 *
 * Factors:
 * 1. **Size** - log2-scaled cluster size relative to total prompts
 * 2. **Cross-project** - fraction of total projects this cluster spans
 * 3. **Coherence** - mean intra-cluster similarity (passed through directly)
 * 4. **Recency** - exponential decay from most recent timestamp (14-day half-life)
 *
 * @param clusterSize - Number of prompts in the cluster
 * @param totalPrompts - Total prompts across all clusters
 * @param projectCount - Number of projects this cluster spans
 * @param totalProjects - Total unique projects in the corpus
 * @param meanIntraSimilarity - Mean pairwise similarity within cluster [0, 1]
 * @param mostRecentTimestamp - Epoch ms of most recent prompt in cluster
 * @param now - Current time in epoch ms
 * @returns Combined score in [0, 1] and per-factor breakdown
 */
export function scoreCluster(
  clusterSize: number,
  totalPrompts: number,
  projectCount: number,
  totalProjects: number,
  meanIntraSimilarity: number,
  mostRecentTimestamp: number,
  now: number,
): ClusterScore {
  // 1. Size: log2-scaled relative to total prompts
  const size = totalPrompts > 0
    ? Math.min(1, Math.log2(clusterSize + 1) / Math.log2(totalPrompts + 1))
    : 0;

  // 2. Cross-project: fraction of total projects
  const crossProject = totalProjects > 0
    ? projectCount / totalProjects
    : 0;

  // 3. Coherence: passed through directly (already in [0, 1])
  const coherence = meanIntraSimilarity;

  // 4. Recency: exponential decay from most recent timestamp
  let recency = 0;
  if (mostRecentTimestamp > 0) {
    const daysSince = (now - mostRecentTimestamp) / MS_PER_DAY;
    recency = Math.exp(-LN2 * daysSince / RECENCY_HALF_LIFE_DAYS);
  }

  // Weighted sum
  const score =
    DEFAULT_CLUSTER_WEIGHTS.size * size +
    DEFAULT_CLUSTER_WEIGHTS.crossProject * crossProject +
    DEFAULT_CLUSTER_WEIGHTS.coherence * coherence +
    DEFAULT_CLUSTER_WEIGHTS.recency * recency;

  return {
    score,
    breakdown: { size, crossProject, coherence, recency },
  };
}

// ============================================================================
// generateClusterName
// ============================================================================

/**
 * Generate a kebab-case slug from a natural language cluster label.
 *
 * - Splits on whitespace, lowercases, filters stopwords
 * - Takes first 5 significant words
 * - Joins with hyphens
 */
export function generateClusterName(label: string): string {
  const keywords = extractKeywords(label);
  const words = Array.from(keywords).slice(0, MAX_SLUG_WORDS);
  return words.join('-');
}

// ============================================================================
// generateClusterDescription
// ============================================================================

/**
 * Generate a brief description from the cluster label for SKILL.md frontmatter.
 *
 * Returns: `Guides workflow when: {label (truncated to 100 chars)}`
 */
export function generateClusterDescription(label: string): string {
  const truncated = label.length > 100 ? label.slice(0, 100) : label;
  return `Guides workflow when: ${truncated}`;
}

// ============================================================================
// rankClusterCandidates
// ============================================================================

/**
 * Rank prompt clusters into scored, evidence-rich cluster candidates.
 *
 * Pipeline:
 * 1. Score each cluster via scoreCluster()
 * 2. Generate name and description from label
 * 3. Build ClusterCandidate with evidence
 * 4. Sort by score descending
 * 5. Deduplicate against existing skills (Jaccard, threshold 0.5)
 *
 * @param clusters - Prompt clusters from semantic clustering
 * @param totalPrompts - Total prompts across all clusters
 * @param totalProjects - Total unique projects in the corpus
 * @param existingSkills - Existing skills to deduplicate against
 * @param now - Current time in epoch ms (defaults to Date.now())
 * @returns Sorted, deduplicated cluster candidates
 */
export function rankClusterCandidates(
  clusters: PromptCluster[],
  totalPrompts: number,
  totalProjects: number,
  existingSkills: ExistingSkill[],
  now?: number,
): ClusterCandidate[] {
  const currentTime = now ?? Date.now();

  const candidates: ClusterCandidate[] = [];

  for (const cluster of clusters) {
    // Find most recent timestamp
    let mostRecentTs = 0;
    for (const ts of cluster.timestamps) {
      const parsed = new Date(ts).getTime();
      if (!isNaN(parsed) && parsed > mostRecentTs) {
        mostRecentTs = parsed;
      }
    }

    // Find last seen ISO string
    let lastSeen = '';
    if (mostRecentTs > 0) {
      lastSeen = new Date(mostRecentTs).toISOString();
    }

    // Coherence: mean similarity to cluster centroid (computed in buildCluster)
    const coherence = cluster.coherence;

    const { score, breakdown } = scoreCluster(
      cluster.memberCount,
      totalPrompts,
      cluster.projectSlugs.length,
      totalProjects,
      coherence,
      mostRecentTs,
      currentTime,
    );

    const suggestedName = generateClusterName(cluster.label);
    const suggestedDescription = generateClusterDescription(cluster.label);

    candidates.push({
      label: cluster.label,
      suggestedName,
      suggestedDescription,
      clusterSize: cluster.memberCount,
      coherence,
      score,
      scoreBreakdown: breakdown,
      examplePrompts: cluster.examplePrompts,
      evidence: {
        projects: [...cluster.projectSlugs].sort(),
        promptCount: cluster.memberCount,
        lastSeen,
      },
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Deduplicate against existing skills
  if (existingSkills.length > 0) {
    const { filtered } = deduplicateClusterCandidates(
      candidates,
      existingSkills,
      DEFAULT_DEDUP_THRESHOLD,
    );
    return filtered;
  }

  return candidates;
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Deduplicate cluster candidates against existing skills.
 *
 * Uses exact name match (case-insensitive) and Jaccard keyword similarity.
 * Minimum-results guarantee: if ALL removed, return all as filtered.
 */
function deduplicateClusterCandidates(
  candidates: ClusterCandidate[],
  existingSkills: ExistingSkill[],
  threshold: number,
): { filtered: ClusterCandidate[]; removed: ClusterCandidate[] } {
  if (existingSkills.length === 0) {
    return { filtered: [...candidates], removed: [] };
  }

  const filtered: ClusterCandidate[] = [];
  const removed: ClusterCandidate[] = [];

  for (const candidate of candidates) {
    let matched = false;

    for (const existing of existingSkills) {
      // 1. Exact name match (case-insensitive)
      if (candidate.suggestedName.toLowerCase() === existing.name.toLowerCase()) {
        matched = true;
        break;
      }

      // 2. Keyword overlap (Jaccard similarity)
      const candidateKeywords = extractKeywords(
        candidate.suggestedName + ' ' + candidate.suggestedDescription,
      );
      const existingKeywords = extractKeywords(
        existing.name + ' ' + existing.description,
      );
      const jaccard = jaccardSimilarity(candidateKeywords, existingKeywords);

      if (jaccard >= threshold) {
        matched = true;
        break;
      }
    }

    if (matched) {
      removed.push(candidate);
    } else {
      filtered.push(candidate);
    }
  }

  // Minimum-results guarantee: if all removed, return all as filtered
  if (filtered.length === 0 && removed.length > 0) {
    return { filtered: candidates.map(c => ({ ...c })), removed: [] };
  }

  return { filtered, removed };
}

// extractKeywords and jaccardSimilarity are now imported from text-utils.js
