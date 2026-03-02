import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const decomposition: RosettaConcept = {
  id: 'code-decomposition',
  name: 'Decomposition',
  domain: 'coding',
  description: 'Breaking a complex problem into smaller, manageable sub-problems that are ' +
    'easier to solve independently and combine into a complete solution. Decomposition is ' +
    'how software engineers manage complexity: you never solve the whole problem at once. ' +
    'A social media app decomposes into: authentication, user profiles, posts, comments, ' +
    'notifications, search. Each sub-problem becomes a module. The art is finding the right ' +
    'boundaries -- cohesive internally, loosely coupled between modules.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-abstraction',
      description: 'After decomposing, each piece becomes an abstraction hiding its internal complexity',
    },
    {
      type: 'analogy',
      targetId: 'code-sequential-thinking',
      description: 'Decomposition works vertically (breadth); sequential thinking works horizontally (depth)',
    },
    {
      type: 'cross-reference',
      targetId: 'math-fractal-geometry',
      description: 'Recursive decomposition reveals self-similar structure at different scales -- like fractals',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
