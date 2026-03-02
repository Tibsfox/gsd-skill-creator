import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const computationalFluency: RosettaConcept = {
  id: 'math-computational-fluency',
  name: 'Computational Fluency',
  domain: 'math',
  description:
    'Computational fluency means computing accurately, efficiently, and flexibly -- choosing strategies ' +
    'appropriate to the numbers and context rather than always applying one algorithm. It encompasses ' +
    'mental math strategies, number sense for estimation, standard algorithms, and the judgment to ' +
    'select the right approach. Fluency frees working memory for higher-level mathematical thinking.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-operations-meaning',
      description: 'Fluency is built on understanding what operations mean, not just memorizing procedures',
    },
    {
      type: 'dependency',
      targetId: 'math-place-value',
      description: 'Standard algorithms and mental math strategies depend on place value understanding',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
