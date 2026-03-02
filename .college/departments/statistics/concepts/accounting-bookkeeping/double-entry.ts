import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const doubleEntry: RosettaConcept = {
  id: 'stat-double-entry',
  name: 'Double-Entry Bookkeeping',
  domain: 'statistics',
  description:
    'Double-entry bookkeeping records every financial transaction as both a debit and a credit of equal value. ' +
    'This system, unchanged since Luca Pacioli codified it in 1494, ensures that the accounting equation ' +
    '(Assets = Liabilities + Equity) always balances. Every error is detectable because the books must balance. ' +
    'Understanding double entry is foundational for reading any financial statement.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};
