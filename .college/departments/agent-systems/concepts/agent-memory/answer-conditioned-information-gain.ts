/**
 * Answer-Conditioned Information Gain -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agent-memory/answer-conditioned-information-gain
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 66 * 2 * Math.PI / 47;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const answerConditionedInformationGain: RosettaConcept = {
  id: "agent-answer-conditioned-information-gain",
  name: "Answer-Conditioned Information Gain",
  domain: 'agent-systems',
  description:
    "Retrieval and consolidation both need a scalar for \"how valuable is this chunk of memory?\", and the usual answers — final-answer success, or lexical overlap with the query — reward the wrong thing. InfoMem (arXiv 2606.03329v1, 2026) redefines a memory's value as the answer-conditioned information it carries: the rise in the model's per-token log-likelihood of the ground-truth answer with vs. without the chunk in context. This displaces two failure-prone proxies — task-success, which confounds retrieval with generation, and lexical overlap, which rewards surface echo over evidentiary lift — with a graded per-token measure that answers \"useful for what?\". The axis is not relevance but likelihood-lift toward a known target. Implication: chunks get ranked and pruned by measured contribution to answering, giving retrieval a target-aware weight rather than a channel-agnostic similarity score.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-hybrid-retrieval",
      description: "Refines hybrid retrieval's scoring: it replaces channel-agnostic similarity with an answer-conditioned value, giving both the lexical and dense channels a target-aware weight for ranking and pruning.",
    },
    {
      type: "cross-reference",
      targetId: "agent-counterfactual-utility",
      description: "Both cast value as a lift, but the object differs — counterfactual-utility is a success-rate delta for a skill over a probe bank, while this is a per-token likelihood lift for one memory chunk toward one answer.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-consolidation",
      description: "The answer-conditioned score supplies consolidation's retention signal: chunks with low likelihood-lift toward answered queries become pruning candidates.",
    },
    {
      type: "cross-reference",
      targetId: "agent-decision-aware-context-selection",
      description: "It is the per-chunk value function decision-aware selection needs — rank candidate context by measured lift toward the target answer rather than by generic relevance.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
