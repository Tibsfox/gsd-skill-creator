/**
 * Information Geometry concept -- a family of probability distributions read as a curved manifold.
 *
 * Geometry wing: Riemannian structure on the space of statistical models.
 * Information geometry (Amari & Nagaoka 2000) equips a parametric family of
 * probability distributions with the Fisher information as a Riemannian metric
 * and a dually-flat pair of connections (the exponential e-connection and the
 * mixture m-connection). Surfaced for the College from the June-2026 arXiv
 * study arXiv:2606.06395, which characterises totally-umbilical submanifolds of
 * a statistical manifold -- surface-theory geometry transferred to statistics.
 *
 * @module departments/mathematics/concepts/information-geometry
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 11 * 2pi/31 ~ 2.23 rad (advanced / abstract: geometry of statistical models), radius ~0.9
const theta = 11 * 2 * Math.PI / 31;
const radius = 0.9;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const informationGeometry: RosettaConcept = {
  id: 'math-information-geometry',
  name: 'Information Geometry',
  domain: 'mathematics',
  description: 'A family of probability distributions -- the probability simplex, an exponential ' +
    'family, a statistical model -- read as a Riemannian manifold whose metric is the Fisher ' +
    'information. The manifold carries a dually-flat structure: a conjugate pair of torsion-free ' +
    'connections, the exponential (e-) and mixture (m-) connections, dual through the Fisher metric. ' +
    'From this the Fisher-Rao distance, the Kullback-Leibler divergence as a canonical dually-flat ' +
    'divergence, and the Pythagorean projection theorem all follow. That geometry lets surface-theory ' +
    'notions transfer verbatim to statistics. A submanifold is totally-umbilical when its second ' +
    'fundamental form is proportional to the metric (h = lambda*g), the analogue of a sphere inside ' +
    'Euclidean space; but a statistical manifold carries two dual connections, so umbilicity becomes a ' +
    'paired condition, and a doubly totally-umbilical submanifold is umbilical under both the e- and ' +
    'm-connections. Furuhata\'s 2026 study gives a complete classification of the doubly ' +
    'totally-umbilical submanifolds of the probability simplex (Amari & Nagaoka 2000; ' +
    'arXiv:2606.06395, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom a statistical manifold is an array of parameters theta; the Fisher information metric g[i,j] = E[d_i log p * d_j log p] is one np.einsum over score vectors sampled across a batch. ' +
        'Fisher-Rao distance is a scipy quadrature of sqrt(dtheta @ g @ dtheta) along a path, and a list comprehension over a grid of thetas tiles the simplex with its curved metric. ' +
        'See Amari & Nagaoka 2000.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ keeps the parameter vector and the Fisher metric in a contiguous Eigen matrix owned by an RAII manifold handle; a templated Connection functor picks the e-connection or m-connection at compile time, so the dually-flat structure costs no runtime branch. ' +
        'Christoffel symbols fill a preallocated rank-3 buffer the geodesic integrator reuses with no allocation per step. ' +
        'See Amari & Nagaoka 2000.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(fisher-metric model theta) returns an s-expression tensor; homoiconicity lets (with-dual-connection model ...) rewrite a primal e-geodesic into its m-flat conjugate at macro-expansion time, so duality is a symbolic transform rather than a solver call. ' +
        'An exponential family is just its natural-parameter list, and a totally-umbilical submanifold is a subtree the macro folds shut. ' +
        'See Amari & Nagaoka 2000.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-ollivier-ricci-curvature',
      description: 'A statistical manifold carries Riemannian curvature from its Fisher metric; Ollivier-Ricci curvature is the discrete analogue defined on the graph underlying a probabilistic model',
    },
    {
      type: 'cross-reference',
      targetId: 'math-optimal-transport',
      description: 'Two distinct geometries on the space of probability measures: the Fisher-Rao metric of information geometry and the Wasserstein metric of optimal transport',
    },
    {
      type: 'dependency',
      targetId: 'math-exponential-decay',
      description: 'Exponential families are the dually-flat natural coordinates of information geometry; the exponential map organises its e-connection and its geodesics',
    },
    {
      type: "cross-reference",
      targetId: "math-bregman-projection",
      description: "Bregman projection is the concrete divergence face of information geometry's dually-flat structure: the Bregman divergence IS the canonical divergence of a dually-flat manifold, and the generalized-Pythagorean projection is the operational content of the dual-flatness this concept describes, so the near-duplicate pair should be mutually linked.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
