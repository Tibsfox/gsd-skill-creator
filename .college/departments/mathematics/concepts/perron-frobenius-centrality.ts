/**
 * Perron-Frobenius Centrality concept -- eigenvector node importance on a network.
 *
 * Algebra wing: the spectral linear algebra behind ranking.
 * The Perron-Frobenius theorem (Perron 1907; Frobenius 1912) guarantees a
 * non-negative irreducible matrix a unique largest real eigenvalue with a
 * strictly positive eigenvector; that eigenvector is eigenvector centrality,
 * and its damped Markov cousin is PageRank. Surfaced for the College from the
 * June-2026 arXiv paper 2606.12026, which generalises the guarantee to
 * complex-valued edge weights.
 *
 * @module departments/mathematics/concepts/perron-frobenius-centrality
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 4 * 2pi/31 ~ 0.81 rad (concrete/applied: PageRank), radius ~0.82
const theta = 4 * 2 * Math.PI / 31;
const radius = 0.82;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const perronFrobeniusCentrality: RosettaConcept = {
  id: 'math-perron-frobenius-centrality',
  name: 'Perron-Frobenius Centrality',
  domain: 'mathematics',
  description: 'A node is important if its important neighbours point to it -- a circular ' +
    'definition the Perron-Frobenius theorem makes well-posed. For a non-negative irreducible ' +
    'adjacency matrix (Perron 1907; Frobenius 1912) there is a unique largest real eigenvalue ' +
    'whose eigenvector is strictly positive; that eigenvector is eigenvector centrality, and ' +
    'power iteration converges to it. Damping it into a stochastic matrix gives PageRank, and ' +
    'the two-mode version gives hubs-and-authorities. A generalized Perron-Frobenius property ' +
    'extends the guarantee to complex-valued matrices, yielding generalized eigenvector-based ' +
    'centrality measures for the complex-weighted networks of quantum information, quantum ' +
    'chemistry, electrodynamics, and machine learning (arXiv:2606.12026, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom, centrality is the fixed point of repeatedly applying the adjacency matrix: v = A @ v / norm(A @ v) until convergence -- power iteration onto the dominant eigenvector. ' +
        'networkx.eigenvector_centrality and pagerank wrap this, the latter adding a damping factor to make A column-stochastic so a random surfer\'s stationary distribution exists. ' +
        'See Newman 2010.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ stores a large graph as a sparse CSR adjacency (Eigen::SparseMatrix) and runs power iteration with an in-place normalise so each sparse mat-vec reuses one preallocated buffer; a Lanczos/Arnoldi step recovers the leading eigenpair when a spectral gap is small. ' +
        'A templated scalar swaps double for std::complex to carry the complex-weight generalization. ' +
        'See Newman 2010.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(dominant-eigenvector A) is the fixed point of the higher-order operator (iterate (lambda (v) (normalize (matrix*vector A v)))); centrality is thus a combinator, not a loop. ' +
        'PageRank reads as (stationary (damp A alpha)) -- a Markov transform of the adjacency -- so the ranking is the fixed point of a symbolically composed operator applied to the uniform distribution. ' +
        'See Newman 2010.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-ollivier-ricci-curvature',
      description: 'Both assign scalar structure to a graph -- Ollivier-Ricci a curvature to each edge, Perron-Frobenius a centrality to each node',
    },
    {
      type: 'cross-reference',
      targetId: 'math-euler-formula',
      description: 'The generalized complex-weight Perron-Frobenius theorem places the leading eigenvalue\'s phase on the unit circle e^(i*theta)',
    },
    {
      type: 'dependency',
      targetId: 'math-ratios',
      description: 'Eigenvector centrality expresses each node\'s importance as a proportion of its neighbours\' importances -- a fixed point of proportional reasoning',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
