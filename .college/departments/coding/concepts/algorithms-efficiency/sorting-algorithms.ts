import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sortingAlgorithms: RosettaConcept = {
  id: 'code-sorting-algorithms',
  name: 'Sorting Algorithms',
  domain: 'coding',
  description: 'Algorithms for arranging elements in order. Bubble sort (O(n²)): repeatedly swap ' +
    'adjacent out-of-order pairs -- simple to understand, terrible in practice. ' +
    'Merge sort (O(n log n)): divide array in half, sort each half recursively, merge -- ' +
    'guaranteed O(n log n) even in worst case. ' +
    'Quicksort (O(n log n) average, O(n²) worst): pick a pivot, partition around it, recurse -- ' +
    'fast in practice but fragile. ' +
    'Timsort (Python\'s sort): merge sort + insertion sort hybrids optimized for real-world data. ' +
    'Sorting is the gateway algorithm: understanding why merge sort is better than bubble sort ' +
    'teaches algorithmic thinking and Big-O reasoning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-big-o-notation',
      description: 'Sorting algorithms are compared using Big-O complexity analysis',
    },
    {
      type: 'cross-reference',
      targetId: 'math-logarithmic-scales',
      description: 'O(n log n) algorithms leverage logarithmic scaling -- merge sort splits arrays log(n) deep',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
