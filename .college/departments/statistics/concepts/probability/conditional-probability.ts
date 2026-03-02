import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const conditionalProbability: RosettaConcept = {
  id: 'stat-conditional-probability',
  name: 'Conditional Probability & Bayes',
  domain: 'statistics',
  description:
    'Conditional probability P(A|B) is the probability of A given that B has occurred. ' +
    'It captures how new information updates probability estimates. ' +
    'Bayes\' theorem: P(A|B) = P(B|A) × P(A) / P(B) — formally expresses how evidence updates belief. ' +
    'Counter-intuitive results (the base rate fallacy, medical test interpretation) arise from ' +
    'failing to apply conditional reasoning correctly. This is one of the most practically important concepts in statistics.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-basic-probability',
      description: 'Conditional probability extends basic probability to account for dependence between events',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
