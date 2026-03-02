import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const patternRecognition: RosettaConcept = {
  id: 'math-pattern-recognition',
  name: 'Pattern Recognition & Extension',
  domain: 'math',
  description:
    'Recognizing, describing, and extending patterns is foundational to algebraic thinking. ' +
    'Patterns may be visual, numerical, or relational. Describing a pattern precisely requires ' +
    'identifying the rule that generates it. The ability to generalize from specific cases to a ' +
    'universal rule is the core cognitive move of algebra.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-number-cardinality',
      description: 'Numerical patterns require number sense to identify and describe relationships',
    },
    {
      type: 'dependency',
      targetId: 'math-variables-unknowns',
      description: 'Generalizing patterns uses variables to express rules that work for all cases',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
