/**
 * Scale-Critical Equations concept -- invariance under (x,t,u) rescaling.
 *
 * Complex Analysis wing: unifying analytic framework.
 * Scale-critical equations are those that are invariant under a rescaling
 * of space, time, and unknown that preserves a conserved norm. The
 * L²-critical NLS and the energy-critical wave equation are canonical cases
 * where the singularity analysis is most delicate.
 *
 * @module departments/mathematics/concepts/scale-critical-equations
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~2*2pi/19, radius ~0.95 (peak abstraction)
const theta = 2 * 2 * Math.PI / 19;
const radius = 0.95;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const scaleCriticalEquations: RosettaConcept = {
  id: 'math-scale-critical-equations',
  name: 'Scale-Critical Equations',
  domain: 'mathematics',
  description: 'Nonlinear PDEs invariant under a rescaling of space, time, and ' +
    'unknown that preserves a conserved norm. The L²-critical nonlinear ' +
    'Schrödinger equation i∂_t u + Δu + |u|^(4/d) u = 0 conserves mass ' +
    'exactly at scale invariance -- the most delicate regime for singularity ' +
    'analysis. Scale-criticality is the unifying analytic framework: it is ' +
    'why the L²-critical and energy-critical regimes admit quantized blow-up ' +
    'and why the modulation-and-decomposition toolkit Merle developed applies ' +
    'across NLS, wave, and KdV settings.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy, scale invariance is a lambda on an array: rescale = lambda u, mu: mu**alpha * np.interp(x/mu, x, u); the L^2-critical exponent is the unique alpha for which np.trapz(|rescale|**2) is constant. ' +
        'Notebooks diagnose criticality by sweeping mu and confirming the mass functional stays flat across three orders of magnitude. ' +
        'numpy.fft powers the spectral-radius probe between subcritical, critical, and supercritical. ' +
        'See Merle et al. 2026.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ treats scale invariance as a template tag: template<int alpha> struct CriticalNLS; instantiating alpha = 4/d at compile time inlines the rescaling operator into the time-stepper. ' +
        'A precomputed scaling Jacobian lives in a column-major matrix with aligned SIMD access; header/source separation exposes the group without leaking implementation. ' +
        'Constexpr checks reject non-critical exponents at build time. ' +
        'See Merle et al. 2026.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(define-rescaling mu) returns a function; (compose nls-flow (rescaling mu)) and (compose (rescaling mu) nls-flow) are the two sides of the invariance identity a macro-level equality check can verify. ' +
        'Homoiconicity makes invariance a property of the code object, not a runtime assertion. ' +
        'The MIT tradition writes the modulation-decomposition toolkit as a fixed-point combinator on quoted PDE forms. ' +
        'See Merle et al. 2026.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-blow-up-dynamics',
      description: 'Scale-criticality is the organizing principle for classifying blow-up types',
    },
    {
      type: 'dependency',
      targetId: 'math-complex-numbers',
      description: 'The critical NLS is complex-valued; the rescaling group acts on complex solutions',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
