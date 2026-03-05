import { readFileSync } from 'fs';
import { join } from 'path';
import type { ClusterId, OperationType } from './sequence-recorder.js';

/**
 * 6D capability vector matching Lex's profiling dimensions.
 */
export interface CapabilityVector {
  rigor: number;
  creativity: number;
  observation: number;
  synthesis: number;
  qualityGating: number;
  interfaceDesign: number;
}

/** Routing recommendation from the advisor */
export interface RoutingAdvice {
  /** Recommended cluster for this task */
  cluster: ClusterId;
  /** Confidence in recommendation [0, 1] */
  confidence: number;
  /** Human-readable explanation */
  reason: string;
  /** Best agent suggestions (sorted by fitness) */
  suggestedAgents: string[];
}

/** Cluster capability profiles — centroids from Lex's HDBSCAN analysis */
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

/** Capability vectors from Lex's Batch 1 profiling (source of truth for vector data) */
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

/** Load agent roster and clusters from agent-positions.csv */
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

      if (vector) {
        profiles[agentName] = { vector, cluster: clusterStr };
      }
    }
  } catch (err) {
    // Fallback to hardcoded profiles if CSV not found
    for (const [name, vector] of Object.entries(CAPABILITY_VECTORS)) {
      profiles[name] = {
        vector,
        cluster: inferClusterFromName(name),
      };
    }
  }

  return profiles;
}

/** Infer cluster from agent name if CSV loading fails */
function inferClusterFromName(name: string): ClusterId {
  if (['cedar', 'foxy'].includes(name)) return 'creative-nexus';
  if (['willow', 'sam', 'gsd-orchestrator', 'gsd-planner', 'observer', 'codebase-navigator', 'changelog-generator'].includes(name)) return 'bridge-zone';
  return 'rigor-spine'; // hemlock, lex, gsd-executor, gsd-verifier, photon, doc-linter
}

const AGENT_PROFILES = loadAgentProfiles();

/**
 * Cosine similarity between two capability vectors.
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

  // Score individual agents within the best cluster, plus nearby agents
  const agentScores = Object.entries(AGENT_PROFILES)
    .map(([name, { vector }]) => ({
      name,
      similarity: cosineSimilarity(taskRequirements, vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const topAgents = agentScores.slice(0, 3).map(a => a.name);
  const topScore = agentScores[0];

  // Build human-readable reason
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

  // L2: full detail
  return `ROUTING: cluster=${advice.cluster} confidence=${advice.confidence.toFixed(2)}\n` +
    `Agents: ${advice.suggestedAgents.join(', ')}\n` +
    advice.reason;
}

function clusterLabel(id: ClusterId): string {
  const labels: Record<ClusterId, string> = {
    'creative-nexus': 'Creative Nexus',
    'bridge-zone': 'Bridge Zone',
    'rigor-spine': 'Rigor Spine',
  };
  return labels[id];
}

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
