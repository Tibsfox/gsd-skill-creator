import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const patternRecognition: RosettaConcept = {
  id: 'prob-pattern-recognition',
  name: 'Pattern Recognition in Problems',
  domain: 'problem-solving',
  description:
    'Pattern recognition identifies similarities between a new problem and problems previously solved. ' +
    'Expert problem solvers maintain a mental library of problem types and solution schemas. ' +
    'When a new problem matches a known pattern, a known solution strategy can be adapted. ' +
    'Pattern recognition works across domains: the same recursive structure appears in mathematics, ' +
    'computer science, music, and fractal geometry.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-decomposition',
      description: 'Decomposed sub-problems are often easier to match to known patterns than the original complex problem',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
