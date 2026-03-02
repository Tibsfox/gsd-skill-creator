import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const errorAnalysis: RosettaConcept = {
  id: 'sci-error-analysis',
  name: 'Error Analysis',
  domain: 'science',
  description:
    'All measurements have uncertainty. Accuracy describes how close a measurement is to the true value; ' +
    'precision describes reproducibility. Sources of error include instrument limitations, human error, ' +
    'and environmental factors. Reporting percent error and range of uncertainty is part of honest ' +
    'scientific reporting.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-measurement-units',
      description: 'Error analysis begins with understanding the precision limits of measurement instruments',
    },
    {
      type: 'analogy',
      targetId: 'math-sampling-bias',
      description: 'Sources of measurement error in science parallel sources of sampling bias in statistics',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
