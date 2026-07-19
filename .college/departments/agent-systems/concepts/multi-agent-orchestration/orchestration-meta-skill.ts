/**
 * Orchestration Meta Skill -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/orchestration-meta-skill
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 70 * 2 * Math.PI / 85;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const orchestrationMetaSkill: RosettaConcept = {
  id: "agent-orchestration-meta-skill",
  name: "Orchestration Meta Skill",
  domain: 'agent-systems',
  description:
    "Two default ways to build a multi-agent orchestrator each carry a cost: freeze it and it never learns from its runs; fine-tune its weights and the accumulated coordination experience is fused into the parameters — expensive to update, model-locked, and prone to overwriting prior skill. The 2026 proposal (arXiv 2606.18837v2) is a third path: keep orchestration experience as an evolvable meta-skill — an external, non-parametric artifact refined by closed-loop optimization over execution outcomes rather than by gradient updates. Decoupling retention from weights means any base model can carry the same coordination know-how, and the experience stays inspectable, editable, and portable across model swaps, letting a long-lived orchestrator improve without ever touching its parameters.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-fast-slow-coevolution",
      description: "Specializes the slow loop of fast/slow co-evolution: rather than the expensive slow update reshaping topology or writing back into weights, the retained experience becomes an evolvable meta-skill refined by closed-loop optimization, keeping the slow loop non-parametric and decoupled from model parameters.",
    },
    {
      type: "cross-reference",
      targetId: "agent-in-weight-skill",
      description: "The opposite pole on the retention axis — an in-weight skill bakes experience into parameters through training, whereas the orchestration meta-skill is the non-parametric alternative that holds the same coordination experience outside the weights.",
    },
    {
      type: "cross-reference",
      targetId: "agent-experience-internalization-collapse",
      description: "The failure mode this design sidesteps: folding accumulated experience back into model weights can collapse or overwrite prior competence, so holding orchestration experience as an external meta-skill avoids that internalization risk entirely.",
    },
    {
      type: "cross-reference",
      targetId: "agent-label-free-skill-refinement",
      description: "Names the refinement mechanism — the meta-skill is improved label-free and closed-loop from execution outcomes and self-signals, which is exactly why gradient updates on labelled data are not required to evolve it.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
