import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const patternRecognition: RosettaConcept = {
  id: 'code-pattern-recognition',
  name: 'Pattern Recognition',
  domain: 'coding',
  description: 'Identifying similarities, trends, and regularities in problems that allow ' +
    'you to apply known solutions to new instances. When you recognize that "reverse a string", ' +
    '"find the maximum", and "check for palindrome" all follow the iteration pattern, you stop ' +
    'solving each from scratch. Design patterns (Factory, Observer, Strategy) are formalized ' +
    'programming patterns. Algorithm patterns (divide-and-conquer, dynamic programming) are ' +
    'higher-level abstractions. Pattern recognition is what separates an experienced developer ' +
    'from a novice facing an apparently new problem.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-abstraction',
      description: 'Patterns are abstractions -- recognizing them requires seeing past surface differences to structural similarity',
    },
    {
      type: 'cross-reference',
      targetId: 'log-pattern-recognition',
      description: 'Pattern recognition is foundational to both coding and formal logic -- same cognitive skill, different domains',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
