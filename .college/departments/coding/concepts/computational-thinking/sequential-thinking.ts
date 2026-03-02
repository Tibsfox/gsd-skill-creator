import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sequentialThinking: RosettaConcept = {
  id: 'code-sequential-thinking',
  name: 'Sequential Thinking',
  domain: 'coding',
  description: 'Breaking a task into an ordered sequence of unambiguous steps that a machine ' +
    '(or person) can execute exactly. The foundation of all algorithms: before you write code, ' +
    'you write the recipe. Sequential thinking requires specifying each step precisely enough ' +
    'that no judgment is needed during execution -- the hallmark distinction between human ' +
    'instructions (vague) and algorithmic instructions (exact). Practice: write instructions ' +
    'for making a peanut butter sandwich so literally that a robot could follow them without ' +
    'any guessing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-decomposition',
      description: 'You decompose problems before you can sequence their steps',
    },
    {
      type: 'cross-reference',
      targetId: 'log-argument-structure',
      description: 'Both require ordered, exact specification -- logic proofs and algorithms share this demand for precision',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.64 + 0.01),
    angle: Math.atan2(0.1, 0.8),
  },
};
