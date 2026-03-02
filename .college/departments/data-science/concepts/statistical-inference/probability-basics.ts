import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const probabilityBasics: RosettaConcept = {
  id: 'data-probability-basics',
  name: 'Probability Basics',
  domain: 'data-science',
  description: 'Probability quantifies uncertainty: P(event) = favorable outcomes / total outcomes. ' +
    'P ranges from 0 (impossible) to 1 (certain). P(A or B) = P(A) + P(B) - P(A and B). ' +
    'P(A and B) = P(A) * P(B) if A and B are independent. ' +
    'Conditional probability P(A|B): probability of A given B occurred. ' +
    'Bayes\' theorem: P(A|B) = P(B|A)*P(A)/P(B) -- how to update beliefs with new evidence. ' +
    'Key distinction: frequentist (probability as long-run frequency of repeatable events) ' +
    'vs. Bayesian (probability as degree of belief, updated with evidence). ' +
    'Common misunderstanding: a fair coin that flipped heads 5 times in a row has P(heads)=0.5 on flip 6 -- ' +
    'each flip is independent (gambler\'s fallacy).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-ratios',
      description: 'Probability is a ratio -- the mathematical foundation is proportional reasoning',
    },
    {
      type: 'dependency',
      targetId: 'data-hypothesis-testing',
      description: 'Hypothesis testing is built on probability -- the p-value is a conditional probability',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
