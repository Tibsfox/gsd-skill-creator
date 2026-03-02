import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const distributions: RosettaConcept = {
  id: 'stat-distributions',
  name: 'Probability Distributions',
  domain: 'statistics',
  description:
    'A probability distribution describes all possible values and their associated probabilities for a random variable. ' +
    'The normal (bell curve) distribution is central to statistics due to the Central Limit Theorem. ' +
    'Other key distributions: binomial (count of successes), Poisson (rare events), uniform (equal probability). ' +
    'Understanding distributions allows reasoning about what outcomes are expected and how surprising an observation is.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-basic-probability',
      description: 'Distributions formalize basic probability into a complete mathematical description of a random variable',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.3025 + 0.4225),
    angle: Math.atan2(0.65, 0.55),
  },
};
