import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const counterfactualUtility: RosettaConcept = {
  id: 'agent-counterfactual-utility',
  name: 'Counterfactual Utility',
  domain: 'agent-systems',
  description:
    'The expected change in success rate from adding, refining, or retiring a skill, evaluated against a fixed probe ' +
    'bank. The 2026 framing (SkillMaster, arxiv `2605.08693v2`) makes skill lifecycle decisions tractable: instead of ' +
    "asking 'is this skill good?' (unanswerable), ask 'what's the expected delta if we ship/retire it?' (answerable " +
    'via paired-trace audit at a fixed cost). The pattern extends `agent-counterfactual-audit` from observation ' +
    "(what did this skill do) to decision (what should we do about it). Operationally: every skill in the library " +
    'carries a counterfactual-utility estimate that is updated when the probe bank or the skill is touched; ' +
    'retirement candidates surface automatically when utility drops below a threshold.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-counterfactual-audit',
      description: 'Counterfactual utility extends counterfactual audit from observation to lifecycle decision',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-paired-trace-audit',
      description: 'Utility is computed from paired-trace audit deltas on the probe bank',
    },
    {
      type: 'cross-reference',
      targetId: 'ct-counterfactual-reasoning',
      description: 'Counterfactual reasoning applied to skill lifecycle (ship / refine / retire)',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, -0.4),
  },
};
