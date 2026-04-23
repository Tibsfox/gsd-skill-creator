/**
 * Blow-Up Dynamics concept -- finite-time singularity formation in nonlinear PDEs.
 *
 * Calculus wing: singularity analysis.
 * Finite-time blow-up is the phenomenon where smooth initial data
 * produces a solution whose norm becomes infinite in finite time;
 * type-I (self-similar) and type-II (non-self-similar) classifications
 * distinguish the mechanism.
 *
 * @module departments/mathematics/concepts/blow-up-dynamics
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~1*2pi/19, radius ~0.90 (highly abstract)
const theta = 1 * 2 * Math.PI / 19;
const radius = 0.90;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const blowUpDynamics: RosettaConcept = {
  id: 'math-blow-up-dynamics',
  name: 'Blow-Up Dynamics',
  domain: 'mathematics',
  description: 'Finite-time singularity formation in nonlinear PDEs: smooth initial ' +
    'data produces a solution whose norm becomes infinite in finite time. ' +
    'Merle and Raphaël showed that L²-critical NLS blow-up is quantized -- ' +
    'the singular part accumulates an L² mass equal to an exact multiple of ' +
    'the ground-state mass. The type-I (self-similar) vs type-II (non-self-similar) ' +
    'classification distinguishes the mechanism; 3D compressible Navier-Stokes ' +
    'implosion is type-II from smooth finite-energy data.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A blow-up solution is a numpy array whose sup-norm diverges as dt shrinks under an adaptive mesh; a notebook plots log(||u(t)||_inf) vs log(T*-t) and reads the self-similar rate from the slope. ' +
        'numpy.fft + scipy.integrate.solve_ivp expose the envelope as a tensor that collapses toward the ground-state profile Q. ' +
        'Moving-window mass profiling makes the L^2-critical quantization visible as integer mass jumps. ' +
        'See Merle et al. 2026.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ partitions the singular time interval into typed epochs (struct BlowUpEpoch { double tStart; double tEnd; double lambda; }) and refines adaptively in space (std::vector<double>) and time (step-doubling). ' +
        'Headers declare the modulation ODE as a pure interface; the .cpp source owns the stiff integrator with allocation hoisted outside the hot loop so rescaling is O(N) buffer reuse. ' +
        'RAII guards keep symmetry invariants. ' +
        'See Merle et al. 2026.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(define-blow-up u0 t) evaluates to a lazy stream of s-expressions; (with-rescaled-frame (lambda mu) body) is a macro that acts on the quoted form so self-similarity is a compile-time rewrite. ' +
        'The MIT tradition composes blow-up with finite-energy decomposition via combinator algebra rather than iterative refinement. ' +
        'Macro expansion exposes the Martel-Merle-Raphael trichotomy as three pattern-match branches. ' +
        'See Merle et al. 2026.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-solitons',
      description: 'Near-soliton blow-up theory (critical gKdV) classifies three fates including finite-time blow-up',
    },
    {
      type: 'dependency',
      targetId: 'math-exponential-decay',
      description: 'Blow-up rates are characterized through modulation equations involving exponential time scales',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
