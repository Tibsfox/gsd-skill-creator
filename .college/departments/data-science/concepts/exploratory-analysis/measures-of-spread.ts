import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const measuresOfSpread: RosettaConcept = {
  id: 'data-measures-of-spread',
  name: 'Measures of Spread',
  domain: 'data-science',
  description: 'Summary statistics describing how spread out values are around the center. ' +
    'Range: max minus min -- simple but dominated by outliers. ' +
    'Interquartile range (IQR): Q3 minus Q1 -- the middle 50% of data, robust to outliers. ' +
    'Variance: average squared deviation from mean -- sensitive to outliers, in squared units. ' +
    'Standard deviation: square root of variance -- back in original units. ' +
    '68-95-99.7 rule: for normal distributions, 68% of values within 1 SD, 95% within 2, 99.7% within 3. ' +
    'Box plots visualize Q1, median, Q3, and outliers in a single chart. ' +
    'Two distributions with the same mean but different spreads tell completely different stories.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-measures-of-center',
      description: 'Spread is measured relative to center -- standard deviation is deviation from the mean',
    },
    {
      type: 'cross-reference',
      targetId: 'data-normal-distribution',
      description: 'Standard deviation defines the normal distribution -- the 68-95-99.7 rule applies only to normal distributions',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
