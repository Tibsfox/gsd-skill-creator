import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const budgeting: RosettaConcept = {
  id: 'domestic-budgeting',
  name: 'Budgeting',
  domain: 'home-economics',
  description:
    'A budget is a plan that aligns spending with values and priorities. ' +
    'The 50/30/20 framework: 50% needs (housing, food, utilities, transportation), ' +
    '30% wants (entertainment, dining out, hobbies), 20% savings and debt repayment. ' +
    'Zero-based budgeting assigns every dollar a purpose at the start of each month. ' +
    'Tracking spending for 30 days reveals the gap between intended and actual patterns -- ' +
    'most people are surprised by subscriptions, food delivery, and small daily purchases. ' +
    'Emergency fund: 3-6 months of expenses in a liquid savings account eliminates ' +
    'the need to carry high-interest debt through emergencies. ' +
    'The true cost of credit card debt: a $3,000 balance at 24% APR, paying minimum, ' +
    'takes 14+ years to clear and costs $4,200 in interest. ' +
    'Budget review monthly: circumstances change, goals shift, spending patterns drift.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'econ-personal-finance',
      description: 'Economics department provides broader financial theory context for personal budgeting',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(0.2, 0.7),
  },
};
