/**
 * Intention Graph Tool Discovery -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/intention-graph-tool-discovery
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 61 * 2 * Math.PI / 85;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const intentionGraphToolDiscovery: RosettaConcept = {
  id: "agent-intention-graph-tool-discovery",
  name: "Intention Graph Tool Discovery",
  domain: 'agent-systems',
  description:
    "Agents working over large, open-world tool inventories must surface the few relevant tools, but one-shot retrieval over isolated tool descriptions ignores that task intent keeps evolving as the agent decomposes goals, observes results, and induces subgoals. SING (arXiv 2606.16591) builds an intention-tool graph linking three node types — user intentions, tool capabilities, and tool collaboration patterns — and continuously updates it, then matches candidate tools against this evolving structure instead of a static query embedding. This reframes tool discovery as an active, context-tracking process: it improves recall in inventories too large to fit in context and re-scopes selection as the plan unfolds, rather than committing to one retrieval pass at the start. Over a unified 7,471-tool corpus across three real-world tool-use benchmarks, SING lifts Global Recall@5 by up to 59.8% and downstream success rate by up to 28.9% while reducing full-corpus tool-schema exposure by 99.8% — that context-efficiency figure is the point, since it makes thousand-tool ecosystems queryable without paying to inject every schema.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-intent-routing",
      description: "Specializes intent routing: rather than classifying a query once to pick a retrieval strategy, it maintains an evolving intention graph and continuously routes open-world tool discovery against the agent's changing task intent across decomposition and observations.",
    },
    {
      type: "cross-reference",
      targetId: "agent-goal-state-inference",
      description: "The intention graph functions as a running estimate of the agent's evolving goal state, decomposition, and induced subgoals — the same signal goal-state inference formalizes — and here it becomes the matching key for tool retrieval.",
    },
    {
      type: "cross-reference",
      targetId: "agent-query-aware-graph-traversal",
      description: "Both replace flat similarity retrieval with graph structure that guides matching; the difference is that this graph encodes the agent's evolving task intent instead of a static corpus or memory index to be traversed.",
    },
    {
      type: "analogy",
      targetId: "agent-causal-tool-frontier",
      description: "A sibling open-world tool-discovery approach that scopes which tools are reachable from the current state; complementary to matching tools against an evolving intention graph, since both narrow a large inventory to a task-relevant working set.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
