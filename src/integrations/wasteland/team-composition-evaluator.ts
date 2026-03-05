/**
 * Team Composition Evaluator — Layer 2, Wave 2
 *
 * Scores team compositions by computing the union of capability vectors
 * and measuring coverage against task requirements. Detects skill gaps,
 * evaluates historical co-activation, and applies confidence thresholds.
 */

import type {
  CapabilityVector,
  ClusterResult,
  TeamScore,
} from './types.js';

import { cosineSimilarity } from './agent-profiler.js';

// ============================================================================
// Team Scoring
// ============================================================================

/**
 * Compute the union of multiple capability vectors.
 * For each dimension, takes the maximum value across all members.
 */
export function vectorUnion(vectors: CapabilityVector[]): Record<string, number> {
  const union: Record<string, number> = {};
  for (const vec of vectors) {
    for (const [key, val] of Object.entries(vec.dimensions)) {
      union[key] = Math.max(union[key] ?? 0, val);
    }
  }
  return union;
}

/**
 * Compute coverage score: how well a team's union covers the task requirements.
 * Returns value in [0, 1] where 1 = perfect coverage.
 */
export function coverageScore(
  teamUnion: Record<string, number>,
  requirements: Record<string, number>,
): number {
  const reqKeys = Object.keys(requirements);
  if (reqKeys.length === 0) return 1.0;

  let covered = 0;
  let total = 0;

  for (const [key, required] of Object.entries(requirements)) {
    const available = teamUnion[key] ?? 0;
    total += required;
    covered += Math.min(available, required);
  }

  return total > 0 ? covered / total : 0;
}

/**
 * Compute redundancy score: how much overlap exists in team capabilities.
 * Higher redundancy = more wasted capability overlap.
 * Returns value in [0, 1] where 0 = no redundancy.
 */
export function redundancyScore(vectors: CapabilityVector[]): number {
  if (vectors.length < 2) return 0;

  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      totalSimilarity += cosineSimilarity(vectors[i].dimensions, vectors[j].dimensions);
      pairs++;
    }
  }

  return pairs > 0 ? totalSimilarity / pairs : 0;
}

/**
 * Detect skill gaps: required dimensions not sufficiently covered by team.
 */
export function detectGaps(
  teamUnion: Record<string, number>,
  requirements: Record<string, number>,
  threshold: number = 0.3,
): string[] {
  const gaps: string[] = [];
  for (const [key, required] of Object.entries(requirements)) {
    const available = teamUnion[key] ?? 0;
    if (available < required * threshold) {
      gaps.push(key);
    }
  }
  return gaps;
}

/**
 * Score a team composition against task requirements.
 * Overall score = coverage * (1 - redundancy) with confidence weighting.
 */
export function scoreTeam(
  teamId: string,
  members: CapabilityVector[],
  requirements: Record<string, number>,
  confidenceThreshold: number = 0.7,
): TeamScore {
  const union = vectorUnion(members);
  const coverage = coverageScore(union, requirements);
  const redundancy = redundancyScore(members);
  const gaps = detectGaps(union, requirements);

  // Gap score: 1 = no gaps, 0 = all gaps
  const gapScore = Object.keys(requirements).length > 0
    ? 1 - (gaps.length / Object.keys(requirements).length)
    : 1;

  // Overall: weighted combination
  const overall = coverage * 0.5 + gapScore * 0.3 + (1 - redundancy) * 0.2;

  // Confidence: based on team size and data quality
  const avgTasks = members.reduce((s, m) => s + m.totalTasks, 0) / members.length;
  const confidence = Math.min(1, avgTasks / 20); // 20+ tasks = full confidence

  return {
    teamId,
    members: members.map(m => m.agentId),
    coverageScore: coverage,
    gapScore,
    redundancyScore: redundancy,
    overallScore: overall,
    gaps,
    confidence: Math.min(confidence, overall >= confidenceThreshold ? confidence : confidence * 0.5),
  };
}

// ============================================================================
// Team Formation
// ============================================================================

/**
 * Suggest team compositions from available agents and clusters.
 * Picks one representative per cluster to maximize coverage.
 */
export function suggestTeams(
  clusters: ClusterResult[],
  allVectors: Map<string, CapabilityVector>,
  requirements: Record<string, number>,
  maxTeamSize: number = 5,
  topN: number = 3,
): TeamScore[] {
  const teams: TeamScore[] = [];

  // Strategy 1: One from each cluster (best coverage)
  if (clusters.length > 0) {
    const teamMembers: CapabilityVector[] = [];
    for (const cluster of clusters.slice(0, maxTeamSize)) {
      // Pick the member closest to centroid
      let bestMember: CapabilityVector | null = null;
      let bestDist = Infinity;
      for (const agentId of cluster.members) {
        const vec = allVectors.get(agentId);
        if (vec) {
          const sim = cosineSimilarity(vec.dimensions, cluster.centroid);
          const dist = 1 - sim;
          if (dist < bestDist) {
            bestDist = dist;
            bestMember = vec;
          }
        }
      }
      if (bestMember) {
        teamMembers.push(bestMember);
      }
    }
    if (teamMembers.length > 0) {
      teams.push(scoreTeam(`team-cross-cluster-0`, teamMembers, requirements));
    }
  }

  // Strategy 2: Top performers by success rate
  const sorted = Array.from(allVectors.values())
    .sort((a, b) => b.successRate - a.successRate);
  const topPerformers = sorted.slice(0, maxTeamSize);
  if (topPerformers.length > 0) {
    teams.push(scoreTeam(`team-top-performers-0`, topPerformers, requirements));
  }

  // Strategy 3: Coverage-maximizing greedy
  const remaining = new Set(allVectors.keys());
  const greedyTeam: CapabilityVector[] = [];
  while (greedyTeam.length < maxTeamSize && remaining.size > 0) {
    let bestAgent: string | null = null;
    let bestScore = -1;
    for (const agentId of remaining) {
      const vec = allVectors.get(agentId)!;
      const candidate = [...greedyTeam, vec];
      const union = vectorUnion(candidate);
      const score = coverageScore(union, requirements);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }
    if (bestAgent) {
      greedyTeam.push(allVectors.get(bestAgent)!);
      remaining.delete(bestAgent);
    } else {
      break;
    }
  }
  if (greedyTeam.length > 0) {
    teams.push(scoreTeam(`team-greedy-coverage-0`, greedyTeam, requirements));
  }

  // Sort by overall score and return top N
  teams.sort((a, b) => b.overallScore - a.overallScore);
  return teams.slice(0, topN);
}
