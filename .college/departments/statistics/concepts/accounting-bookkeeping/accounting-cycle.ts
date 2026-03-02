import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const accountingCycle: RosettaConcept = {
  id: 'stat-accounting-cycle',
  name: 'The Accounting Cycle',
  domain: 'statistics',
  description:
    'The accounting cycle is the sequence of steps performed each accounting period to record and report financial data. ' +
    'Steps: identify transactions → record in journal → post to ledger → prepare trial balance → ' +
    'make adjusting entries → prepare financial statements → close the books. ' +
    'Understanding the cycle reveals why accounting is systematic and how errors are caught before reporting.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-double-entry',
      description: 'The accounting cycle is built on double-entry transactions recorded throughout the period',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
