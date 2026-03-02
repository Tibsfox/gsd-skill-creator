import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const compoundInterest: RosettaConcept = {
  id: 'stat-compound-interest',
  name: 'Compound Interest & Time Value',
  domain: 'statistics',
  description:
    'Compound interest means earning interest on both principal and previously earned interest. ' +
    'Formula: FV = PV × (1 + r)^n. The Rule of 72: divide 72 by the interest rate to estimate years to double money. ' +
    'Time value of money: a dollar today is worth more than a dollar in the future because of earning potential. ' +
    'Understanding compound interest is the single most important concept for personal wealth building.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-budgeting',
      description: 'Budgeting generates savings that can be invested to benefit from compound interest',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.49 + 0.2025),
    angle: Math.atan2(0.45, 0.7),
  },
};
