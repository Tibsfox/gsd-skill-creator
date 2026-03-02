import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const samplingSurveys: RosettaConcept = {
  id: 'stat-sampling-surveys',
  name: 'Sampling & Survey Design',
  domain: 'statistics',
  description:
    'Statistical inference requires a representative sample from the population of interest. ' +
    'Sampling methods include simple random sampling, stratified sampling, cluster sampling, and systematic sampling. ' +
    'Poor survey design introduces bias: leading questions, non-response bias, social desirability bias, and ' +
    'sampling frame problems. Polls and surveys cited in media must be critically evaluated for these issues.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-hypothesis-testing',
      description: 'Hypothesis tests are only valid if the underlying data came from a properly designed sample',
    },
    {
      type: 'cross-reference',
      targetId: 'sci-sampling-bias',
      description: 'Sampling bias in statistics is the same concept as in experimental science — systematic skew in sample selection',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
