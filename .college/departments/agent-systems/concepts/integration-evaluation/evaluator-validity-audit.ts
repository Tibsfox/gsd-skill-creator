/**
 * Evaluator Validity Audit -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/integration-evaluation/evaluator-validity-audit
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 136 * 2 * Math.PI / 47;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const evaluatorValidityAudit: RosettaConcept = {
  id: "agent-evaluator-validity-audit",
  name: "Evaluator Validity Audit",
  domain: 'agent-systems',
  description:
    "Turn the auditing lens onto the evaluator itself: a tool-calling benchmark's scoring harness is a fallible artifact, not ground truth, and it fails in named, recurring ways — brittle final-state matching, trajectory lock-in that credits only one blessed path, mislabelled ground truths, and LLM-judge rubric drift with run-to-run variance. The 2026 finding (arXiv 2607.02577v1, 2026) is that meta-evaluating the evaluator surfaces scoring errors large enough to reorder agent leaderboards: across 496 expert-reviewed tasks the audit found 92 evaluator-human disagreements, an 18.5% misalignment rate, and re-running the same LiveMCPBench setup 23 times produced scores from 57.9% to 76.8% — an 18.9-percentage-point spread, enough to change leaderboard conclusions. So a benchmark's numbers cannot be trusted until its scorer has itself been validated. This flips the audited object from the agent trace to the measurement instrument. The prescriptive remedy is to decompose a single score into separate tool-invocation, task-completion, and outcome-verification metrics (released as the Tool-Veritas benchmark and the Harness Lab inspection tooling). The implication for building agent systems: every gate, utility estimate, and keep/retire decision inherits the validity of its evaluator, so certify the scorer before acting on its scores.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-paired-trace-audit",
      description: "Extends the paired-trace audit by turning the same auditing machinery onto the evaluator instead of the agent trace, making the scorer the audited object rather than the skill's behavioural influence.",
    },
    {
      type: "cross-reference",
      targetId: "agent-silent-failure-taxonomy",
      description: "Both are named recurring-failure taxonomies; silent-failure-taxonomy classifies ways an agent run fails undetected, while this classifies ways the evaluator that judges the run fails undetected.",
    },
    {
      type: "cross-reference",
      targetId: "agent-counterfactual-utility",
      description: "Counterfactual-utility ship/retire decisions consume evaluator scores as if they were ground truth, so a validity audit certifies the measurement those lifecycle decisions depend on.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
