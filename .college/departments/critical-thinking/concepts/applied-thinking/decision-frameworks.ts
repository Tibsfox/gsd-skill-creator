import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const decisionFrameworks: RosettaConcept = {
  id: 'crit-decision-frameworks',
  name: 'Decision Frameworks',
  domain: 'critical-thinking',
  description:
    'Decision frameworks are structured approaches for making choices under uncertainty. ' +
    'Tools include pro-con lists, weighted criteria matrices, expected value calculations, pre-mortems, ' +
    'and the "10/10/10" reflection (how will I feel about this in 10 minutes, 10 months, 10 years?). ' +
    'Frameworks slow down intuitive reactions, surface hidden assumptions, and reduce regret by making ' +
    'the reasoning behind decisions explicit and revisable.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'crit-argument-structure',
      description: 'Decision frameworks formalize argument structure into a decision-support process',
    },
    {
      type: 'dependency',
      targetId: 'crit-availability-anchoring',
      description: 'Structured frameworks counteract anchoring and availability biases in decision-making',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.16 + 0.5625),
    angle: Math.atan2(0.75, 0.4),
  },
};
