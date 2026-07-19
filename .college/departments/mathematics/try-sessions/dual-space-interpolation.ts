/**
 * Dual-Space Interpolation try-session -- first hands-on contact with interpolation as dual-space linear algebra.
 *
 * Walk a learner from three point-evaluation conditions to the collocation
 * matrix, the dual (Lagrange) basis, and the moment the same machinery absorbs
 * Hermite, trigonometric, and Fourier interpolation as one theorem.
 *
 * @module departments/mathematics/try-sessions/dual-space-interpolation
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const dualSpaceInterpolationSession: TrySessionDefinition = {
  id: 'math-dual-space-interpolation-first-steps',
  title: 'Dual-Space Interpolation: One Theorem for Lagrange, Hermite, and Fourier',
  description:
    'A guided first pass through interpolation as dual-space linear algebra: write conditions as linear ' +
    'functionals, build the collocation matrix, read off the dual basis, and watch the same theorem swallow ' +
    'Hermite, trigonometric, and Fourier interpolation.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Pick three sample points x0, x1, x2 and write the three interpolation conditions as functionals: L_i(p) = p(x_i), "the value of p at x_i". Feed L_0 two candidate polynomials and a sum of them, and check by hand that L_0(a*p + b*q) = a*L_0(p) + b*L_0(q). Each condition is a rule that eats a function and returns a number.',
      expectedOutcome:
        'You state each interpolation condition as a linear functional on the space of polynomials -- a linear map from functions to scalars -- and see that "match the value at x_i" is one such functional among many possible ones.',
      hint: 'A functional is linear if it distributes over sums and scalars. Point evaluation p |-> p(x_i) obviously does.',
      conceptsExplored: ['math-dual-space-interpolation'],
    },
    {
      instruction:
        'Choose a basis for the degree-2 polynomials -- the monomials phi_0 = 1, phi_1 = x, phi_2 = x^2 -- and build the 3x3 collocation matrix A[i,j] = L_i(phi_j) = x_i^j. This is the Vandermonde matrix. Write the interpolation problem as the linear system A c = y, where y = (f(x0), f(x1), f(x2)) and c are the unknown coefficients.',
      expectedOutcome:
        'You see interpolation reduced to solving A c = y, and you recognise A as the Vandermonde matrix whose (i,j) entry pairs the i-th functional with the j-th basis function.',
      hint: 'Row i of A is functional L_i evaluated on every basis function; column j is basis function phi_j seen through every functional.',
      conceptsExplored: ['math-dual-space-interpolation'],
    },
    {
      instruction:
        'Ask when A c = y has a unique solution for every y. Argue it is exactly when A is invertible -- equivalently when the functionals L_0, L_1, L_2 are linearly independent in the dual space V*, i.e. they form a basis of V*. Test it: make two sample points coincide and watch two rows of A become equal.',
      expectedOutcome:
        'You articulate the existence-uniqueness theorem: interpolation is well-posed iff the conditions form a basis of the dual space V*, and coincident nodes are exactly the degenerate case where that fails.',
      hint: 'dim V = dim V* = 3. A basis of V* is n independent functionals; det(Vandermonde) = product of (x_i - x_j), zero when two nodes collide.',
      conceptsExplored: ['math-dual-space-interpolation'],
    },
    {
      instruction:
        'Invert A and look at its rows. The functions psi_i = sum_j (A^{-1})[i,j] phi_j satisfy L_k(psi_i) = delta_ki: these are the Lagrange cardinal functions, the dual basis. Verify that the interpolant is simply p = sum_i f(x_i) psi_i -- no linear solve at evaluation time -- and note it no longer mentions the monomials.',
      expectedOutcome:
        'You compute the dual basis and see it decouples the conditions from the basis: once you have {psi_i}, the interpolant is an explicit weighted sum of sample values, independent of which basis spanned the space.',
      hint: 'psi_i is 1 at x_i and 0 at every other node. The classic Lagrange formula prod_{j != i} (x - x_j)/(x_i - x_j) is exactly this dual basis.',
      conceptsExplored: ['math-dual-space-interpolation'],
    },
    {
      instruction:
        'Add a derivative condition: replace one L_i by the functional D(p) = p\'(x1), "the slope at x1". Check D is still linear, rebuild the collocation matrix mixing values and slopes, and confirm the same theorem applies. The dual basis is now the Hermite blending functions instead of the Lagrange ones.',
      expectedOutcome:
        'You see Hermite interpolation is not a new method but the same dual-space theorem with a derivative functional swapped in, and the dual basis changes accordingly while the existence criterion is unchanged.',
      hint: 'p |-> p\'(x1) is a linear functional too. Mixing evaluation and derivative functionals gives the Hermite collocation matrix; invertibility still governs solvability.',
      conceptsExplored: ['math-dual-space-interpolation'],
    },
    {
      instruction:
        'Now change the function space itself: span it with sines and cosines instead of monomials, so the basis is {1, cos(x), sin(x), cos(2x), ...}. Keep the sampling functionals L_i(f) = f(x_i). Build the trigonometric collocation matrix on equally spaced nodes and confirm trigonometric interpolation is the same construction over a different basis.',
      expectedOutcome:
        'You connect the concept to trigonometric functions: choosing the sine/cosine space turns the identical dual-space machinery into trigonometric interpolation, unifying it with the polynomial case under one theorem.',
      hint: 'The function space is what changes, not the theory. Equally spaced nodes plus a trig basis give a structured, near-orthogonal collocation matrix.',
      conceptsExplored: ['math-dual-space-interpolation', 'math-trig-functions'],
    },
    {
      instruction:
        'Specialise the nodes to the n-th roots of unity x_k = e^(i 2 pi k / n). The collocation matrix becomes the DFT matrix and its inverse -- the dual basis -- is the inverse discrete Fourier transform. Finally, note the catch: reconstructing a function from very few samples is dual to the uncertainty principle, since a function and its transform cannot both be sparse.',
      expectedOutcome:
        'You see the DFT emerge as the interpolation dual basis on roots of unity via Euler\'s formula, and you place the limits of sparse-sample reconstruction as the dual of the discrete uncertainty principle.',
      hint: 'On roots of unity the Vandermonde matrix is the Fourier matrix; its rows are e^(i 2 pi k / n). Few samples + a sparse transform is exactly what the uncertainty principle forbids simultaneously.',
      conceptsExplored: ['math-dual-space-interpolation', 'math-euler-formula', 'math-transform-uncertainty-principle'],
    },
  ],
};
