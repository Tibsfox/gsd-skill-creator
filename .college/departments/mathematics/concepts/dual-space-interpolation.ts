/**
 * Dual-Space Interpolation concept -- interpolation problems unified as linear functionals in a dual space.
 *
 * Algebra wing: the dual of a finite-dimensional function space.
 * Classical interpolation -- Lagrange polynomials, Hermite splines, and the
 * trigonometric/DFT case -- is unified by treating each interpolation condition
 * as a linear functional in the dual V*: interpolation is well-posed exactly
 * when those functionals form a basis of V*, and the dual basis writes the
 * interpolant explicitly. Surfaced for the College from arXiv:2606.22671, which
 * recasts the classical interpolation zoo as one dual-space existence-uniqueness
 * theorem with explicit dual bases that decouple the conditions from the basis.
 *
 * @module departments/mathematics/concepts/dual-space-interpolation
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 3 * 2pi/31 ~ 0.61 rad (foundational / classical: a unifying backbone), radius ~0.78
const theta = 3 * 2 * Math.PI / 31;
const radius = 0.78;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const dualSpaceInterpolation: RosettaConcept = {
  id: 'math-dual-space-interpolation',
  name: 'Dual-Space Interpolation',
  domain: 'mathematics',
  description: 'How do Lagrange polynomials, Hermite splines, and trigonometric interpolation turn out ' +
    'to be one theorem? Each interpolation condition -- evaluate here, match a derivative there, sample ' +
    'this frequency -- is a linear functional on a finite-dimensional function space: point evaluation ' +
    'f -> f(x_k), the Hermite derivative-matching functional f -> f\'(x_k), or a Fourier sample ' +
    'f -> <f, e^(i k x)>. Interpolation is solvable exactly when those functionals form a basis of the ' +
    'dual space, equivalently when the collocation matrix A[i,j] = L_i(phi_j) is invertible -- the Haar ' +
    '(unisolvence) condition, the single existence-uniqueness theorem that replaces a dozen special ' +
    'cases. Its dual basis, pinned by the biorthogonality L_i(psi_j) = delta_ij (the Lagrange cardinal ' +
    'functions, Hermite blending functions, and discrete Fourier transform), writes the interpolant ' +
    'explicitly as f -> sum_i L_i(f) psi_i, decoupling the conditions from whatever basis spans the ' +
    'space (arXiv:2606.22671, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy the interpolation problem is one linear system: build the collocation array A[i,j] = L_i(phi_j) with a list comprehension over functionals L_i and basis phi_j, then np.linalg.solve(A, [L(f) for L in conditions]) returns the coefficients. Point-evaluation functionals make A the Vandermonde matrix; the Lagrange dual basis is the columns of inv(A). ' +
        'See Davis 1975.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'A templated Interpolator<Functional, Basis> owns the collocation matrix as a contiguous row-major buffer; the constructor fills A(i,j) = L_i(phi_j) and RAII-holds one LU factorisation, so repeated right-hand sides reuse it. The dual basis is A^{-1}, computed once; solving for coefficients is a single back-substitution that decouples the conditions from the monomial basis. ' +
        'See Davis 1975.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(interpolate conditions basis f) treats each linear functional as an s-expression; a (define-dual-basis conditions basis) macro expands the collocation matrix (L_i phi_j) and inverts it at macro-expansion time, so the Lagrange dual basis is symbolic, not runtime. The interpolant is (reduce + (map (lambda (L psi) (* (L f) psi)) conditions dual)) -- duality made homoiconic. ' +
        'See Davis 1975.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-trig-functions',
      description: 'Trigonometric interpolation is the special case where the function space is spanned by sines and cosines; reading its sampling conditions as dual-basis functionals unifies it with polynomial interpolation under one existence theorem',
    },
    {
      type: 'cross-reference',
      targetId: 'math-euler-formula',
      description: 'Sampling on the n-th roots of unity makes the interpolation dual basis exactly the discrete Fourier transform, whose kernel is Euler\'s e^(i 2 pi k / n)',
    },
    {
      type: 'cross-reference',
      targetId: 'math-transform-uncertainty-principle',
      description: 'Reconstructing a function from few samples is the dual problem to the discrete uncertainty principle: a function and its transform cannot both be sparse, which bounds when interpolation from sparse data can succeed',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
