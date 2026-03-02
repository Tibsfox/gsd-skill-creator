import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const businessFinance: RosettaConcept = {
  id: 'bus-business-finance',
  name: 'Business Finance',
  domain: 'business',
  description:
    'Business finance covers how firms raise, allocate, and manage capital. ' +
    'Capital sources: debt (loans, bonds) and equity (stock, retained earnings). ' +
    'The capital structure decision (debt vs. equity mix) affects risk and cost of capital. ' +
    'Working capital management ensures enough cash to fund day-to-day operations. ' +
    'Capital budgeting techniques (NPV, IRR) evaluate long-term investment decisions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-ratio-analysis',
      description: 'Financial ratio analysis is the primary tool for assessing business financial health',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
