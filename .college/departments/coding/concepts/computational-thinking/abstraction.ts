import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const abstraction: RosettaConcept = {
  id: 'code-abstraction',
  name: 'Abstraction',
  domain: 'coding',
  description: 'Hiding complex implementation details behind a simple interface that exposes ' +
    'only what is necessary. A function is an abstraction: you call sort(array) without knowing ' +
    'whether it uses quicksort or mergesort. A class is an abstraction: you call car.start() ' +
    'without knowing about fuel injectors. Abstraction is how humans manage complexity -- ' +
    'you drive without understanding internal combustion. Good abstractions leak nothing ' +
    '(callers never need to know internals) and are stable (change implementation without ' +
    'changing the interface). The leaky abstraction law: all non-trivial abstractions leak ' +
    'eventually (Joel Spolsky).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'diglit-recommendation-systems',
      description: 'Recommendation systems are abstractions over complex algorithms -- users see ratings, not matrix factorization',
    },
    {
      type: 'analogy',
      targetId: 'code-decomposition',
      description: 'Decomposition splits problems apart; abstraction builds interfaces that hide the pieces',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.04 + 0.64),
    angle: Math.atan2(0.8, 0.2),
  },
};
