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
    "Chunk-wise memory agents read a long context one chunk at a time, updating a compact memory and then answering from it — and training them by RL needs a scalar for \"does the final memory support the ground-truth answer?\". InfoMem (arXiv 2606.03329v1, 2026) is that reward, learned under the GRPO framework: it defines a memory's value as the answer-conditioned information it carries — the rise in the model's per-token log-likelihood of the ground-truth answer with vs. without that memory in context. It displaces two failure-prone proxies the paper names: the sparse final-answer reward, which supervises task success but confounds retrieval with generation, and lexical intermediate rewards for memory/retrieval actions, which pay for surface overlap rather than evidentiary lift — replacing both with a graded per-token measure that answers \"useful for what?\". Three ablation lessons make the signal usable without destabilizing optimization: apply it ONLY to successful trajectories, NORMALIZE it before composing it with other rewards, and condition it on the ANSWER rather than the query. Generalized beyond the training loop, the same score gives retrieval a target-aware weight — chunks get ranked and pruned by measured likelihood-lift toward a known answer rather than by channel-agnostic similarity.",
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
