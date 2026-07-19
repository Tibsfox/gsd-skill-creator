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
    "Reasoning over a knowledge graph fails not because the LLM is too weak but because it lacks the right tools — the vocabulary of typed traversal and computation operators exposed to it. The Operator Vocabulary Thesis (arXiv 2606.06003) tests this on a 46-node knowledge graph with 64 typed edges over 23 queries spanning 10 intent categories, and finds five query classes structurally unreachable by vector retrieval regardless of embedding quality. An LLM query planner given 9 typed traversal primitives beats bespoke per-query handlers (F1 0.632 vs 0.472) while generalizing to unseen queries; adding 6 graph-computation tools, the planner selectively adopts them for exactly the categories where traversal alone fails. A secondary caution: entity-level F1 systematically underscores structural queries whose comprehensive answers are actually correct, so operator-based reasoning can be undervalued by a naive metric. This lives in the agent-memory wing because it treats memory-as-graph reasoning — capability is a design choice about which typed operators you expose over stored knowledge, not a model-scale problem.",
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
