import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const creditDebt: RosettaConcept = {
  id: 'stat-credit-debt',
  name: 'Credit & Debt Management',
  domain: 'statistics',
  description:
    'Credit allows spending beyond current income by borrowing against future income. ' +
    'Credit scores (FICO) summarize creditworthiness based on payment history, utilization, length of history, ' +
    'credit mix, and new credit. Good credit lowers borrowing costs across mortgages, auto loans, and cards. ' +
    'Debt management requires understanding APR, minimum payments (which maximize total interest paid), ' +
    'and debt avalanche vs. snowball payoff strategies.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-compound-interest',
      description: 'Credit card debt compounds against the borrower — understanding compound interest shows how debt grows',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.36 + 0.36),
    angle: Math.atan2(0.6, 0.6),
  },
};
