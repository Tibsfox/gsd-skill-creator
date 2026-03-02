import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const bigONotation: RosettaConcept = {
  id: 'code-big-o-notation',
  name: 'Big-O Notation',
  domain: 'coding',
  description: 'Mathematical notation describing how an algorithm\'s runtime or space requirements ' +
    'grow as input size n increases. O(1): constant time (hash table lookup). ' +
    'O(log n): logarithmic (binary search -- halves the problem each step). ' +
    'O(n): linear (scan all elements). ' +
    'O(n log n): linearithmic (efficient sorting). ' +
    'O(n²): quadratic (nested loops -- bubble sort). ' +
    'O(2^n): exponential (brute force traveling salesman). ' +
    'Big-O ignores constant factors and lower-order terms: O(2n + 5) = O(n). ' +
    'It describes worst-case behavior. ' +
    'The practical import: an O(n²) algorithm on 1M records is 10^12 operations -- unusable. ' +
    'An O(n log n) algorithm on the same data is ~20M operations -- fast.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-logarithmic-scales',
      description: 'O(log n) algorithms grow logarithmically -- the same mathematical property as decibels and the Richter scale',
    },
    {
      type: 'cross-reference',
      targetId: 'math-exponential-decay',
      description: 'Exponential growth (O(2^n)) is the inverse of exponential decay -- both describe dramatically nonlinear behavior',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.09 + 0.64),
    angle: Math.atan2(0.8, 0.3),
  },
};
