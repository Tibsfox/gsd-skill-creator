import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dynamicProgramming: RosettaConcept = {
  id: 'code-dynamic-programming',
  name: 'Dynamic Programming',
  domain: 'coding',
  description: 'An optimization technique for problems with overlapping sub-problems and optimal substructure. ' +
    'Instead of recomputing the same sub-problems repeatedly (exponential), store results and reuse them (polynomial). ' +
    'Classic example: Fibonacci. Naive recursion computes fib(40) millions of times. ' +
    'Memoization (top-down DP): cache fib results. Tabulation (bottom-up DP): build from fib(0) up. ' +
    'Optimal substructure: the optimal solution contains optimal solutions to sub-problems. ' +
    'Applications: shortest path (Dijkstra), sequence alignment (bioinformatics), ' +
    'knapsack problem (resource allocation), text edit distance (spell checkers). ' +
    'DP is the bridge between exponential brute force and polynomial efficiency.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-big-o-notation',
      description: 'DP is valuable because it reduces complexity from exponential to polynomial -- needs Big-O to understand why',
    },
    {
      type: 'dependency',
      targetId: 'code-pattern-recognition',
      description: 'Recognizing when a problem has overlapping sub-problems is the key pattern recognition skill for DP',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.04 + 0.81),
    angle: Math.atan2(0.9, 0.2),
  },
};
