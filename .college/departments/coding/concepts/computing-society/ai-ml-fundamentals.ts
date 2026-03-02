import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const aiMlFundamentals: RosettaConcept = {
  id: 'code-ai-ml-fundamentals',
  name: 'AI & Machine Learning Fundamentals',
  domain: 'coding',
  description: 'Machine learning is the practice of training statistical models on data to make predictions, ' +
    'rather than writing explicit rules. Supervised learning: labeled examples teach the model ' +
    '(email spam detection). Unsupervised learning: find patterns in unlabeled data (customer segmentation). ' +
    'Reinforcement learning: learn from rewards and penalties (game playing, robotics). ' +
    'Neural networks: layers of interconnected nodes inspired loosely by neurons. ' +
    'Large language models (LLMs) are transformer neural networks trained on text at massive scale. ' +
    'Key limitations: models fail outside training distribution, hallucinate confidently, ' +
    'amplify training data biases, and are opaque (hard to explain why they decided X).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-algorithmic-bias',
      description: 'ML models inherit and amplify biases from training data -- a data science and coding concern',
    },
    {
      type: 'cross-reference',
      targetId: 'data-probability-basics',
      description: 'ML models are probabilistic -- output is a probability distribution over possible answers',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
