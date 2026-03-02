import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const algorithmicThinking: RosettaConcept = {
  id: 'prob-algorithmic-thinking',
  name: 'Algorithmic Thinking',
  domain: 'problem-solving',
  description:
    'Algorithmic thinking creates step-by-step procedures that reliably produce a correct result. ' +
    'An algorithm is deterministic (same inputs always produce same outputs), finite (terminates), ' +
    'and complete (handles all valid inputs). Algorithmic thinking is foundational to computer science ' +
    'but applies broadly: recipes, legal procedures, and assembly instructions are all algorithms. ' +
    'Writing an algorithm forces precision — vague thinking produces ambiguous instructions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-decomposition',
      description: 'Algorithms are constructed by decomposing a problem into ordered, deterministic steps',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
