/**
 * Judge Prior Rigidity -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/integration-evaluation/judge-prior-rigidity
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 130 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const judgePriorRigidity: RosettaConcept = {
  id: "agent-judge-prior-rigidity",
  name: "Judge Prior Rigidity",
  domain: 'agent-systems',
  description:
    "Judge Prior Rigidity characterizes a failure mode of LLMs used as safety evaluators: although they can absorb novel in-context information such as task demonstrations or a supplied safety definition, they broadly refuse to change their verdicts when that context contradicts their internal safety priors (arXiv 2606.07874, 2026). The paper evaluates generalist LLMs and safety-specific judges along two axes rarely tested beyond human agreement—susceptibility to in-context information and steerability to differing safety definitions—and finds the priors dominate whenever the two conflict. Its distinct contribution is showing that a judge's baked-in stance is not reliably overridable by prompt-level rubrics. For agent systems, this means an LLM-judge cannot be assumed to enforce a custom or evolving safety policy merely because it is placed in context; verdict adoption must be measured, not presumed. Operationally, that measurement is a steerability probe: run the judge on the same cases twice — once under its default prior and once under the supplied definition — and check whether the verdicts actually move toward the definition rather than staying anchored to the prior.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-evaluator-validity-audit",
      description: "Prior rigidity is a specific validity defect an evaluator-validity audit must probe: whether a judge's verdicts actually track the supplied definition rather than its baked-in safety priors.",
    },
    {
      type: "cross-reference",
      targetId: "agent-safety-rule-evolution",
      description: "Rigidity caps how much a judge honors an evolved rule, so safety-rule-evolution pipelines must verify that a redefined policy is adopted instead of assuming in-context redefinition steers the verdict.",
    },
    {
      type: "cross-reference",
      targetId: "agent-nugget-grounded-judging",
      description: "Forcing verdicts through explicit nuggets and criteria is a partial counter to prior rigidity, anchoring the judge to supplied evidence rather than its internal safety prior.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
