/**
 * Nugget Grounded Judging -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/integration-evaluation/nugget-grounded-judging
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 67 * 2 * Math.PI / 85;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const nuggetGroundedJudging: RosettaConcept = {
  id: "agent-nugget-grounded-judging",
  name: "Nugget Grounded Judging",
  domain: 'agent-systems',
  description:
    "LLM-as-judge evaluation collapses two roles into one model: defining what a good answer must contain and checking whether an output contains it — which invites the judge to rubber-stamp criteria it invented. Nugget-grounded judging (Human-in-the-Loop Nugget Annotation, arXiv 2606.29033v2) splits the roles. A human authors atomic information 'nuggets' — the discrete facts a quality answer must include — and the model performs only the high-volume nugget-to-output matching. Authorship of the rubric stays human, so the judge scales without the model deciding what quality means. For agent systems this yields auditable, per-nugget verdicts and a clear accountability line instead of one opaque holistic score. The technique inherits a durable lineage: nugget-based scoring originates in TREC question-answering and RAG evaluation, where answers were graded against atomic information nuggets, grounding the concept beyond this single paper.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-compliance-trace-check",
      description: "Specializes the parent's trace-versus-rule compliance check by decomposing the rule into discrete human-authored nuggets, so the model performs only per-nugget matching rather than rendering one holistic compliance verdict, keeping rubric authorship with the human.",
    },
    {
      type: "cross-reference",
      targetId: "agent-evaluator-validity-audit",
      description: "Nugget grounding is a construction technique for the validity that this audit measures — pinning rubric authorship to a human directly targets the rubber-stamping and criteria-drift failure modes that evaluator-validity audits are designed to detect.",
    },
    {
      type: "analogy",
      targetId: "agent-answer-conditioned-information-gain",
      description: "Both treat an answer as a set of discrete information units; nuggets are the human-authored, pre-committed counterpart to the information-gain formulation's automatically derived units, trading adaptivity for accountability.",
    },
    {
      type: "cross-reference",
      targetId: "agent-structured-spec-gate",
      description: "The nugget set functions as a human-authored structured spec that gates output quality; matching each nugget mirrors checking an output against declared spec clauses, making both approaches spec-driven rather than free-form judgment.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
