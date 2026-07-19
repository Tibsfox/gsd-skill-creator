/**
 * Label Free Skill Refinement -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/label-free-skill-refinement
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 84 * 2 * Math.PI / 85;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const labelFreeSkillRefinement: RosettaConcept = {
  id: "agent-label-free-skill-refinement",
  name: "Label Free Skill Refinement",
  domain: 'agent-systems',
  description:
    "An LLM-authored skill can quietly degrade agent behavior in ways pass-rate never reveals, yet repairing it normally demands labels, tests, or environment rewards that most skill libraries lack. SkillAxe (arXiv 2606.10546v2) refines a skill with no ground truth by decomposing its quality into four separately diagnosable dimensions — quality impact, trigger precision, fault-attributed instruction compliance, and solution-path coverage — each estimated from execution traces alone, then emits a structured improvement brief targeting each weak dimension. This lets skills self-refine in production settings where labeled evaluation sets and reward signals simply do not exist.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-paired-trace-audit",
      description: "Specializes the parent's with-skill/without-skill paired probe into a label-free regime: rather than scoring traces against ground truth, it derives four diagnostic dimensions from the traces themselves and converts each into a targeted rewrite brief.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compositional-skill-evolution",
      description: "Supplies the improvement operator for the canonical evolution loop it sits beneath; each label-free brief becomes one edit proposal that compositional skill evolution applies and re-tests over successive generations.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-coverage-metric",
      description: "Its solution-path-coverage dimension operationalizes the same trajectory-coverage idea, scoring how much of a task's viable solution space the skill's instructions actually exercise rather than only whether the final answer passed.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "Its fault-attributed instruction-compliance dimension extends compliance checking by tracing observed failures back to the specific skill instruction responsible, rather than merely flagging that a rule was violated.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
