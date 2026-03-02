import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const incomeStatement: RosettaConcept = {
  id: 'stat-income-statement',
  name: 'Income Statement',
  domain: 'statistics',
  description:
    'The income statement (profit and loss statement) reports revenues, expenses, and net profit over a period. ' +
    'Key structure: Revenue − Cost of Goods Sold = Gross Profit − Operating Expenses = Operating Income − ' +
    'Interest and Taxes = Net Income. ' +
    'The income statement answers: "Did the business make money this period?" and explains how.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-accrual-cash-basis',
      description: 'Income statement figures depend on whether accrual or cash basis accounting is used',
    },
    {
      type: 'dependency',
      targetId: 'stat-balance-sheet',
      description: 'Net income from the income statement flows into retained earnings on the balance sheet',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
