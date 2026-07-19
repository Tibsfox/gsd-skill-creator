/**
 * Transform Uncertainty Principle try-session -- first hands-on contact with the sparsity trade-off.
 *
 * Walk a learner from a single spike and its dense spectrum to Tao's sharp
 * support bound on a cyclic group of prime order, then to the sparse-recovery
 * consequence that makes interpolation from few samples well-posed.
 *
 * @module departments/mathematics/try-sessions/transform-uncertainty-principle
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const transformUncertaintyPrincipleSession: TrySessionDefinition = {
  id: 'math-transform-uncertainty-principle-first-steps',
  title: 'The Transform Uncertainty Principle: A Signal and Its Spectrum Cannot Both Be Sparse',
  description:
    'A guided first pass through the discrete uncertainty principle: build the roots-of-unity ' +
    'transform on a cyclic group, count supports, meet Tao\'s sharp support-plus-support bound at ' +
    'prime order, and see why it makes sparse recovery well-posed.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Fix n = 7 and index a function f over the cyclic group Z/7. Write the transform as F(k) = sum_j f(j) * omega^(j*k) with omega = e^(-2*pi*i/7), the primitive 7th root of unity. Define the support of any vector as the number of indices where it is nonzero. Count support(f) and support(F) for the constant function f = (1,1,1,1,1,1,1).',
      expectedOutcome:
        'You see the transform as evaluation against powers of a root of unity, and you observe the constant function (support 7) collapses to a single nonzero frequency (support 1) -- a first hint that the two supports trade against each other.',
      hint: 'The constant vector is an eigenvector picture: its spectrum is a single spike at k = 0. Support just means "how many nonzero entries".',
      conceptsExplored: ['math-transform-uncertainty-principle', 'math-euler-formula'],
    },
    {
      instruction:
        'Now go the other way. Set f to a single spike, f = delta_0 = (1,0,0,0,0,0,0), support 1. Compute its transform by hand: F(k) = omega^(0*k) = 1 for every k. Count support(F). Then try to invent any nonzero f whose support AND whose transform support are both tiny, say both equal to 1.',
      expectedOutcome:
        'You find a lone spike transforms to a completely flat spectrum (support 7), and every attempt to make both supports small fails -- the sparsity you remove in time reappears in frequency.',
      hint: 'A spike is maximally concentrated in time and maximally spread in frequency; a constant is the reverse. There is no vector concentrated on both sides.',
      conceptsExplored: ['math-transform-uncertainty-principle', 'math-complex-numbers'],
    },
    {
      instruction:
        'State the principle precisely: for any nonzero f on Z/n, support(f) + support(F) >= n + 1 when n is prime. Check it against your two experiments (1 + 7 = 8 >= 8, and 7 + 1 = 8 >= 8) and against an interval f = (1,1,1,0,0,0,0). Compute its transform support numerically and verify the sum clears n + 1 = 8.',
      expectedOutcome:
        'You confirm the inequality on three concrete functions and internalise it as an exact count: the two support sizes can never dip below the group order plus one.',
      hint: 'You do not need the transform values, only how many are nonzero. For the length-3 interval the spectrum has no zeros, so support(F) = 7.',
      conceptsExplored: ['math-transform-uncertainty-principle'],
    },
    {
      instruction:
        'Probe sharpness and why primality matters. The bound is tight: for prime n there exist nonzero f meeting support(f) + support(F) = n + 1 exactly. The engine is that the n-th cyclotomic polynomial is irreducible, so no proper nonempty subset of the roots of unity sums to zero -- a fact that fails for composite n. Contrast n = 6, where omega^0 + omega^3 = 0 lets a 2-support function have a small spectrum.',
      expectedOutcome:
        'You explain why the theorem is stated for prime order: with no vanishing subsums of roots of unity, the transform matrix has every minor nonzero (Chebotarev), which forces the sharp bound; composite n admits sparse-sparse pairs that violate it.',
      hint: 'Composite n has proper subgroups; an indicator of a subgroup is sparse and transforms to a sparse coset spectrum. Prime n has none.',
      conceptsExplored: ['math-transform-uncertainty-principle', 'math-euler-formula'],
    },
    {
      instruction:
        'Read the transform as a matrix over the roots of unity: F = W f where W[k,j] = omega^(j*k) is the n-by-n DFT matrix built from powers of a single primitive root. Pick any s rows and s columns and inspect the s-by-s submatrix. For prime n, Chebotarev\'s theorem says its determinant is nonzero for every such choice.',
      expectedOutcome:
        'You connect the support bound to linear algebra over the complex roots of unity: because every square submatrix is invertible, no nonzero vector can be sparse on both sides, and any s frequencies determine any s time-samples.',
      hint: 'Nonvanishing minors mean any s columns of W are linearly independent on any s rows -- the algebraic reason a signal cannot hide in a small time-and-frequency window.',
      conceptsExplored: ['math-transform-uncertainty-principle', 'math-complex-numbers', 'math-perron-frobenius-centrality'],
    },
    {
      instruction:
        'Turn the bound into a recovery guarantee. Suppose a signal is known to be k-sparse in time. The every-minor-nonzero property means it is uniquely determined by any 2k of its transform values -- interpolating the sparse signal from a few samples is well-posed. Set up the linear system that recovers a 2-sparse f on Z/7 from 4 chosen frequency samples and argue it has a unique solution.',
      expectedOutcome:
        'You see the uncertainty principle as the guarantee behind sparse-support recovery: two distinct k-sparse signals cannot share 2k samples, so the dual interpolation problem -- reconstruct from few measurements -- has one and only one answer.',
      hint: 'If two k-sparse signals agreed on 2k samples, their difference would be 2k-sparse with a spectrum vanishing on 2k points -- contradicting support(f) + support(F) >= n + 1.',
      conceptsExplored: ['math-transform-uncertainty-principle', 'math-dual-space-interpolation'],
    },
    {
      instruction:
        'Close by placing the result in context. The classical Heisenberg principle bounds the product of time and frequency spreads on the real line; here the analogue bounds a sum of exact support counts on a finite cyclic group. Read the arXiv:2606.08662 (2026, Malavolta & Rosen, "Uncertainty Principles for the Number Theoretic Transform"): over Z/q the deterministic bound support(f) + support(F) >= q + 1 carries to the number-theoretic transform in a finite field F_p (for every fixed prime q and all but finitely many primes p = 1 mod q, so a k-sparse f has transform support >= q - k + 1) -- but that restatement of Tao is NOT the paper\'s contribution. Its main technical result is a *probabilistic* uncertainty principle, averaged over the primes p in the regime p = q^O(1); the payoff is a black-box identity test for k-sparse exponential polynomials with vanishing soundness error.',
      expectedOutcome:
        'You articulate the transform uncertainty principle as the finite, exact-count analogue of Heisenberg\'s inequality, and you separate the 2005 deterministic bound from the 2026 paper\'s own novelty: not an NTT restatement but a probabilistic version averaged over primes p (regime p = q^O(1)) that turns the sparsity trade-off into a working sparse-polynomial identity test.',
      hint: 'Continuous Heisenberg multiplies spreads; the discrete principle adds supports. Both forbid simultaneous concentration in time and frequency.',
      conceptsExplored: ['math-transform-uncertainty-principle'],
    },
  ],
};
