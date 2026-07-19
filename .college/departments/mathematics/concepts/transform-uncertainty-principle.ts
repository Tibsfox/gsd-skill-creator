/**
 * Transform Uncertainty Principle concept -- a nonzero signal and its transform cannot both be sparse.
 *
 * Complex Analysis wing: sparsity bounds on the n-th-roots-of-unity transform
 * over a finite cyclic group. Tao (2005) proved that on the cyclic group of
 * prime order the supports of a function and its (number-theoretic Fourier)
 * transform sum to at least the group order plus one, and that the bound is
 * sharp -- the finite-field analogue of the Heisenberg uncertainty principle.
 * Surfaced for the College from the June-2026 arXiv survey arXiv:2606.08662,
 * which carries the sharp support bound over to the number-theoretic transform
 * used in exact and modular signal processing.
 *
 * @module departments/mathematics/concepts/transform-uncertainty-principle
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 7 * 2pi/31 ~ 1.42 rad (advanced / abstract: a sharp harmonic-analysis bound), radius ~0.86
const theta = 7 * 2 * Math.PI / 31;
const radius = 0.86;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const transformUncertaintyPrinciple: RosettaConcept = {
  id: 'math-transform-uncertainty-principle',
  name: 'Transform Uncertainty Principle',
  domain: 'mathematics',
  description: 'A discrete uncertainty principle: on a finite cyclic group, a nonzero function ' +
    'and its number-theoretic (Fourier) transform cannot both be sparse. Tao (2005) proved that ' +
    'for the cyclic group of prime order the support sizes of a function and its transform sum to ' +
    'at least the group order plus one, and that this bound is sharp. The transform is built from ' +
    'the n-th roots of unity, so the statement is the finite-field analogue of the classical ' +
    'Fourier uncertainty principle, trading Heisenberg\'s time-frequency spread for an exact count ' +
    'of nonzero coefficients. That sharpness is precisely what makes sparse signals recoverable ' +
    'from few samples (arXiv:2606.08662, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy the transform is numpy.fft.fft over Z/n (or a modular number-theoretic transform when you need exact integer arithmetic); a function\'s support is int((np.abs(f) > 0).sum()). ' +
        'The principle asserts nnz(f) + nnz(fft(f)) >= n + 1, so a comprehension that seeds f from only a handful of nonzeros is forced to return a dense spectrum. ' +
        'See Tao 2005.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'A std::vector<std::complex<double>> holds the signal in one contiguous buffer; an RAII transform handle owns the twiddle-factor table and returns the spectrum with no allocation inside the loop. ' +
        'A templated reduce over both buffers counts nonzeros, and an assert-guarded invariant checks support(f) + support(F) >= n + 1 for any nonzero f. ' +
        'See Tao 2005.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(support (ntt f)) folds the nonzero coefficients of the transform into a count as a plain s-expression; homoiconicity lets (with-uncertainty f ...) expand at macro time into the assertion (>= (+ (support f) (support (ntt f))) (1+ n)). ' +
        'Because the roots of unity are just data, the bound reads as a symbolic law over the code, not a runtime probe. ' +
        'See Tao 2005.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-euler-formula',
      description: 'The transform is built from n-th roots of unity e^(i 2 pi k / n); the principle bounds the joint support across the two sides of that roots-of-unity transform',
    },
    {
      type: 'cross-reference',
      targetId: 'math-complex-numbers',
      description: 'The transform lives over the complex roots of unity, and sparsity is counted on both the time-side and frequency-side complex representations of the signal',
    },
    {
      type: 'cross-reference',
      targetId: 'math-dual-space-interpolation',
      description: 'The sharp support bound is exactly what keeps sparse-support recovery -- interpolating a signal from a few samples -- well-posed, the dual interpolation problem the principle underwrites',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
