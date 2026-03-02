import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const opportunityCost: RosettaConcept = {
  id: 'econ-opportunity-cost',
  name: 'Opportunity Cost',
  domain: 'economics',
  description: 'Opportunity cost is the value of the best alternative foregone when making a choice -- the true cost of any decision. ' +
    'Going to college: the cost is not just tuition but the income you could have earned by working instead. ' +
    'Sunk costs are NOT opportunity costs: money already spent is gone and should not affect current decisions. ' +
    'Comparative advantage: you have comparative advantage in activities with the lowest opportunity cost. ' +
    'Even free things have opportunity cost: your time has value -- attending a free event costs the time you could have spent otherwise. ' +
    'Ricardo\'s insight: countries benefit from specializing in goods with lower opportunity cost and trading -- even if one country is absolutely better at everything. ' +
    'Opportunity cost explains why "free" government services still cost society something -- resources used here cannot be used elsewhere. ' +
    'Making opportunity costs explicit transforms vague decisions into clearer trade-off analyses.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-scarcity-tradeoffs',
      description: 'Opportunity cost is the precise measurement of a trade-off -- scarcity makes every choice an opportunity cost calculation',
    },
    {
      type: 'cross-reference',
      targetId: 'log-decision-making',
      description: 'Rational decision making requires making opportunity costs explicit -- what you give up is as important as what you gain',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
