import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const probabilityFoundations: RosettaConcept = {
  id: 'math-probability-foundations',
  name: 'Probability Foundations',
  domain: 'math',
  description:
    'Probability measures the likelihood of an event on a scale from 0 (impossible) to 1 (certain). ' +
    'A sample space lists all possible outcomes; events are subsets of outcomes. Basic probability ' +
    'rules (complement, addition for mutually exclusive events, multiplication for independent events) ' +
    'enable calculating probabilities from first principles rather than just intuition.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-fractions-ratios',
      description: 'Probability is expressed as a fraction (favorable outcomes / total outcomes)',
    },
    {
      type: 'dependency',
      targetId: 'math-experimental-probability',
      description: 'Theoretical probability is compared to experimental results to build intuition',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
