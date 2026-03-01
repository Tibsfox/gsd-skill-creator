import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const pantryManagement: RosettaConcept = {
  id: 'cook-pantry-management',
  name: 'Pantry Management',
  domain: 'culinary-arts',
  description: 'FIFO (first in, first out) rotation ensures older items are used before newer ' +
    'purchases, preventing waste from expired goods. A well-stocked pantry includes staples: ' +
    'cooking oils (olive, neutral), vinegars (white, apple cider), dried goods (rice, pasta, ' +
    'flour, dried beans), canned goods (tomatoes, beans, stock), and seasonings (salt, pepper, ' +
    'garlic, onion, dried herbs). Storage conditions matter: most dry goods need cool, dark, dry ' +
    'environments. Expiration date literacy: "best by" indicates quality (still safe after), ' +
    '"use by" is a safety recommendation, "sell by" is for retailers only. A well-managed pantry ' +
    'enables spontaneous cooking without extra shopping trips.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-safe-storage-times',
      description: 'Knowledge of safe storage times determines pantry rotation schedule and discard decisions',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: -0.3,
    magnitude: Math.sqrt(0.64 + 0.09),
    angle: Math.atan2(-0.3, 0.8),
  },
};
