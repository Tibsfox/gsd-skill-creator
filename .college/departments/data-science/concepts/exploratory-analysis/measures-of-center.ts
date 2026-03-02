import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const measuresOfCenter: RosettaConcept = {
  id: 'data-measures-of-center',
  name: 'Measures of Center',
  domain: 'data-science',
  description: 'Summary statistics that describe a typical value in a dataset. ' +
    'Mean: sum divided by count -- sensitive to outliers. The mean salary at a company ' +
    'is skewed up by a few executives. ' +
    'Median: middle value when sorted -- robust to outliers. ' +
    'Mode: most frequent value -- only meaningful for categorical or discrete data. ' +
    'When to use each: use median for skewed distributions (income, home prices, reaction times). ' +
    'Use mean when distribution is symmetric and outliers are genuine data. ' +
    '"Average" is ambiguous -- always specify which average you mean. ' +
    'Politicians choose the statistic that supports their narrative -- learn to ask "which average?"',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-measures-of-spread',
      description: 'Center alone is incomplete -- a distribution needs both center and spread to be described',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-gdp-growth',
      description: 'GDP per capita is a mean that hides inequality -- the same limitation as mean vs. median income',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
