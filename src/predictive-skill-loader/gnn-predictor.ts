/**
 * Predictive Skill Loader — GNN link-formation predictor.
 *
 * Implements a simple, dependency-free message-passing neural network over the
 * College-of-Knowledge adjacency map. Models the link-formation prediction
 * task from arXiv:2604.18888 (Mohammadiasl et al., EDM 2026): given the
 * current activation pattern over the social-learning-network, predict which
 * candidate-link (current-skill --> next-skill) is most likely to form next.
 *
 * Algorithm (per-call, no training step required):
 *
 *   1. Initialise node hidden state h_v(0):
 *      - 1.0 for current skill (the seed).
 *      - r_recency(v) for any v in `context.recentSkills` (recency decay).
 *      - 0 elsewhere.
 *
 *   2. For each hop t = 1..hops:
 *        m_v = sum over u in N(v) of edge(u, v) * h_u(t - 1)
 *        h_v(t) = (1 - decay) * h_v(t - 1) + decay * sigma(m_v)
 *      where sigma(x) = x / (1 + |x|) (rational soft-saturation).
 *
 *   3. Score(v) = h_v(hops) for all v. Drop the seed and any node already in
 *      `recentSkills`. Sort by score desc, break ties by id (deterministic).
 *
 *   4. Return top-K predictions, attaching the BFS hopDepth from the seed
 *      so the cache pre-warmer can prioritise direct neighbors first.
 *
 * This is the GNN analogue: nodes pass scalar messages along edges, gated by
 * a saturating non-linearity. We do NOT need a trainable weight matrix: edge
 * weights themselves carry learned co-activation strength (set by the College
 * concept relationships). Adding a weight matrix would mean storing
 * parameters, which is out of scope (no new deps). The math is a 1-channel
 * GAT-style gather + GRU-style update.
 *
 * @module predictive-skill-loader/gnn-predictor
 */

import { getNeighbors } from './college-graph.js';
import type {
  CollegeGraph,
  LinkFormationModel,
  LoadContext,
  SkillPrediction,
} from './types.js';

export interface GnnPredictorOptions {
  hops: number;
  decay: number;
  /** Recency decay base (0,1]; older skills get weight base^age. Default 0.7. */
  recencyDecay?: number;
}

/**
 * Build a LinkFormationModel from a CollegeGraph. The model is a
 * lightweight wrapper: it caches per-node bias keys (currently empty) and
 * stores the hops/decay so the caller doesn't need to pass them per call.
 */
export function buildLinkFormationModel(
  graph: CollegeGraph,
  opts: GnnPredictorOptions,
): LinkFormationModel {
  return {
    graph,
    bias: new Map<string, number>(),
    hops: Math.max(1, Math.floor(opts.hops)),
    decay: Math.min(1, Math.max(0, opts.decay)),
  };
}

function sigma(x: number): number {
  // Rational saturation: maps R -> (-1, 1), stable for large magnitudes.
  return x / (1 + Math.abs(x));
}

/**
 * Run one forward pass of the GNN message-passing layer and return ranked
 * SkillPredictions. Pure function: no model state mutated, no IO.
 */
export function predictLinks(
  model: LinkFormationModel,
  currentSkill: string,
  context: LoadContext,
  topK: number,
  recencyDecay = 0.7,
): SkillPrediction[] {
  const { graph, hops, decay } = model;
  if (graph.nodes.length === 0) return [];

  // Seed initial hidden state.
  const h = new Map<string, number>();
  for (const id of graph.nodes) h.set(id, 0);
  if (graph.adjacency.has(currentSkill)) {
    h.set(currentSkill, 1.0);
  }
  const recent = context.recentSkills ?? [];
  for (let i = 0; i < recent.length; i++) {
    const id = recent[i];
    if (id === undefined) continue;
    if (!graph.adjacency.has(id)) continue;
    if (id === currentSkill) continue;
    const w = Math.pow(recencyDecay, i + 1);
    const cur = h.get(id) ?? 0;
    h.set(id, Math.max(cur, w));
  }

  // Build a reverse-adjacency lookup once: incoming neighbors per node so we
  // can compute m_v = sum_{u in N_in(v)} edge(u, v) * h_u(t-1).
  const incoming = new Map<string, Array<readonly [string, number]>>();
  for (const u of graph.nodes) {
    const out = graph.adjacency.get(u) ?? [];
    for (const [v, w] of out) {
      const arr = incoming.get(v) ?? [];
      arr.push([u, w] as const);
      incoming.set(v, arr);
    }
  }

  // Iterate message-passing hops.
  let cur = new Map(h);
  for (let t = 1; t <= hops; t++) {
    const next = new Map<string, number>();
    for (const v of graph.nodes) {
      const inEdges = incoming.get(v) ?? [];
      let m = 0;
      for (const [u, w] of inEdges) {
        m += w * (cur.get(u) ?? 0);
      }
      const prev = cur.get(v) ?? 0;
      const updated = (1 - decay) * prev + decay * sigma(m);
      next.set(v, updated);
    }
    cur = next;
  }

  // Build BFS hop-depth lookup so the cache pre-warmer can prioritise
  // direct neighbors first independent of message magnitude.
  const reach = new Map<string, number>();
  if (graph.adjacency.has(currentSkill)) {
    const neigh = getNeighbors(graph, currentSkill, hops);
    for (const n of neigh) reach.set(n.id, n.hopDepth);
  }

  // Rank: drop seed and recent skills.
  const drop = new Set<string>([currentSkill, ...recent]);
  const candidates: Array<{ id: string; score: number; hopDepth: number }> = [];
  for (const id of graph.nodes) {
    if (drop.has(id)) continue;
    const score = cur.get(id) ?? 0;
    if (score <= 0) continue;
    candidates.push({
      id,
      score,
      hopDepth: reach.get(id) ?? hops + 1,
    });
  }
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.hopDepth !== b.hopDepth) return a.hopDepth - b.hopDepth;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const k = Math.max(1, Math.floor(topK));
  return candidates.slice(0, k).map((c) => ({
    skillId: c.id,
    score: clamp01(c.score),
    hopDepth: c.hopDepth,
    via: 'gnn' as const,
  }));
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x;
}
