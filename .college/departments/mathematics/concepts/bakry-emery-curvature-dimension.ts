/**
 * Bakry-Émery Curvature-Dimension concept -- Ricci curvature via Bochner/Gamma-calculus, not transport.
 *
 * Geometry wing: differential-operator structure on graphs and Markov generators.
 * The Bakry-Émery curvature-dimension condition CD(K,N) (Bakry & Émery 1985)
 * recasts a Ricci lower bound as an operator inequality on the heat-semigroup
 * generator: the iterated carre du champ Gamma_2 must dominate K*Gamma plus a
 * dimensional term (1/N)(Lf)^2. Surfaced for the College from arXiv:2606.11094
 * (2026), which develops the discrete graph version and shows that non-negative
 * curvature forces polynomial volume growth -- a route distinct from the
 * optimal-transport Ollivier-Ricci curvature the department already teaches.
 *
 * @module departments/mathematics/concepts/bakry-emery-curvature-dimension
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 10 * 2pi/31 ~ 2.03 rad (advanced / abstract: a geometric curvature frontier), radius 0.9
const theta = 10 * 2 * Math.PI / 31;
const radius = 0.9;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const bakryEmeryCurvatureDimension: RosettaConcept = {
  id: 'math-bakry-emery-curvature-dimension',
  name: 'Bakry-Émery Curvature-Dimension',
  domain: 'mathematics',
  description: 'A discrete formalisation of Ricci curvature through the Bochner method rather than ' +
    'optimal transport. Bakry and Émery (1985) recast a Ricci lower bound as an operator inequality ' +
    'on the heat-semigroup generator: with the carre du champ Gamma(f) = 0.5*(L(f^2) - 2f*Lf) and its ' +
    'iterate Gamma_2, the curvature-dimension condition CD(K,N) demands Gamma_2(f) >= K*Gamma(f) + ' +
    '(1/N)(Lf)^2 for every f. On a graph L is the Laplacian, so CD(K,N) turns curvature into a ' +
    'per-vertex semidefinite test, the discrete shadow of the Bochner formula Gamma_2 = |Hess f|^2 + ' +
    'Ric(grad f). Non-negative curvature forces polynomial volume growth, a discrete Bishop-Gromov ' +
    'bound, distinguishing this transport-free route from Ollivier-Ricci curvature (arXiv:2606.11094, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy the generator L is a sparse graph Laplacian; the carre du champ Gamma(f,g)=0.5*(L@(f*g)-f*(L@g)-g*(L@f)) is one broadcast expression and Gamma2 iterates the same pattern. The CD(K,N) test becomes a per-vertex check that Gamma2 - K*Gamma - (1/N)*outer(Lf,Lf) is positive semidefinite, screened with scipy.linalg.eigvalsh over the local forms. ' +
        'See Bakry & Émery 1985.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ keeps the sparse Laplacian in a CSR buffer and evaluates Gamma and Gamma2 as contiguous matrix-vector kernels with no per-vertex allocation. An RAII solver handle owns each local curvature form, and a templated scalar lets the CD(K,N) semidefinite test run in float or double; Eigen SelfAdjointEigenSolver certifies Gamma2 >= K*Gamma + (1/N)(Lf)^2 vertex by vertex. ' +
        'See Bakry & Émery 1985.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(gamma-2 L f) unfolds as (carre-du-champ L (carre-du-champ L f)); homoiconicity lets a (define-bochner ...) macro expand the identity Gamma2 = |Hess f|^2 + Ric into its symbolic sum at macro-expansion time, so CD(K,N) reads as the quoted form (>= (gamma-2 f) (+ (* K (gamma f)) (/ (square (L f)) N))) -- curvature-dimension as one rewritable s-expression. ' +
        'See Bakry & Émery 1985.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-ollivier-ricci-curvature',
      description: 'The department\'s other discrete Ricci curvature: Ollivier-Ricci is read off optimal transport of random-walk measures, Bakry-Émery off the Bochner/Gamma-calculus of the graph Laplacian',
    },
    {
      type: 'cross-reference',
      targetId: 'math-optimal-transport',
      description: 'Ollivier-Ricci is built on optimal transport; Bakry-Émery is the transport-free, heat-semigroup route to the same curvature-dimension intuition',
    },
    {
      type: 'dependency',
      targetId: 'math-exponential-decay',
      description: 'Non-negative Bakry-Émery curvature controls the heat semigroup, yielding exponential-type gradient contraction and the volume-growth estimates that bound relaxation to equilibrium',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
