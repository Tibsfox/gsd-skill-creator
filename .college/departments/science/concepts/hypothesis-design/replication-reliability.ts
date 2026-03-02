import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const replicationReliability: RosettaConcept = {
  id: 'sci-replication-reliability',
  name: 'Replication & Reliability',
  domain: 'science',
  description:
    'A single experiment is not sufficient to establish a scientific claim. Replication -- repeating the ' +
    'experiment to get consistent results -- is essential for ruling out random variation. When other ' +
    'scientists independently replicate findings, confidence in the result grows. The replication crisis ' +
    'in psychology illustrates what happens when this norm is neglected.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-experimental-controls',
      description: 'Reliable replication requires the same controls to be applied each time',
    },
    {
      type: 'cross-reference',
      targetId: 'sci-peer-review',
      description: 'Peer review scrutinizes methods and calls for replication before results are accepted',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
