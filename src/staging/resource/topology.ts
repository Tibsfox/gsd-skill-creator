/**
 * Topology recommender for the resource analysis pipeline.
 *
 * Analyzes a VisionAnalysis to recommend the best agent/team topology
 * (single, pipeline, map-reduce, router, hybrid) with rationale,
 * confidence, and agent count. Pure function, no I/O, deterministic.
 *
 * @module staging/resource/topology
 */

import type {
  VisionAnalysis,
  TopologyRecommendation,
  TopologyType,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Topology preference order: simpler topologies preferred for ties. */
const TOPOLOGY_PREFERENCE: TopologyType[] = [
  'single',
  'pipeline',
  'map-reduce',
  'router',
  'hybrid',
];

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Score the 'single' topology.
 * Starts high and penalized by requirements, complexity, and dependencies.
 */
function scoreSingle(analysis: VisionAnalysis): number {
  const { requirements, complexity, dependencies } = analysis;
  let score = 1.0;

  // Penalty: -0.3 per requirement above 2
  const extraReqs = Math.max(0, requirements.length - 2);
  score -= extraReqs * 0.3;

  // Penalty: -0.2 per complexity signal above 1
  const extraSignals = Math.max(0, complexity.length - 1);
  score -= extraSignals * 0.2;

  // Penalty: -0.1 per external dependency
  score -= dependencies.length * 0.1;

  return Math.max(0, score);
}

/**
 * Score the 'pipeline' topology.
 * Favors sequential multi-stage work with external integrations.
 */
function scorePipeline(analysis: VisionAnalysis): number {
  const { requirements, complexity, dependencies } = analysis;
  let score = 0.0;

  // Boost: +0.4 if complexity signals include 'multi-phase'
  if (complexity.some((c) => c.signal === 'multi-phase')) {
    score += 0.4;
  }

  // Boost: +0.2 per requirement above 2 (up to +0.6)
  const extraReqs = Math.max(0, requirements.length - 2);
  score += Math.min(extraReqs * 0.2, 0.6);

  // Boost: +0.1 per external dependency (sequential integrations)
  score += dependencies.length * 0.1;

  return Math.min(1.0, score);
}

/**
 * Score the 'map-reduce' topology.
 * Favors independent parallel subtasks in different domains.
 */
function scoreMapReduce(analysis: VisionAnalysis): number {
  const { requirements, complexity } = analysis;
  let score = 0.0;

  // Count distinct categories
  const categories = new Set(requirements.map((r) => r.category));

  // Boost: +0.3 if >= 3 requirements with different categories
  if (categories.size >= 3) {
    score += 0.3;
  }

  // Boost: +0.2 if no 'multi-phase' or 'cross-cutting' complexity signals (independence)
  // Only applies when there are actual requirements to parallelize
  const hasSequential = complexity.some(
    (c) => c.signal === 'multi-phase' || c.signal === 'cross-cutting',
  );
  if (!hasSequential && requirements.length > 0) {
    score += 0.2;
  }

  // Boost: +0.1 per requirement above 3
  const extraReqs = Math.max(0, requirements.length - 3);
  score += extraReqs * 0.1;

  return Math.min(1.0, score);
}

/**
 * Score the 'router' topology.
 * Favors classification/routing work spanning many categories.
 */
function scoreRouter(analysis: VisionAnalysis): number {
  const { requirements, complexity } = analysis;
  let score = 0.0;

  // Count distinct categories
  const categories = new Set(requirements.map((r) => r.category));

  // Boost: +0.5 if requirements span 3+ different categories (specialization needed)
  if (categories.size >= 3) {
    score += 0.5;
  }

  // Boost: +0.2 if complexity includes 'cross-cutting'
  if (complexity.some((c) => c.signal === 'cross-cutting')) {
    score += 0.2;
  }

  return Math.min(1.0, score);
}

/**
 * Score the 'hybrid' topology.
 * Favors complex mixed work with both sequential and parallel signals.
 */
function scoreHybrid(analysis: VisionAnalysis): number {
  const { requirements, complexity, overallComplexity } = analysis;
  let score = 0.0;

  // Boost: +0.4 if overallComplexity is 'high' or 'critical'
  if (overallComplexity === 'high' || overallComplexity === 'critical') {
    score += 0.4;
  }

  // Boost: +0.4 if both sequential and parallel signals present (mixed pattern)
  const hasSequential = complexity.some((c) => c.signal === 'multi-phase');
  const hasParallel = complexity.some(
    (c) => c.signal === 'cross-cutting' || c.signal === 'external-integration',
  );
  if (hasSequential && hasParallel) {
    score += 0.4;
  }

  // Boost: +0.15 per requirement above 4
  const extraReqs = Math.max(0, requirements.length - 4);
  score += extraReqs * 0.15;

  return Math.min(1.5, score);
}

// ============================================================================
// Agent Count
// ============================================================================

/**
 * Derive agent count from topology and analysis.
 */
function deriveAgentCount(
  topology: TopologyType,
  analysis: VisionAnalysis,
): number {
  const { requirements } = analysis;
  const categories = new Set(requirements.map((r) => r.category));

  switch (topology) {
    case 'single':
      return 1;
    case 'pipeline':
      return Math.min(Math.max(requirements.length, 2), 4);
    case 'map-reduce':
      return Math.min(categories.size + 1, 5);
    case 'router':
      return Math.min(Math.max(categories.size, 2), 4);
    case 'hybrid':
      return Math.min(Math.max(requirements.length, 3), 5);
  }
}

// ============================================================================
// Rationale Generation
// ============================================================================

/** Human-readable topology labels. */
const TOPOLOGY_LABELS: Record<TopologyType, string> = {
  single: 'Single agent',
  pipeline: 'Pipeline',
  'map-reduce': 'Map-reduce',
  router: 'Router',
  hybrid: 'Hybrid',
};

/**
 * Generate a rationale string explaining the recommendation.
 */
function generateRationale(
  topology: TopologyType,
  analysis: VisionAnalysis,
  scores: Record<TopologyType, number>,
): string {
  const { requirements, complexity, dependencies, overallComplexity } = analysis;
  const label = TOPOLOGY_LABELS[topology];
  const parts: string[] = [];

  switch (topology) {
    case 'single':
      parts.push(`${label} recommended`);
      if (requirements.length <= 2) {
        parts.push(`${requirements.length} requirement${requirements.length !== 1 ? 's' : ''}`);
      }
      if (complexity.length === 0) {
        parts.push('no complexity signals');
      }
      if (overallComplexity === 'low') {
        parts.push('low overall complexity');
      }
      break;

    case 'pipeline':
      parts.push(`${label} recommended`);
      parts.push(`${requirements.length} sequential requirements`);
      if (complexity.some((c) => c.signal === 'multi-phase')) {
        parts.push('multi-phase complexity signal');
      }
      if (dependencies.length > 0) {
        parts.push(`${dependencies.length} external integration${dependencies.length !== 1 ? 's' : ''}`);
      }
      break;

    case 'map-reduce': {
      const cats = new Set(requirements.map((r) => r.category));
      parts.push(`${label} recommended`);
      parts.push(`${cats.size} distinct domain categories`);
      parts.push(`${requirements.length} independent requirements`);
      break;
    }

    case 'router': {
      const cats = new Set(requirements.map((r) => r.category));
      parts.push(`${label} recommended`);
      parts.push(`${cats.size} specialist categories`);
      if (complexity.some((c) => c.signal === 'cross-cutting')) {
        parts.push('cross-cutting complexity');
      }
      break;
    }

    case 'hybrid':
      parts.push(`${label} recommended`);
      parts.push(`${overallComplexity} overall complexity`);
      parts.push(`${requirements.length} requirements`);
      if (complexity.length > 0) {
        const signalNames = complexity.map((c) => c.signal).join(', ');
        parts.push(`signals: ${signalNames}`);
      }
      break;
  }

  return parts.join(': ').replace(/: /, ': ').replace(/: /g, ', ').replace(',', ':');
}

// ============================================================================
// Team Suggestion
// ============================================================================

/**
 * Suggest a team template name if agentCount > 1.
 */
function suggestTeam(topology: TopologyType, agentCount: number): string | undefined {
  if (agentCount <= 1) return undefined;

  switch (topology) {
    case 'pipeline':
      return 'pipeline-team';
    case 'map-reduce':
      return 'map-reduce-team';
    case 'router':
      return 'router-team';
    case 'hybrid':
      return 'hybrid-team';
    default:
      return undefined;
  }
}

// ============================================================================
// Main Recommender
// ============================================================================

/**
 * Recommend an execution topology based on vision analysis.
 *
 * Scores all five topology types, selects the highest-scoring one
 * (ties broken by simplicity preference), computes confidence from
 * scoring clarity and ambiguity markers, and derives agent count.
 *
 * @param analysis - Complete vision analysis result
 * @returns Topology recommendation with rationale and confidence
 */
export function recommendTopology(
  analysis: VisionAnalysis,
): TopologyRecommendation {
  // Score each topology
  const scores: Record<TopologyType, number> = {
    single: scoreSingle(analysis),
    pipeline: scorePipeline(analysis),
    'map-reduce': scoreMapReduce(analysis),
    router: scoreRouter(analysis),
    hybrid: scoreHybrid(analysis),
  };

  // Select winner: highest score, ties broken by preference order (simpler first)
  let winner: TopologyType = 'single';
  let winnerScore = scores.single;

  for (const topology of TOPOLOGY_PREFERENCE) {
    if (scores[topology] > winnerScore) {
      winner = topology;
      winnerScore = scores[topology];
    }
  }

  // Confidence: winner's score normalized against sum of all scores
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  let confidence: number;

  if (totalScore === 0) {
    // No scores at all (empty analysis) -> perfect confidence in default
    confidence = 1.0;
  } else {
    confidence = winnerScore / totalScore;
  }

  // Reduce confidence by ambiguity marker count (0.05 penalty per marker, min 0.3)
  const ambiguityPenalty = analysis.ambiguities.length * 0.05;
  confidence = Math.max(0.3, confidence - ambiguityPenalty);

  // Round to 2 decimal places
  confidence = Math.round(confidence * 100) / 100;

  // Derive agent count
  const agentCount = deriveAgentCount(winner, analysis);

  // Generate rationale
  const rationale = generateRationale(winner, analysis, scores);

  // Team suggestion
  const teamSuggestion = suggestTeam(winner, agentCount);

  const result: TopologyRecommendation = {
    topology: winner,
    rationale,
    confidence,
    agentCount,
  };

  if (teamSuggestion) {
    result.teamSuggestion = teamSuggestion;
  }

  return result;
}
