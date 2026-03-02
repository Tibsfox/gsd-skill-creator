import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const decomposition: RosettaConcept = {
  id: 'prob-decomposition',
  name: 'Problem Decomposition',
  domain: 'problem-solving',
  description:
    'Decomposition is breaking a complex problem into smaller, more manageable sub-problems. ' +
    'Large problems are often intractable as wholes but tractable piece-by-piece. ' +
    'Computational thinking uses decomposition as a foundational strategy. ' +
    'Key skill: decomposing without losing sight of how the pieces interact. ' +
    'A solution to each piece must ultimately fit together into a coherent whole solution.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-problem-definition',
      description: 'Decomposition requires a clear problem definition to know what to break apart',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.5625 + 0.1225),
    angle: Math.atan2(0.35, 0.75),
  },
};
