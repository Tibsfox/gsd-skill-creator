import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const savingInvesting: RosettaConcept = {
  id: 'domestic-saving-investing',
  name: 'Saving & Investing',
  domain: 'home-economics',
  description:
    'Saving and investing grow wealth over time through the power of compound interest — ' +
    'earning interest on previously earned interest. A key formula: A = P(1 + r/n)^(nt), where P ' +
    'is principal, r is annual interest rate, n is compounding frequency, t is years. The Rule of ' +
    '72: divide 72 by the annual rate to estimate years to double (at 7%, money doubles in ~10 ' +
    'years). Savings accounts (FDIC-insured, liquid, low return) vs. investment accounts ' +
    '(market-exposed, higher return potential, risk). Index funds track broad market indices ' +
    '(S&P 500) with low fees and diversification — preferred over actively managed funds for most ' +
    'individuals. Tax-advantaged accounts (Roth IRA, 401k) provide significant long-term benefits. ' +
    'Emergency fund first (3-6 months expenses in liquid savings) before investing. Dollar-cost ' +
    'averaging (investing fixed amounts regularly regardless of price) removes market timing risk.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-budgeting',
      description: 'Saving requires surplus income identified through budgeting — you must spend less than you earn',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
