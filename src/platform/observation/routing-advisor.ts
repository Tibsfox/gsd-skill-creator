/**
 * routing-advisor.ts — Pattern Intelligence: Capability-Based Task Routing
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * RoutingAdvisor takes a task's required capability vector (6 dimensions) and
 * recommends the best cluster and specific agents to handle that task. It uses
 * cosine similarity to match task requirements against cluster centroids and
 * individual agent capability profiles.
 *
 * WHY CAPABILITY-BASED ROUTING
 * -----------------------------
 * Not all agents are equally suited to all tasks. A task requiring high rigor
 * and quality gating should not be routed to a creative-nexus agent that excels
 * at synthesis but has low rigor. Routing by capability reduces capability-gap
 * risk before it occurs.
 *
 * This is Hemlock's approach from CENTERCAMP-PERSONAL-JOURNAL:
 * "It is better to spend an hour validating the foundation than weeks fixing the collapse."
 * Routing correctly at the start prevents capability-gap failures mid-task.
 *
 * THE 6-DIMENSIONAL CAPABILITY SPACE
 * ------------------------------------
 * Each agent and cluster centroid is represented as a vector in 6 dimensions:
 *   rigor         — precision, standards adherence, accuracy focus
 *   creativity    — exploration, novel approaches, synthesis
 *   observation   — pattern recognition, system awareness, monitoring
 *   synthesis     — integration, connecting disparate ideas, holistic thinking
 *   qualityGating — checking, validation, review, sign-off
 *   interfaceDesign — UX, communication clarity, boundary design
 *
 * These 6 dimensions were profiled during Batch 1 by Lex's capability vector analysis.
 * They cover the primary axes of work variation observed in the agent ecosystem.
 *
 * The vectors in CAPABILITY_VECTORS are the source of truth from Batch 1 profiling.
 * They should be updated as agents demonstrate different capability profiles over time.
 *
 * CLUSTER CENTROIDS
 * -----------------
 * CLUSTER_PROFILES represents the average capability of each cluster:
 *   creative-nexus: high creativity (0.63), synthesis (0.83), observation (0.75)
 *   bridge-zone:    high interface design (0.73), moderate creativity (0.68)
 *   rigor-spine:    very high rigor (0.93), quality gating (0.90), low creativity (0.08)
 *
 * These centroids capture the qualitative character of each cluster.
 * The math confirms the intuition: rigor-spine and creative-nexus are maximally
 * different (their cosine similarity is very low), which is why direct transitions
 * between them are dangerous.
 *
 * COSINE SIMILARITY
 * -----------------
 * adviseRouting() uses cosine similarity to match a task's requirement vector
 * against cluster centroids, then against individual agents.
 *
 * Why cosine? Because we care about the *direction* of capability, not its magnitude.
 * An agent with rigor=0.95 and a task requiring rigor=1.0 are well-aligned even if
 * the magnitudes differ. Cosine similarity captures this angle-based alignment.
 *
 * Formula: cosine(a, b) = (a · b) / (|a| * |b|)
 * Range: [-1, 1], but all capability values are [0, 1] so output is [0, 1].
 * 1.0 = perfect alignment, 0.0 = orthogonal (unrelated capabilities).
 *
 * CSV LOADING
 * -----------
 * loadAgentProfiles() attempts to read agent-positions.csv from .planning/
 * and merge cluster assignments with the hardcoded CAPABILITY_VECTORS.
 *
 * This enables the cluster map to be updated from Batch 1's analysis output
 * without modifying the code. If the CSV doesn't exist (e.g., new setup),
 * the fallback uses inferClusterFromName() based on known agent names.
 *
 * The CSV loading is intentionally fault-tolerant: a missing or malformed CSV
 * falls back to the hardcoded inference rules without error. This ensures
 * adviseRouting() always works even in a fresh environment.
 *
 * DISCLOSURE LEVELS
 * -----------------
 * formatRoutingAdvice() provides three disclosure levels (L0, L1, L2):
 *
 *   L0: "This looks like a good fit for lex." (plain recommendation)
 *   L1: "Recommended: Rigor Spine (78%). Try: lex, hemlock, gsd-verifier."
 *   L2: Full vector analysis with similarity scores and dominant dimension.
 *
 * This mirrors ClusterTranslator's disclosure model: match the detail level
 * to the audience's technical background.
 *
 * DOMINANT DIMENSION
 * ------------------
 * dominantDimension() finds the highest-valued dimension in a task requirement
 * vector, used to generate the human-readable reason in routing advice:
 * "Task emphasizes rigor." This makes the recommendation explainable without
 * requiring the caller to understand vector math.
 *
 * KNOWN LIMITATION
 * ----------------
 * CAPABILITY_VECTORS and CLUSTER_PROFILES are hardcoded with Batch 1 values.
 * They should be loaded from a config file or updated via a calibration process.
 * See BATCH-3-RETROSPECTIVE.md, Architectural recommendations:
 * "Agent profile loading from config: routing-advisor.ts still has hardcoded profiles.
 * Should load from agent-positions.csv. Single source of truth."
 *
 * @see ClusterTranslator (cluster-translator.ts) — translates post-transition risk
 *   signals; this module advises before transitions happen
 * @see PatternAnalyzer (pattern-analyzer.ts) — identifies cluster reassignments
 *   based on observed behavior; complements this proactive routing
 * @see BATCH-3-RETROSPECTIVE.md — architectural recommendation on CSV loading
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Hemlock: Check the Foundation" on why
 *   routing correctly matters
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { ClusterId, OperationType } from './sequence-recorder.js';

/**
 * 6D capability vector matching Lex's profiling dimensions.
 * All values are normalized [0, 1]. Higher = stronger in that dimension.
 */
export interface CapabilityVector {
  rigor: number;
  creativity: number;
  observation: number;
  synthesis: number;
  qualityGating: number;
  interfaceDesign: number;
}

/**
 * Routing recommendation from the advisor.
 * Includes the recommended cluster, confidence, human-readable reason,
 * and top-3 agent suggestions sorted by cosine similarity to task requirements.
 */
export interface RoutingAdvice {
  /** Recommended cluster for this task */
  cluster: ClusterId;
  /** Confidence in recommendation [0, 1] — cosine similarity to cluster centroid */
  confidence: number;
  /** Human-readable explanation including dominant dimension and top agent */
  reason: string;
  /** Best agent suggestions (sorted by fitness) */
  suggestedAgents: string[];
}

/**
 * Cluster capability profiles — centroids from Lex's HDBSCAN analysis (Batch 1).
 * These values represent the average capability of agents in each cluster.
 *
 * Key characteristics by cluster:
 * - creative-nexus: observation+synthesis dominant, low quality-gating
 * - bridge-zone: interface-design dominant, balanced other dimensions
 * - rigor-spine: rigor+quality-gating dominant, minimal creativity
 *
 * Update these values when cluster membership changes significantly.
 */
const CLUSTER_PROFILES: Record<ClusterId, CapabilityVector> = {
  'creative-nexus': {
    rigor: 0.33, creativity: 0.63, observation: 0.75,
    synthesis: 0.83, qualityGating: 0.25, interfaceDesign: 0.45,
  },
  'bridge-zone': {
    rigor: 0.35, creativity: 0.68, observation: 0.58,
    synthesis: 0.58, qualityGating: 0.23, interfaceDesign: 0.73,
  },
  'rigor-spine': {
    rigor: 0.93, creativity: 0.08, observation: 0.65,
    synthesis: 0.35, qualityGating: 0.90, interfaceDesign: 0.18,
  },
};

/**
 * Individual capability vectors from Lex's Batch 1 profiling.
 * Source of truth for agent capability data.
 *
 * These should ideally be loaded from agent-positions.csv rather than hardcoded.
 * See BATCH-3-RETROSPECTIVE.md architectural recommendations for the migration path.
 *
 * Extreme values are intentional — they reflect actual agent specialization:
 * - photon: rigor=1.00, creativity=0.05 (pure measurement, no exploration)
 * - foxy: creativity=0.95, rigor=0.15 (pure exploration, minimal structure)
 * - lex: rigor=0.95, creativity=0.05 (mirror of photon in rigor-spine)
 */
const CAPABILITY_VECTORS: Record<string, CapabilityVector> = {
  cedar:   { rigor: 0.50, creativity: 0.30, observation: 0.95, synthesis: 0.80, qualityGating: 0.40, interfaceDesign: 0.30 },
  hemlock: { rigor: 0.90, creativity: 0.10, observation: 0.70, synthesis: 0.40, qualityGating: 0.95, interfaceDesign: 0.20 },
  lex:     { rigor: 0.95, creativity: 0.05, observation: 0.60, synthesis: 0.30, qualityGating: 0.85, interfaceDesign: 0.15 },
  sam:     { rigor: 0.40, creativity: 0.75, observation: 0.65, synthesis: 0.60, qualityGating: 0.25, interfaceDesign: 0.50 },
  willow:  { rigor: 0.30, creativity: 0.60, observation: 0.50, synthesis: 0.55, qualityGating: 0.20, interfaceDesign: 0.95 },
  foxy:    { rigor: 0.15, creativity: 0.95, observation: 0.55, synthesis: 0.85, qualityGating: 0.10, interfaceDesign: 0.60 },
  'gsd-orchestrator': { rigor: 0.70, creativity: 0.40, observation: 0.60, synthesis: 0.55, qualityGating: 0.65, interfaceDesign: 0.50 },
  'gsd-planner':      { rigor: 0.75, creativity: 0.50, observation: 0.65, synthesis: 0.70, qualityGating: 0.70, interfaceDesign: 0.55 },
  'gsd-executor':     { rigor: 0.80, creativity: 0.20, observation: 0.55, synthesis: 0.45, qualityGating: 0.85, interfaceDesign: 0.25 },
  'gsd-verifier':     { rigor: 0.95, creativity: 0.10, observation: 0.70, synthesis: 0.40, qualityGating: 0.95, interfaceDesign: 0.20 },
  photon:             { rigor: 1.00, creativity: 0.05, observation: 0.50, synthesis: 0.20, qualityGating: 0.90, interfaceDesign: 0.10 },
  observer:           { rigor: 0.40, creativity: 0.50, observation: 0.90, synthesis: 0.60, qualityGating: 0.30, interfaceDesign: 0.40 },
  'codebase-navigator': { rigor: 0.70, creativity: 0.45, observation: 0.75, synthesis: 0.65, qualityGating: 0.55, interfaceDesign: 0.50 },
  'doc-linter':       { rigor: 0.85, creativity: 0.15, observation: 0.65, synthesis: 0.40, qualityGating: 0.90, interfaceDesign: 0.30 },
  'changelog-generator': { rigor: 0.65, creativity: 0.40, observation: 0.60, synthesis: 0.55, qualityGating: 0.60, interfaceDesign: 0.45 },
};

/**
 * Load agent roster and cluster assignments from agent-positions.csv.
 * Merges CSV cluster data with hardcoded CAPABILITY_VECTORS.
 *
 * Falls back to inferClusterFromName() if CSV is missing or malformed.
 * This ensures the advisor always works, even in fresh environments without
 * Batch 1 analysis outputs.
 *
 * CSV format expected: name, x, y, z, w, cluster (header line skipped).
 *
 * @param csvPath - Optional custom path to CSV. Defaults to .planning/agent-positions.csv
 */
function loadAgentProfiles(csvPath?: string): Record<string, { vector: CapabilityVector; cluster: ClusterId }> {
  const profiles: Record<string, { vector: CapabilityVector; cluster: ClusterId }> = {};

  try {
    const basePath = csvPath || join(process.cwd(), '.planning', 'agent-positions.csv');
    const content = readFileSync(basePath, 'utf-8');
    const lines = content.trim().split('\n').slice(1); // skip header

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',');
      if (parts.length < 6) continue;

      const agentName = parts[0].trim();
      const clusterStr = parts[5].trim() as ClusterId;
      const vector = CAPABILITY_VECTORS[agentName];

      // Only include agents we have capability vectors for
      if (vector) {
        profiles[agentName] = { vector, cluster: clusterStr };
      }
    }
  } catch (err) {
    // CSV not found or malformed — fall back to hardcoded inference
    for (const [name, vector] of Object.entries(CAPABILITY_VECTORS)) {
      profiles[name] = {
        vector,
        cluster: inferClusterFromName(name),
      };
    }
  }

  return profiles;
}

/**
 * Infer cluster from agent name when CSV is unavailable.
 * Uses the 6-muse assignment plus GSD agent assignments from Batch 1.
 *
 * This is a fallback, not the source of truth. The CSV is preferred.
 */
function inferClusterFromName(name: string): ClusterId {
  if (['cedar', 'foxy'].includes(name)) return 'creative-nexus';
  if (['willow', 'sam', 'gsd-orchestrator', 'gsd-planner', 'observer', 'codebase-navigator', 'changelog-generator'].includes(name)) return 'bridge-zone';
  return 'rigor-spine'; // hemlock, lex, gsd-executor, gsd-verifier, photon, doc-linter
}

/** Agent profiles loaded at module initialization. Shared across all adviseRouting() calls. */
const AGENT_PROFILES = loadAgentProfiles();

/**
 * Cosine similarity between two capability vectors.
 * Returns 0 if either vector has zero magnitude (prevents division by zero).
 * Range: [0, 1] since all capability values are non-negative.
 *
 * This is the core matching function: how aligned is this agent/cluster
 * with the task's capability requirements?
 */
function cosineSimilarity(a: CapabilityVector, b: CapabilityVector): number {
  const keys: (keyof CapabilityVector)[] = [
    'rigor', 'creativity', 'observation', 'synthesis', 'qualityGating', 'interfaceDesign',
  ];
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    dot += a[k] * b[k];
    magA += a[k] * a[k];
    magB += b[k] * b[k];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Recommend the best cluster and agents for a task based on
 * required capability vector. Specific cluster matches are
 * evaluated before falling back to nearest-centroid.
 *
 * Steps:
 *   1. Score each cluster centroid against task requirements (cosine similarity)
 *   2. Select the highest-scoring cluster as the recommendation
 *   3. Score all individual agents (across all clusters) against requirements
 *   4. Select top-3 agents as suggestions
 *   5. Build human-readable reason with dominant dimension
 *
 * Note: suggested agents are not filtered to the recommended cluster.
 * The highest-similarity agents may be from any cluster. This provides
 * flexibility: if the best agent is from a different cluster, the caller
 * can decide whether to follow the agent or the cluster recommendation.
 *
 * @param taskRequirements - The capability vector the task needs
 * @returns Routing recommendation with cluster, confidence, reason, and agents
 */
export function adviseRouting(taskRequirements: CapabilityVector): RoutingAdvice {
  // Score each cluster centroid against task requirements
  const clusterScores = (Object.entries(CLUSTER_PROFILES) as [ClusterId, CapabilityVector][])
    .map(([cluster, profile]) => ({
      cluster,
      similarity: cosineSimilarity(taskRequirements, profile),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const best = clusterScores[0];

  // Score all individual agents — not filtered to recommended cluster
  const agentScores = Object.entries(AGENT_PROFILES)
    .map(([name, { vector }]) => ({
      name,
      similarity: cosineSimilarity(taskRequirements, vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const topAgents = agentScores.slice(0, 3).map(a => a.name);
  const topScore = agentScores[0];

  // Build human-readable reason — dominant dimension explains the recommendation
  const dominantDim = dominantDimension(taskRequirements);
  const reason = `Task emphasizes ${dominantDim}. ` +
    `Best cluster: ${clusterLabel(best.cluster)} (similarity: ${best.similarity.toFixed(2)}). ` +
    `Top agent: ${topScore.name} (similarity: ${topScore.similarity.toFixed(2)}).`;

  return {
    cluster: best.cluster,
    confidence: best.similarity,
    reason,
    suggestedAgents: topAgents,
  };
}

/**
 * Format routing advice for display at the given disclosure level.
 *
 * L0: Simple agent suggestion (plain English)
 * L1: Cluster + confidence % + top agents
 * L2: Full detail with vector analysis
 */
export function formatRoutingAdvice(advice: RoutingAdvice, level: 'L0' | 'L1' | 'L2'): string {
  if (level === 'L0') {
    return `This looks like a good fit for ${advice.suggestedAgents[0] ?? 'the team'}.`;
  }

  if (level === 'L1') {
    return `Recommended: ${clusterLabel(advice.cluster)} ` +
      `(confidence ${(advice.confidence * 100).toFixed(0)}%). ` +
      `Try: ${advice.suggestedAgents.join(', ')}.`;
  }

  // L2: full detail for debugging and analysis
  return `ROUTING: cluster=${advice.cluster} confidence=${advice.confidence.toFixed(2)}\n` +
    `Agents: ${advice.suggestedAgents.join(', ')}\n` +
    advice.reason;
}

/** Map ClusterId to display name for human-readable output. */
function clusterLabel(id: ClusterId): string {
  const labels: Record<ClusterId, string> = {
    'creative-nexus': 'Creative Nexus',
    'bridge-zone': 'Bridge Zone',
    'rigor-spine': 'Rigor Spine',
  };
  return labels[id];
}

/**
 * Find the dominant dimension in a capability vector.
 * Returns the name of the highest-valued dimension.
 * Used to generate the "Task emphasizes X" text in routing reasons.
 *
 * Ties go to the first dimension with the maximum value (insertion order).
 * Returns 'balance' if all values are 0 (degenerate input).
 */
function dominantDimension(v: CapabilityVector): string {
  const dims: [keyof CapabilityVector, string][] = [
    ['rigor', 'rigor'], ['creativity', 'creativity'], ['observation', 'observation'],
    ['synthesis', 'synthesis'], ['qualityGating', 'quality gating'], ['interfaceDesign', 'interface design'],
  ];
  let max = 0;
  let label = 'balance';
  for (const [key, name] of dims) {
    if (v[key] > max) { max = v[key]; label = name; }
  }
  return label;
}
