import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const budgetManagement: RosettaConcept = {
  id: 'cook-budget-management',
  name: 'Budget Management',
  domain: 'culinary-arts',
  description: 'Cost-per-serving analysis divides total ingredient cost by the number of portions, ' +
    'revealing the true value of home cooking versus prepared food. Seasonal buying reduces produce ' +
    'costs by 30-50% compared to out-of-season imports. Bulk buying economics: compare unit prices ' +
    '(cost per ounce or gram), but only buy in bulk what you can use before expiration. Protein ' +
    'cost hierarchy from cheapest to most expensive: legumes and dried beans, eggs, whole chicken, ' +
    'ground meat, pork cuts, beef cuts. Minimizing waste through meal planning, proper storage, ' +
    'and using scraps (vegetable peels for stock, stale bread for breadcrumbs) stretches every ' +
    'food dollar further.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-pantry-management',
      description: 'Good pantry inventory prevents redundant purchases and reduces waste spending',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: -0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(-0.2, 0.6),
  },
};
