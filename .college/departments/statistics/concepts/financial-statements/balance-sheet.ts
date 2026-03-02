import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const balanceSheet: RosettaConcept = {
  id: 'stat-balance-sheet',
  name: 'Balance Sheet',
  domain: 'statistics',
  description:
    'The balance sheet reports a company\'s assets, liabilities, and equity at a specific point in time. ' +
    'It is a snapshot answering: "What does the company own? What does it owe? What is left for owners?" ' +
    'The fundamental equation Assets = Liabilities + Equity must always hold. ' +
    'Balance sheets reveal liquidity, leverage, and capital structure — key measures of financial health.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-accounting-cycle',
      description: 'The balance sheet is produced at the end of the accounting cycle from ledger account balances',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.5625 + 0.1225),
    angle: Math.atan2(0.35, 0.75),
  },
};
