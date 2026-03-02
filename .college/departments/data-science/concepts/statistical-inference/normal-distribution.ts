import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const normalDistribution: RosettaConcept = {
  id: 'data-normal-distribution',
  name: 'Normal Distribution',
  domain: 'data-science',
  description: 'The bell curve: symmetric, described completely by mean (μ) and standard deviation (σ). ' +
    '68-95-99.7 rule: 68% of values within 1σ of mean, 95% within 2σ, 99.7% within 3σ. ' +
    'Z-score: (x - μ) / σ -- transforms any normally distributed value to standard units. ' +
    'Central Limit Theorem (CLT): the most important theorem in statistics. ' +
    'The sampling distribution of the mean approaches normal as sample size increases, ' +
    'regardless of the original distribution shape. ' +
    'CLT is why the normal distribution is everywhere in statistics -- ' +
    'means and totals of many independent random variables become normal. ' +
    'Not everything is normal: income, reaction times, and city sizes are right-skewed.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-measures-of-spread',
      description: 'Standard deviation is the parameter defining the normal distribution\'s spread',
    },
    {
      type: 'cross-reference',
      targetId: 'math-exponential-decay',
      description: 'The normal distribution\'s probability density function contains e^(-x²) -- exponential decay in the tails',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
