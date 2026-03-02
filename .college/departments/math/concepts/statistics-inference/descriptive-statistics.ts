import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const descriptiveStatistics: RosettaConcept = {
  id: 'math-descriptive-statistics',
  name: 'Descriptive Statistics',
  domain: 'math',
  description:
    'Descriptive statistics summarize a dataset\'s key features. Measures of center (mean, median, mode) ' +
    'describe typical values; measures of spread (range, interquartile range, standard deviation) describe ' +
    'variability. The shape of a distribution (symmetric, skewed, bimodal) matters for choosing which ' +
    'measures are appropriate. No single number captures the whole story -- center and spread together.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-data-representation',
      description: 'Descriptive statistics summarize the datasets organized through data collection and display',
    },
    {
      type: 'analogy',
      targetId: 'stat-descriptive-statistics',
      description: 'Applied statistics uses these same measures for real-world datasets and decision-making',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
