import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const accrualCashBasis: RosettaConcept = {
  id: 'stat-accrual-cash-basis',
  name: 'Accrual vs. Cash Basis Accounting',
  domain: 'statistics',
  description:
    'Cash basis accounting records transactions when cash changes hands; accrual basis records when the ' +
    'economic event occurs, regardless of cash timing. Accrual accounting (required for most businesses) ' +
    'provides a more accurate picture of financial position but is more complex. ' +
    'This distinction explains why a profitable business can run out of cash and why financial statements ' +
    'must be read in context of the accounting method used.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-accounting-cycle',
      description: 'Adjusting entries in the accounting cycle implement the accrual method at period end',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
