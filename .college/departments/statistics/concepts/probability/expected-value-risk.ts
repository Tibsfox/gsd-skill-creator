import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const expectedValueRisk: RosettaConcept = {
  id: 'stat-expected-value-risk',
  name: 'Expected Value & Risk',
  domain: 'statistics',
  description:
    'Expected value is the probability-weighted average outcome of a random variable. ' +
    'It is a powerful decision tool: choose the option with highest expected value (for symmetric risk). ' +
    'But expected value alone ignores variance — the spread of outcomes. ' +
    'Risk-averse decision makers prefer lower variance even at the cost of lower expected value. ' +
    'Finance, insurance, and gambling are all applied expected-value and risk management problems.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-distributions',
      description: 'Expected value and variance are summary statistics derived from the probability distribution',
    },
    {
      type: 'cross-reference',
      targetId: 'crit-decision-frameworks',
      description: 'Expected value calculations formalize the quantitative component of decision frameworks',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
