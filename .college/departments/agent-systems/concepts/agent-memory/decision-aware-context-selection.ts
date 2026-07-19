/**
 * Decision-Aware Context Selection -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agent-memory/decision-aware-context-selection
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 73 * 2 * Math.PI / 47;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const decisionAwareContextSelection: RosettaConcept = {
  id: "agent-decision-aware-context-selection",
  name: "Decision-Aware Context Selection",
  domain: 'agent-systems',
  description:
    "Ranking an agent's retrievable context — files, tests, traces, rules, prior memories — by embedding similarity optimizes the wrong target: cosine measures topical overlap, not whether a snippet will change what the agent does next. The 2026 finding (arXiv 2606.08151v2, 2026) reframes relevance as expected effect on the NEXT ACTION, scoring each candidate by how much it would shift the agent's immediate decision and compressing the survivors into typed, auditable memory cards (CICL). This exposes a failure mode of pure semantic retrieval: high-similarity, low-leverage context crowds out low-similarity items that actually flip a branch. Implication for agent systems: move the relevance score downstream of the decision boundary, and keep surviving cards typed so their influence stays inspectable rather than latent in a wall of concatenated text.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Consumes hybrid retrieval's lexical+dense fused candidate pool but replaces its final similarity ranking with an expected-effect-on-next-action score, refining what 'top result' means.",
    },
    {
      type: "cross-reference",
      targetId: "agent-intent-routing",
      description: "Both push relevance past raw similarity: intent routing selects the strategy by information need, decision-aware selection selects the context by its effect on the immediate action.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-consolidation",
      description: "The typed, auditable memory cards are the consolidation product — consolidation durably stores exactly the decision-selected winners this concept surfaces.",
    },
    {
      type: "analogy",
      targetId: "agent-counterfactual-utility",
      description: "Scoring a context item by how much it would shift the next action is a counterfactual-utility measure applied to retrieved context rather than to a skill's contribution.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
