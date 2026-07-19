/**
 * Perron-Frobenius Centrality try-session -- first hands-on contact with eigenvector ranking.
 *
 * Walk a learner from the circular "important neighbours" intuition to power
 * iteration, the Perron-Frobenius guarantee, and PageRank as a damped Markov chain.
 *
 * @module departments/mathematics/try-sessions/perron-frobenius-centrality
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const perronFrobeniusCentralitySession: TrySessionDefinition = {
  id: 'math-perron-frobenius-centrality-first-steps',
  title: 'Perron-Frobenius Centrality: Ranking Nodes by Their Neighbours',
  description:
    'A guided first pass through eigenvector centrality: pose the circular definition of ' +
    'importance, resolve it with power iteration, see why Perron-Frobenius guarantees a unique ' +
    'positive answer, and read PageRank as a damped random walk.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Draw a small directed graph of 5 nodes and write its adjacency matrix A (A[i,j] = 1 if j points to i). Propose a definition: a node is important if important nodes point to it, so importance(i) = sum over j pointing to i of importance(j). Why is this definition circular, and what kind of equation is it?',
      expectedOutcome:
        'You recognise the definition as self-referential and rewrite it as the eigenvector equation A v = lambda v: the importance vector is an eigenvector of the adjacency matrix.',
      hint: 'Stack the per-node equations into matrix form. importance = A applied to importance, up to a scale.',
      conceptsExplored: ['math-perron-frobenius-centrality'],
    },
    {
      instruction:
        'Resolve the circularity by iterating. Start from the uniform vector v0 = (1,1,1,1,1), compute v1 = A v0, normalise, then v2 = A v1, normalise, and repeat five or six times. Watch the vector settle. What is it converging to?',
      expectedOutcome:
        'You observe power iteration converging to the dominant eigenvector — the eigenvector centrality — and see the ranking of nodes stabilise after a few steps.',
      hint: 'Repeated multiplication amplifies the largest-eigenvalue direction; normalising each step keeps the numbers bounded.',
      conceptsExplored: ['math-perron-frobenius-centrality'],
    },
    {
      instruction:
        'Ask when this is guaranteed to work. State the Perron-Frobenius theorem: for a non-negative, irreducible matrix there is a unique largest real eigenvalue whose eigenvector can be chosen strictly positive. Which property of your graph makes A irreducible, and why does positivity of the eigenvector matter for a centrality score?',
      expectedOutcome:
        'You connect irreducibility to strong connectivity (every node reachable from every other) and explain that a strictly positive eigenvector means every node gets a meaningful, sign-consistent score rather than a mix of signs.',
      hint: 'Irreducible <=> the graph is strongly connected. A negative centrality would be meaningless; Perron-Frobenius rules it out.',
      conceptsExplored: ['math-perron-frobenius-centrality', 'math-ratios'],
    },
    {
      instruction:
        'Turn eigenvector centrality into PageRank. Make A column-stochastic (each column sums to 1) and mix it with a uniform teleport: M = alpha S + (1 - alpha) (1/n) J, with damping alpha around 0.85. Compute the dominant eigenvector of M. What does the stationary distribution of this Markov chain represent?',
      expectedOutcome:
        'You interpret PageRank as the stationary distribution of a random surfer who follows links with probability alpha and teleports uniformly with probability 1 - alpha, and you see teleport guarantees irreducibility so the ranking is well-defined.',
      hint: 'The teleport term makes every node reachable, forcing irreducibility and a unique stationary vector.',
      conceptsExplored: ['math-perron-frobenius-centrality'],
    },
    {
      instruction:
        'Explore the two-mode version. On a bipartite-flavoured graph, alternate two updates: hub score = sum of authority scores it points to, authority score = sum of hub scores pointing to it. Iterate. Which matrix products are you now taking power iteration of?',
      expectedOutcome:
        'You identify hubs-and-authorities (HITS) as power iteration on A A^T and A^T A, the same Perron-Frobenius machinery applied to two coupled eigenproblems.',
      hint: 'Substituting one update into the other gives hubs <- A A^T hubs and authorities <- A^T A authorities.',
      conceptsExplored: ['math-perron-frobenius-centrality'],
    },
    {
      instruction:
        'Read the June-2026 generalization: allow complex-valued edge weights and ask for a generalized Perron-Frobenius property. Where does the leading eigenvalue now live, and how does its phase connect to the department\'s complex-analysis concepts?',
      expectedOutcome:
        'You see that with complex weights the leading eigenvalue carries a phase, placing it on the unit circle e^(i*theta), tying centrality back to Euler\'s formula and the complex plane the department is organised around.',
      hint: 'A complex leading eigenvalue is r e^(i*theta); the modulus ranks magnitude, the phase records rotation.',
      conceptsExplored: ['math-perron-frobenius-centrality', 'math-euler-formula'],
    },
    {
      instruction:
        'Close by contrasting two graph scalars the department teaches: Perron-Frobenius centrality assigns a number to each node, while Ollivier-Ricci curvature assigns a number to each edge. Pick one node and one incident edge on your graph and describe what each scalar is measuring.',
      expectedOutcome:
        'You can articulate the complementary roles — node-level importance (spectral, global) versus edge-level curvature (transport-based, local) — as two lenses on the same network.',
      hint: 'Centrality is a global eigenvector property; Ollivier-Ricci curvature is a local optimal-transport comparison of neighbourhoods.',
      conceptsExplored: ['math-perron-frobenius-centrality'],
    },
  ],
};
