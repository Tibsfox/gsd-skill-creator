import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cashFlowStatement: RosettaConcept = {
  id: 'stat-cash-flow-statement',
  name: 'Cash Flow Statement',
  domain: 'statistics',
  description:
    'The cash flow statement tracks actual cash inflows and outflows in three categories: ' +
    'operating activities (day-to-day business), investing activities (capital expenditures, asset sales), ' +
    'and financing activities (loans, equity issuance, dividends). ' +
    'It reconciles the accrual-basis income statement with actual cash position. ' +
    '"Cash is king" — this statement shows whether a company can pay its bills regardless of reported profit.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-income-statement',
      description: 'The indirect method cash flow statement reconciles net income to cash by adjusting for non-cash items',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
