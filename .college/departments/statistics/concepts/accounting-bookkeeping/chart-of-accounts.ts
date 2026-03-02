import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const chartOfAccounts: RosettaConcept = {
  id: 'stat-chart-of-accounts',
  name: 'Chart of Accounts',
  domain: 'statistics',
  description:
    'A chart of accounts is the organized list of all accounts a business uses to record financial transactions. ' +
    'Accounts are grouped by type: assets, liabilities, equity, revenues, and expenses. ' +
    'Each account has a unique number for efficient reference. ' +
    'The chart of accounts is the architecture of the accounting system — its structure determines ' +
    'what information can be extracted and reported.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-double-entry',
      description: 'The chart of accounts defines the accounts that receive debits and credits in double-entry bookkeeping',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
