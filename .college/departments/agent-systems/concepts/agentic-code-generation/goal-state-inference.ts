/**
 * Goal-State Inference -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agentic-code-generation/goal-state-inference
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 38 * 2 * Math.PI / 47;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const goalStateInference: RosettaConcept = {
  id: "agent-goal-state-inference",
  name: "Goal-State Inference",
  domain: 'agent-systems',
  description:
    "Infer the set of candidate symbolic goals a request could mean — over the same state-transition vocabulary the executor plans in — and score their ambiguity before acting, rather than assuming the first plausible goal is the intended one. The 2026 framing (GIST-CMTF, arXiv 2606.16813v1, 2026) names a discrete failure mode, wrong-goal execution on underspecified requests, and its non-obvious fix: treat clarification not as latency but as a causal action that produces the missing goal evidence, collapsing the candidate set toward one goal. When inferred goals disagree, asking is the highest-information move; when they agree, the agent proceeds without a round-trip. The implication for agent systems is that a spec need not be complete to be dispatchable — it needs an unambiguous goal, and ambiguity over goals (not over fields) is the quantity to gate on.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-structured-spec-gate",
      description: "Refines the spec gate: instead of checking whether typed fields are present, it gates on whether the inferred goal is unambiguous, and recasts the gate's needs-clarification branch as goal-evidence gathering rather than a binary field check.",
    },
    {
      type: "cross-reference",
      targetId: "agent-causal-tool-frontier",
      description: "Runs upstream of the causal tool frontier over the SAME state-transition vocabulary — goals must be disambiguated before tools are filtered to what is causally necessary to reach the goal.",
    },
    {
      type: "cross-reference",
      targetId: "agent-answer-conditioned-information-gain",
      description: "Exposing clarification as a causal action that yields missing goal evidence is answer-conditioned information gain applied to goal ambiguity: ask when a reply most collapses the candidate-goal set.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
