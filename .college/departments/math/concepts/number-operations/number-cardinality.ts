import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const numberCardinality: RosettaConcept = {
  id: 'math-number-cardinality',
  name: 'Number & Cardinality',
  domain: 'math',
  description:
    'Numbers represent quantities, and each number has a fixed cardinality -- the size of the set it names. ' +
    'Subitizing (instantly recognizing small quantities without counting) and counting principles (stable order, ' +
    'one-to-one correspondence, cardinality, abstraction, order-irrelevance) establish the foundation for all ' +
    'arithmetic. Learners progress from recognizing small sets to understanding the infinite number line.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-operations-meaning',
      description: 'Number sense and cardinality are prerequisites for understanding what operations do to quantities',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};
