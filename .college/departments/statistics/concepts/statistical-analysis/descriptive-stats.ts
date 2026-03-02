import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const descriptiveStats: RosettaConcept = {
  id: 'stat-descriptive-stats',
  name: 'Descriptive Statistics',
  domain: 'statistics',
  description:
    'Descriptive statistics summarize and describe data without making inferences about a larger population. ' +
    'Measures of center: mean (average), median (middle value), mode (most frequent). ' +
    'Measures of spread: range, variance, standard deviation, interquartile range. ' +
    'Choosing appropriate measures requires knowing data distribution — the mean is misleading for skewed data. ' +
    'Visual tools: histograms, box plots, scatter plots complement numerical summaries.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-distributions',
      description: 'Descriptive statistics are summaries of the underlying probability distribution of observed data',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
