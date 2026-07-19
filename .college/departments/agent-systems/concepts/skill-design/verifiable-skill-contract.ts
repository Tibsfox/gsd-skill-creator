/**
 * Verifiable Skill Contract -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/verifiable-skill-contract
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 82 * 2 * Math.PI / 85;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const verifiableSkillContract: RosettaConcept = {
  id: "agent-verifiable-skill-contract",
  name: "Verifiable Skill Contract",
  domain: 'agent-systems',
  description:
    "Self-evolving skills are usually admitted after they merely pass on sampled executions, so a mutation can silently violate a safety property under inputs that were never tried. VASO (2026) instead represents each skill as a semantic contract exposing a formal, verifiable interface, and gates every evolution step behind temporal-safety proofs over the contract rather than trace-level evidence. Because a proof quantifies over the whole reachable state space, an evolved skill is rejected if it can violate its contract under any condition, not only the ones observed — giving stronger guarantees for autonomously mutating agent skill libraries where untested cases are exactly where regressions hide.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-structured-spec-gate",
      description: "Specializes the structured spec-gate: instead of admitting a skill on empirical evidence that it worked on sampled runs, it replaces the spec with a formal verifiable contract and gates on temporal-safety proofs, so evolution is admitted even under conditions the gate never sampled.",
    },
    {
      type: "dependency",
      targetId: "agent-formal-agent-verification",
      description: "Relies on formal-verification machinery to discharge the temporal-safety proof obligations that make up each contract; without a verifier able to prove properties over the reachable state space, the contract degrades back to trace-level checking.",
    },
    {
      type: "cross-reference",
      targetId: "agent-capability-controlled-self-evolution",
      description: "Both gate self-evolving skills before admission, but this concept gates on a proof-carrying semantic contract while capability-controlled self-evolution bounds mutation by a capability envelope; they are complementary controls over the same evolution step.",
    },
    {
      type: "analogy",
      targetId: "agent-compliance-trace-check",
      description: "Contrasts directly: compliance-trace checking is the weaker guarantee VASO argues is insufficient, since observing conformance on captured traces cannot certify behavior on unseen inputs the way a temporal-safety proof over the contract can.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
