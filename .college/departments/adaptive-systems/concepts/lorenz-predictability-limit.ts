/**
 * Lorenz Predictability Limit concept -- ~2-week synoptic cap.
 *
 * Chaos theory: sensitive dependence on initial conditions.
 * Edward Lorenz's 1963 three-equation convection system produced the
 * strange-attractor "butterfly" whose trajectories diverge exponentially,
 * bounding deterministic weather forecasts to a practical horizon
 * of roughly two weeks.
 *
 * @module departments/adaptive-systems/concepts/lorenz-predictability-limit
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~14*2pi/19, radius ~0.85
const theta = 14 * 2 * Math.PI / 19;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const lorenzPredictabilityLimit: RosettaConcept = {
  id: 'adaptive-systems-lorenz-predictability-limit',
  name: 'Lorenz Predictability Limit',
  domain: 'adaptive-systems',
  description: 'Edward Lorenz\'s 1963 paper *Deterministic Nonperiodic Flow* ' +
    '(J. Atmos. Sci. 20, 130-141) introduced the three-equation system ' +
    'ẋ = σ(y-x), ẏ = x(ρ-z)-y, ż = xy - βz with canonical σ=10, β=8/3, ' +
    'ρ=28, producing the strange-attractor "Lorenz butterfly" on which ' +
    'trajectories diverge exponentially -- the canonical demonstration of ' +
    'sensitive dependence on initial conditions. The practical consequence: ' +
    'even with a perfect model and arbitrarily good (but finite-precision) ' +
    'initial conditions, atmospheric forecasts lose skill with error-doubling ' +
    'times of 1-2 days for synoptic-scale features, capping deterministic ' +
    'forecasts at roughly two weeks. Beyond this horizon, only statistical ' +
    '(climate-scale) forecasting is meaningful. The response: ensemble ' +
    'forecasting (ECMWF EPS and NOAA GEFS, both launched 1992).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python integrates the Lorenz system with scipy.integrate.solve_ivp against a right-hand-side returning [sigma*(y-x), x*(rho-z)-y, x*y-beta*z]. ' +
        'A pair of near-identical initial conditions x0 and x0+epsilon integrated for 30 units traces the butterfly until trajectories diverge; ensemble_forecast() in a notebook perturbs 50 seeds and plots the spaghetti that widens to the attractor diameter by t~20. ' +
        'See Lorenz 1963.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ wires Boost.odeint with a stepper<runge_kutta_dopri5> advancing a std::array<double, 3> state through the Lorenz RHS functor sigma*(y-x), x*(rho-z)-y, x*y-beta*z. ' +
        'High-cadence integration at dt=1e-3 captures the exponential error-doubling on the attractor; templated integrate_const<Stepper, System, State, Time>() resolves the nonlinear flow while an observer logs the divergence metric every 1000 steps. ' +
        'See Lorenz 1963.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(define-lorenz-system sigma rho beta) returns a closure; (with-perturbation (lorenz x0) eps ...) macro-expands into a pair of parallel integrator forms whose divergence is symbolic. ' +
        'The MIT-AI tradition (SICP chaos demos, Sussman and Wisdom\'s Structure and Interpretation of Classical Mechanics) treats the attractor as a fixed point of a higher-order flow operator, with error-doubling time computed as a closed-form Lyapunov exponent via functional symbolic differentiation. ' +
        'See Lorenz 1963.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-fractal-geometry',
      description: 'The Lorenz attractor is a fractal object of non-integer Hausdorff dimension',
    },
    {
      type: 'dependency',
      targetId: 'math-exponential-decay',
      description: 'Error-doubling on the attractor is exponential in time, the canonical exponential-growth / decay pattern',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
