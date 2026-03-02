import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const experimentalProbability: RosettaConcept = {
  id: 'math-experimental-probability',
  name: 'Experimental Probability & the Law of Large Numbers',
  domain: 'math',
  description:
    'Experimental probability is the ratio of observed favorable outcomes to total trials. ' +
    'The law of large numbers states that experimental probability approaches theoretical probability ' +
    'as the number of trials increases. This explains why small samples can be misleading and why ' +
    'repeated experiments are essential for reliable empirical conclusions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-probability-foundations',
      description: 'Experimental probability is compared to the theoretical probability baseline',
    },
    {
      type: 'analogy',
      targetId: 'sci-replication-reliability',
      description: 'The law of large numbers mirrors science\'s requirement for replication to establish reliability',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
