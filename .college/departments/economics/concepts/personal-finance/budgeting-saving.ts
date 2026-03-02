import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const budgetingSaving: RosettaConcept = {
  id: 'econ-budgeting-saving',
  name: 'Budgeting and Saving',
  domain: 'economics',
  description: 'Personal finance starts with understanding income and expenses -- the foundation for all other financial decisions. ' +
    'Budget: a plan for how to allocate income across spending categories and saving. Income - expenses = savings. ' +
    '50/30/20 rule: 50% needs, 30% wants, 20% savings -- a simple heuristic, not a rigid rule. ' +
    'Pay yourself first: automate savings at the start of the month, before discretionary spending. ' +
    'Emergency fund: 3-6 months of expenses in liquid savings -- protects against unexpected income loss. ' +
    'Time value of money: a dollar today is worth more than a dollar tomorrow -- because it can be invested. ' +
    'Compound interest: interest on interest. Einstein (allegedly) called it "the eighth wonder of the world." ' +
    'Rule of 72: divide 72 by annual return to find years to double money. At 6%, money doubles in 12 years. ' +
    'Lifestyle inflation: income rises but expenses rise to match, leaving savings unchanged -- the hedonic treadmill in financial form.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-opportunity-cost',
      description: 'Every budget choice is an opportunity cost calculation -- spending on X means not saving for Y',
    },
    {
      type: 'cross-reference',
      targetId: 'math-exponential-growth',
      description: 'Compound interest is exponential growth -- understanding the math makes saving urgency visceral',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
