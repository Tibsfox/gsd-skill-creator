import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const confidenceInference: RosettaConcept = {
  id: 'math-confidence-inference',
  name: 'Confidence Intervals & Inference',
  domain: 'math',
  description:
    'Statistical inference uses sample data to draw conclusions about a population while quantifying ' +
    'uncertainty. A confidence interval gives a range of plausible values for a population parameter. ' +
    'Hypothesis testing determines whether observed data is surprising under a null hypothesis. ' +
    'Both require understanding sampling distributions and the role of sample size in precision.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-sampling-bias',
      description: 'Valid inference requires understanding how sampling affects what we can conclude',
    },
    {
      type: 'dependency',
      targetId: 'math-probability-foundations',
      description: 'Confidence levels and p-values are probability statements requiring probability foundations',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.1225 + 0.5625),
    angle: Math.atan2(0.75, 0.35),
  },
};
