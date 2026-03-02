import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const samplingBias: RosettaConcept = {
  id: 'data-sampling-bias',
  name: 'Sampling Bias',
  domain: 'data-science',
  description: 'Sampling bias occurs when the sample is systematically different from the population, ' +
    'making generalizations invalid. ' +
    'Selection bias: the method of selecting participants skews the sample (voluntary response surveys attract strong opinions). ' +
    'Survivorship bias: analyzing only survivors (studying successful companies, ignoring bankrupt ones). ' +
    'Non-response bias: people who refuse to respond differ systematically from those who respond. ' +
    'Literary Digest 1936 poll predicted Landon over Roosevelt by 57-43% using 2.4 million responses -- ' +
    'but phone and car owners (who were sampled) skewed Republican. Roosevelt won 62-38%. ' +
    'Large biased samples are worse than small unbiased samples.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-algorithmic-bias',
      description: 'Training data sampling bias becomes model bias -- the most important data ethics connection',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-cognitive-biases',
      description: 'Confirmation bias (a cognitive bias) leads researchers to design sampling methods that confirm their expectations',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};
