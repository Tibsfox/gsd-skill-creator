import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const historicalContext: RosettaConcept = {
  id: 'hist-historical-context',
  name: 'Historical Context',
  domain: 'history',
  description:
    'Historical context means understanding a source or event within the conditions of its time: ' +
    'the political situation, social norms, economic conditions, technology, and available knowledge. ' +
    'Judging past actors by present moral standards (presentism) is a common error that historical context prevents. ' +
    'Context does not excuse, but it does explain — and explanation is the historian\'s primary task.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-source-analysis',
      description: 'Source analysis frameworks explicitly require establishing historical context as a first step',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
