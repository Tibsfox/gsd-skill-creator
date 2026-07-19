/**
 * Optimal Transport concept -- the cheapest way to move one distribution onto another.
 *
 * Calculus wing: variational structure on the space of probability measures.
 * Optimal transport (Monge 1781; Kantorovich 1942) minimises the cost of
 * rearranging one probability distribution into another; the minimum cost is a
 * Wasserstein distance, and gradient flows in that geometry realise nonlinear
 * diffusion PDEs. Surfaced for the College from the June-2026 arXiv survey
 * arXiv:2606.30053, which frames OT as the common backbone of diffusion models,
 * flow matching, and the Schrödinger bridge in generative modelling.
 *
 * @module departments/mathematics/concepts/optimal-transport
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 8 * 2pi/31 ~ 1.62 rad (advanced / abstract: a research backbone), radius ~0.88
const theta = 8 * 2 * Math.PI / 31;
const radius = 0.88;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const optimalTransport: RosettaConcept = {
  id: 'math-optimal-transport',
  name: 'Optimal Transport',
  domain: 'mathematics',
  description: 'The cheapest way to move one probability distribution onto another. ' +
    'Monge (1781) asked for a transport map minimising total cost; Kantorovich (1942) ' +
    'relaxed it to a coupling, exposing a linear program with a dual pair of potentials. ' +
    'The minimum cost is the Wasserstein distance, a genuine metric on probability measures, ' +
    'and steepest descent in Wasserstein geometry (the JKO scheme) recovers the heat and ' +
    'Fokker-Planck equations as gradient flows. The same backbone links diffusion models, ' +
    'flow matching, and the Schrödinger bridge (arXiv:2606.30053, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom, optimal transport is a cost matrix C[i,j] between two weighted point clouds; the discrete Monge case is scipy.optimize.linear_sum_assignment, and the entropic-regularised plan is a few Sinkhorn iterations of alternating row/column rescaling (ot.sinkhorn in POT). ' +
        'The Wasserstein distance falls out as a single tensor contraction sum(P * C). ' +
        'See Peyre & Cuturi 2019.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ stores the cost matrix as a contiguous row-major buffer and owns the transport plan through an RAII solver handle; the network-simplex or auction algorithm computes the exact coupling, while the Sinkhorn loop keeps its kernel and marginals in preallocated Eigen arrays so no allocation happens inside the fixed-point iteration. ' +
        'A templated cost functor abstracts the ground metric. ' +
        'See Peyre & Cuturi 2019.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(optimal-plan mu nu cost) returns an s-expression coupling; homoiconicity lets (with-kantorovich-dual plan ...) rewrite the primal transport into (list (potential-f) (potential-g)) at macro-expansion time, exposing duality as a symbolic transform. ' +
        'Wasserstein gradient flow is then a higher-order operator composed with the entropy functional, so JKO stepping is combinator application, not a runtime branch. ' +
        'See Peyre & Cuturi 2019.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-ollivier-ricci-curvature',
      description: 'Ollivier-Ricci curvature is defined as an optimal-transport (Wasserstein-1) cost between the lazy random-walk measures at two neighbouring vertices',
    },
    {
      type: 'cross-reference',
      targetId: 'math-scale-critical-equations',
      description: 'Nonlinear diffusion and aggregation PDEs arise as Wasserstein gradient flows (the JKO scheme), tying optimal transport to the department\'s scale-critical dynamics',
    },
    {
      type: 'dependency',
      targetId: 'math-exponential-decay',
      description: 'The heat equation is the Wasserstein gradient flow of entropy, so optimal-transport geometry governs exponential relaxation to equilibrium',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
