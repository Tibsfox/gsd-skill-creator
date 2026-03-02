import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const budgeting: RosettaConcept = {
  id: 'stat-budgeting',
  name: 'Budgeting',
  domain: 'statistics',
  description:
    'A budget is a plan for allocating income across expenses, savings, and investments. ' +
    'The 50/30/20 rule (50% needs, 30% wants, 20% savings/debt) is a simple starting framework. ' +
    'Zero-based budgeting assigns every dollar a purpose. Envelope budgeting uses physical or digital envelopes ' +
    'per category. The discipline of budgeting — comparing planned to actual spending — is the ' +
    'foundation of personal financial control.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.7225 + 0.04),
    angle: Math.atan2(0.2, 0.85),
  },
};
