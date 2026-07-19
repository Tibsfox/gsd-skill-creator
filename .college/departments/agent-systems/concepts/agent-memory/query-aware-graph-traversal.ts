/**
 * Query Aware Graph Traversal -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/query-aware-graph-traversal
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 73 * 2 * Math.PI / 85;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const queryAwareGraphTraversal: RosettaConcept = {
  id: "agent-query-aware-graph-traversal",
  name: "Query Aware Graph Traversal",
  domain: 'agent-systems',
  description:
    "Multi-hop graph-RAG walks a knowledge graph outward from seed nodes, but naive spreading activation follows the heaviest edges regardless of the question — activation collapses onto highly-connected hub nodes (a \"probability black hole\") and burns the retrieval budget on off-topic neighbors. The 2026 mechanism, relevance-gated spreading activation, conditions every traversal step on a single semantic score measured against the query, so activation flows only toward question-relevant neighbors. Keeping each hop query-aware rather than query-blind sharpens multi-hop precision in agent memory graphs and stops dependency chains from diluting the answer.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Specializes hybrid retrieval to the graph channel: rather than blending dense and sparse scores, it pushes the same query-conditioning inside multi-hop graph traversal, gating each spreading-activation hop by relevance to the question.",
    },
    {
      type: "cross-reference",
      targetId: "agent-adaptive-retrieval-stopping",
      description: "Both regulate the multi-hop retrieval walk from complementary angles — adaptive stopping decides WHEN to halt expansion, while query-aware traversal decides WHERE activation may flow; together they bound the walk's depth and breadth.",
    },
    {
      type: "analogy",
      targetId: "agent-hierarchical-memory-navigation",
      description: "Like hierarchical memory navigation, it steers a walk through a structured memory store by relevance rather than blind expansion, following only question-pertinent paths instead of the densest ones.",
    },
    {
      type: "cross-reference",
      targetId: "agent-answer-conditioned-information-gain",
      description: "Shares the query-conditioning principle: the per-hop semantic relevance gate scores a neighbor by its expected contribution to answering the query, the same signal answer-conditioned information gain uses to rank candidate retrievals.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
