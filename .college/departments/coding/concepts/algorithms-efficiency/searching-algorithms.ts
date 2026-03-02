import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const searchingAlgorithms: RosettaConcept = {
  id: 'code-searching-algorithms',
  name: 'Searching Algorithms',
  domain: 'coding',
  description: 'Algorithms for finding elements in data structures. Linear search (O(n)): ' +
    'check each element one by one -- works on any array, slow for large data. ' +
    'Binary search (O(log n)): requires sorted array, check middle element, eliminate half -- ' +
    'dramatically faster. Finding a word in a dictionary: binary search in 17 steps for 100,000 words ' +
    'vs. linear search in 50,000 steps on average. ' +
    'Hash tables (O(1) average): compute a hash of the key, store/retrieve at that index -- ' +
    'behind Python dicts and JavaScript objects. ' +
    'Binary search trees (O(log n)): maintained sorted tree with O(log n) insert/search/delete.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-sorting-algorithms',
      description: 'Binary search requires sorted data -- the two concepts are paired',
    },
    {
      type: 'cross-reference',
      targetId: 'data-sampling-methods',
      description: 'Choosing which element to examine next is a sampling problem in both search and statistical survey design',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
