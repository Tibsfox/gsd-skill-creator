import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const samplingBias: RosettaConcept = {
  id: 'math-sampling-bias',
  name: 'Sampling & Bias',
  domain: 'math',
  description:
    'A sample is a subset of a population used to make inferences about the whole. Random sampling ' +
    'gives every member an equal chance of selection and minimizes bias. Common sources of bias include ' +
    'convenience sampling, voluntary response bias, and undercoverage. Understanding sampling is essential ' +
    'for evaluating survey results and scientific studies.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-descriptive-statistics',
      description: 'Sampling produces data that is then analyzed using descriptive statistics',
    },
    {
      type: 'analogy',
      targetId: 'sci-experimental-controls',
      description: 'Random sampling in statistics parallels experimental controls in science -- both minimize confounding',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};
