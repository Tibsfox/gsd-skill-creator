import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const confidenceIntervals: RosettaConcept = {
  id: 'data-confidence-intervals',
  name: 'Confidence Intervals',
  domain: 'data-science',
  description: 'A range of values that, with specified confidence (usually 95%), contains the true population parameter. ' +
    'A 95% CI means: if we repeated this experiment 100 times, 95 of the intervals would contain the true value. ' +
    'NOT the probability that the true value is in this specific interval -- it either is or is not. ' +
    'Width of CI depends on: sample size (larger = narrower), variability (higher = wider), confidence level (higher % = wider). ' +
    'A CI that does not include 0 for a difference is equivalent to a significant hypothesis test at α=0.05. ' +
    'CIs communicate uncertainty better than p-values alone -- they show both direction and magnitude of effect. ' +
    '"An apple a day keeps the doctor away" -- a CI of [-0.1, 0.2 visits] tells you the true effect is close to zero.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-hypothesis-testing',
      description: 'Confidence intervals and hypothesis tests are mathematically dual -- use both for complete inference',
    },
    {
      type: 'cross-reference',
      targetId: 'data-sampling-methods',
      description: 'CI width depends on sample size -- the statistical justification for larger samples',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.09 + 0.64),
    angle: Math.atan2(0.8, 0.3),
  },
};
