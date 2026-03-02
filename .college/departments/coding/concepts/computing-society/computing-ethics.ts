import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const computingEthics: RosettaConcept = {
  id: 'code-computing-ethics',
  name: 'Computing Ethics & Responsibility',
  domain: 'coding',
  description: 'The ethical obligations of developers: code you write affects real people. ' +
    'Core ethical domains: privacy (collecting only necessary data, securing it properly), ' +
    'accessibility (screen readers, keyboard navigation, color contrast -- 15% of people have disabilities), ' +
    'environmental impact (data centers consume 1-3% of global electricity), ' +
    'bias (training data reflects historical discrimination, outputs amplify it), ' +
    'and professional responsibility (the ACM Code of Ethics). ' +
    'The dual newspaper test: would your code be reported as harmful by investigative journalism? ' +
    'Would it be reported as overly cautious? ' +
    'Ethics is not a feature to add later -- it must be designed in from the start.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-algorithmic-bias',
      description: 'Computing ethics intersects with data ethics -- bias in algorithms is both a coding and data problem',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-algorithmic-bias',
      description: 'Ethics for producers of code complements digital literacy for consumers of algorithmic systems',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.09 + 0.5625),
    angle: Math.atan2(0.75, 0.3),
  },
};
