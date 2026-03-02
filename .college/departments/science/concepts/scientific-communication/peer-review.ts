import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const peerReview: RosettaConcept = {
  id: 'sci-peer-review',
  name: 'Peer Review',
  domain: 'science',
  description:
    'Peer review is the process by which experts critically evaluate research before publication. ' +
    'Reviewers check methods, data, analysis, and conclusions for errors and logical consistency. ' +
    'The process is not infallible -- biases and errors can slip through -- but it represents the ' +
    'scientific community\'s collective quality-control mechanism for published knowledge.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-replication-reliability',
      description: 'Peer review calls for independent replication as the ultimate test of scientific claims',
    },
    {
      type: 'cross-reference',
      targetId: 'sci-evaluating-sources',
      description: 'Peer-reviewed literature is a key criterion for evaluating the reliability of scientific sources',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
