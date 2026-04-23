/**
 * Solitons concept -- localized coherent nonlinear waves.
 *
 * Complex Analysis wing: nonlinear wave structures.
 * Solitons are finite-energy coherent structures in a nonlinear medium;
 * the soliton-resolution conjecture claims long-time solutions of nonlinear
 * dispersive equations decompose asymptotically into a finite sum of
 * modulated solitons plus a dispersive remainder.
 *
 * @module departments/mathematics/concepts/solitons
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~0*2pi/19 = 0, radius ~0.85 (abstract nonlinear wave object)
const theta = 0 * 2 * Math.PI / 19;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const solitons: RosettaConcept = {
  id: 'math-solitons',
  name: 'Solitons',
  domain: 'mathematics',
  description: 'Localized, persistent, nonlinear waves -- finite-energy coherent ' +
    'structures within a nonlinear medium. Canonical examples arise in the ' +
    'nonlinear Schrödinger (NLS) and Korteweg-de Vries (KdV) equations. The ' +
    'soliton-resolution conjecture claims that long-time solutions decompose ' +
    'asymptotically into a finite sum of modulated solitons plus a dispersive ' +
    'remainder; Merle, Duyckaerts, and Kenig introduced the channels-of-energy ' +
    'method to attack this for the energy-critical wave equation.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom, a soliton is an array sampled on a uniform x-grid whose |psi|^2 profile holds a fixed shape under translation. ' +
        'Split-step Fourier methods (numpy.fft) integrate NLS on a periodic grid and expose the conserved L^2 mass as a tensor norm. ' +
        'Notebooks animate |psi(x,t)| so tails decay exponentially while the core translates at constant speed. ' +
        'See Merle et al. 2026 for the soliton-resolution decomposition.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ declares struct Soliton with typed fields (double c, double x0, std::vector<std::complex<double>> psi) and splits the NLS kernel into header + .cpp source. ' +
        'The grid is a contiguous buffer, FFTW plans are owned by RAII wrappers, and |psi|^2 norms compute in place to avoid allocations inside the time loop. ' +
        'Templates abstract the nonlinearity exponent while keeping the L^2-critical case monomorphised. ' +
        'See Merle et al. 2026.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(define-soliton c x0 t) returns an s-expression; homoiconicity lets (with-soliton-decomposition psi ...) rewrite a wavefunction into (list (soliton-part) (dispersive-remainder)) at macro-expansion time. ' +
        'The MIT tradition treats the NLS flow as a higher-order operator composed with scaling and Galilean-boost combinators, so symmetry is a function transform not a runtime branch. ' +
        'See Merle et al. 2026.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-complex-numbers',
      description: 'NLS solitons are complex-valued; their phase dynamics live on the unit circle',
    },
    {
      type: 'dependency',
      targetId: 'math-exponential-decay',
      description: 'Soliton tails decay exponentially away from the core, a canonical exponential-decay envelope',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
