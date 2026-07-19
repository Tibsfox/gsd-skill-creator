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
    "Infer the set of candidate symbolic goals a request could mean — over the same state-transition vocabulary the executor plans in — and score their ambiguity before acting, rather than assuming the first plausible goal is the intended one. This layer sits on top of Causal Minimal Tool Filtering (CMTF), which exposes only the next causally-necessary tool frontier but assumes the goal is already fixed; GIST-CMTF (arXiv 2606.16813v1, 2026) adds goal-state inference that predicts candidate goals, estimates ambiguity, and either applies CMTF or exposes clarification as a causal action producing the missing goal evidence, collapsing the candidate set toward one goal. It names a discrete failure mode — wrong-goal execution, where an agent follows a valid causal tool path for an unintended objective, as when an underspecified 'handle my appointment' spans {reschedule, cancel, confirm} and ambiguity over that goal set (not over missing fields) triggers the clarify action. Across seven model backends, six filtering methods, and 120 controlled tool-use tasks it reaches 97.0% task success versus 80.1% for top-goal CMTF and 82.9% for semantic-goal CMTF, and cuts wrong-goal execution from 19.4% to 2.5% while preserving one-tool exposure and staying far below all-tools token cost. When inferred goals disagree, asking is the highest-information move; when they agree, the agent proceeds without a round-trip. The implication for agent systems is that a spec need not be complete to be dispatchable — it needs an unambiguous goal, and ambiguity over goals (not over fields) is the quantity to gate on.",
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
