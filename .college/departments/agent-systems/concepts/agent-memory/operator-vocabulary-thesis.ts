/**
 * Operator Vocabulary Thesis -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/operator-vocabulary-thesis
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 69 * 2 * Math.PI / 85;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const operatorVocabularyThesis: RosettaConcept = {
  id: "agent-operator-vocabulary-thesis",
  name: "Operator Vocabulary Thesis",
  domain: 'agent-systems',
  description:
    "Reasoning over a knowledge graph fails not because the LLM is too weak but because it lacks the right tools — the vocabulary of typed traversal and computation operators exposed to it. The Operator Vocabulary Thesis (arXiv 2606.06003) shows a small planner composing typed primitives beats bespoke per-query handlers and generalizes to unseen query classes, while some queries, such as multi-hop joins and aggregations, are structurally unreachable by vector retrieval regardless of embedding quality. For agent memory this reframes capability as a design choice about which typed operators you expose, not a model-scale problem.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Specializes hybrid vector-plus-graph retrieval by locating the graph side's power in the typed-operator vocabulary handed to the planner, and sharpens the split by arguing some query classes are structurally unreachable by the vector leg — so the hybrid is a necessity, not a convenience.",
    },
    {
      type: "cross-reference",
      targetId: "agent-query-aware-graph-traversal",
      description: "The typed traversal primitives this thesis exposes are exactly the query-conditioned graph-walk operators; answerable capability is bounded by how expressive that traversal vocabulary is rather than by model size.",
    },
    {
      type: "analogy",
      targetId: "agent-index-side-reasoning",
      description: "Both shift reasoning off the parametric model and onto structured machinery — here into a planner composing typed graph operators, mirroring the move of pushing inference work to the index rather than the weights.",
    },
    {
      type: "cross-reference",
      targetId: "agent-intention-graph-tool-discovery",
      description: "Shares the premise that an agent's reach is set by the tool and operator set available to it; enlarging the exposed operator vocabulary directly enlarges the space of queries the agent can answer.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
