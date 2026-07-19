/**
 * Skill-Coverage Metric -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/integration-evaluation/skill-coverage-metric
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 150 * 2 * Math.PI / 47;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillCoverageMetric: RosettaConcept = {
  id: "agent-skill-coverage-metric",
  name: "Skill-Coverage Metric",
  domain: 'agent-systems',
  description:
    "Test-adequacy for skills: translate a skill's natural-language instructions into semi-structured behavioural constraints, then measure over a trajectory which of them were exercised and, where they were, whether the agent obeyed them (arXiv 2606.20659v2, 2026). It is a crisp transposition of code coverage into the skill/trajectory domain — an axis distinct from counterfactual effect and from bare compliance. It sorts a skill's clauses into three states: exercised-and-followed, exercised-but-violated (a compliance gap), and never-exercised (untested). The failure mode it surfaces is the untested instruction: a clause that ships but no probe triggers, so its counterfactual effect is unmeasurable and its compliance unknown. The implication: coverage tells you whether an audit's silence means no effect or merely not-yet-exercised, steering probe-bank expansion at un-covered clauses.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-counterfactual-audit",
      description: "Refines the parent by adding an orthogonal test-adequacy axis: the audit measures a skill's effect, while coverage tells you which instructions were exercised at all — an un-exercised clause has no counterfactual signal, so coverage marks the audit's blind spots.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "Reuses the same natural-language-instruction-to-constraint translation but layers an exercised/never-exercised partition on top, so a failed predicate reads as a compliance gap only if the clause was actually triggered.",
    },
    {
      type: "cross-reference",
      targetId: "agent-silent-failure-taxonomy",
      description: "The exercised-but-violated state is a silent failure — an instruction the agent ran past and ignored while pass-rate stayed green — placing compliance gaps inside the silent-failure taxonomy.",
    },
    {
      type: "analogy",
      targetId: "logic-code-coverage",
      description: "Maps statement/branch code coverage onto skills: skill clauses are the coverable units and a trajectory is the test run, so an unexercised clause is dead-until-tested rather than known-correct.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
