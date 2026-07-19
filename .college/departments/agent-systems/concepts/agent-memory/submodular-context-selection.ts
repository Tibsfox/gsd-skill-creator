/**
 * Submodular Context Selection -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/submodular-context-selection
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 80 * 2 * Math.PI / 85;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const submodularContextSelection: RosettaConcept = {
  id: "agent-submodular-context-selection",
  name: "Submodular Context Selection",
  domain: 'agent-systems',
  description:
    "Agents overflow their context window and default to recency truncation — dropping the oldest turns — which silently discards early-established facts (a constraint, a user preference, a schema) that the current query still needs. The 2026 mechanism casts per-turn context packing as submodular maximization: score candidate turns, memory entries, and tool outputs with a set function that rewards query relevance while penalizing redundancy (diminishing returns), then greedily fill the token budget for a (1−1/e)-approximate subset. Coverage-and-diversity selection beats topic-blind truncation whenever the answer depends on non-recent context.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-memory-consolidation",
      description: "Consolidation decides which experiences persist into long-term memory; this specializes it into the read-side budget packer that chooses, each turn, which consolidated entries plus live turns and tool outputs actually enter the working context window under a token budget.",
    },
    {
      type: "cross-reference",
      targetId: "agent-decision-aware-context-selection",
      description: "A sibling context-window selector operating at the same packing step: this one optimizes a submodular relevance-plus-diversity objective, while decision-aware selection scores items by their effect on the pending decision — different objective functions for the same budgeted subset problem.",
    },
    {
      type: "analogy",
      targetId: "agent-answer-conditioned-information-gain",
      description: "Both value a candidate by its marginal contribution rather than its standalone score; submodularity's diminishing-returns property is the set-function analogue of preferring items with the highest conditional information gain given what has already been selected.",
    },
    {
      type: "cross-reference",
      targetId: "agent-operational-anchor-preservation",
      description: "Shares the failure mode of losing early-established facts under naive shortening; the diversity term keeps non-recent anchors that recency truncation would drop, complementing explicit anchor preservation applied during instruction compression.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
