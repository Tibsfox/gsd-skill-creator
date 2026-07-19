/**
 * Plan Tensor Rank -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/plan-tensor-rank
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 72 * 2 * Math.PI / 85;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const planTensorRank: RosettaConcept = {
  id: "agent-plan-tensor-rank",
  name: "Plan Tensor Rank",
  domain: 'agent-systems',
  description:
    "When N agents plan jointly, how entangled are their plans really? Tensor-Coord (arXiv 2606.16478) stacks the plans into an agents×timesteps×actions tensor and reads coupling from its minimal CP-rank R*: because N truly independent plans factor into exactly N rank-1 terms, the rank excess is the coordination cost, CC=(R*−N)/N, which is zero iff plans are separable. The CP-decomposition residual further localizes pairwise conflicts in time and action space, turning coordination from a property of the communication graph into a measurable, localizable property of the plan content itself — useful for pre-execution triage of whether a team even needs to coordinate.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-spectral-topology",
      description: "Specializes the parent's coordination diagnostic: spectral-topology reads coordination from the eigenstructure of the communication graph (who can message whom), while plan-tensor-rank measures it from the realized joint plan via CP-rank excess, capturing content coupling that graph topology alone cannot expose.",
    },
    {
      type: "cross-reference",
      targetId: "agent-semantic-concurrency-control",
      description: "The CP-decomposition residual localizes exactly the pairwise time-and-action conflicts that semantic concurrency control must serialize or resolve, so plan-tensor-rank supplies an offline conflict map that a runtime concurrency controller can consume to target its interventions.",
    },
    {
      type: "cross-reference",
      targetId: "agent-coordination-surface",
      description: "Both quantify how tightly agents are coupled but along orthogonal axes: coordination-surface characterizes the interaction interface between agents, whereas plan-tensor-rank scores the coupling latent in the joint plan, so the CC scalar can annotate a coordination-surface analysis with a content-level complexity figure.",
    },
    {
      type: "analogy",
      targetId: "agent-multi-order-communication",
      description: "Analogous coupling measures over different substrates: multi-order-communication counts influence propagating through successive communication rounds, while plan-tensor-rank counts it as CP-rank excess in the joint plan tensor; both collapse to the independent-agent baseline (zero excess) when agents do not interact.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
