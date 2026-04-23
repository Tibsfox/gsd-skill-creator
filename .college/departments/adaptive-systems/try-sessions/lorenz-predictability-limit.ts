/**
 * Lorenz Predictability Limit try-session -- ~2-week synoptic cap.
 *
 * Walk a learner from the butterfly diagram and sensitive dependence on
 * initial conditions, through empirical error-doubling-time measurement,
 * to why every modern weather service runs a perturbed ensemble rather
 * than a single deterministic forecast beyond the Lorenz horizon.
 *
 * @module departments/adaptive-systems/try-sessions/lorenz-predictability-limit
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const lorenzPredictabilityLimitSession: TrySessionDefinition = {
  id: 'adaptive-systems-lorenz-predictability-limit-first-steps',
  title: 'Lorenz Predictability Limit: Why Weather Forecasts Have a Two-Week Ceiling',
  description:
    'A guided first pass through the Lorenz 1963 three-equation system -- ' +
    'from the butterfly attractor and sensitive dependence on initial ' +
    'conditions, through empirical error-doubling-time measurement, ' +
    'ensemble forecasting as the adaptive response to chaos, and why ' +
    'every modern weather service runs perturbed ensembles rather than ' +
    'single deterministic forecasts beyond the Lorenz horizon.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open the Lorenz 1963 paper *Deterministic Nonperiodic Flow* (J. Atmos. Sci. 20, 130-141) to Figure 1 or 2 -- the first published butterfly trajectory. Note the three equations: ẋ = σ(y-x), ẏ = x(ρ-z)-y, ż = xy - βz with σ=10, ρ=28, β=8/3. What makes this system qualitatively different from a linear oscillator or a damped pendulum?',
      expectedOutcome:
        'You articulate that the system is deterministic (no stochastic term), three-dimensional (minimum for chaos in a continuous flow per Poincaré-Bendixson), and aperiodic -- yet trajectories remain bounded. The attractor is a strange attractor: trajectories never repeat, but stay on a fractal object of non-integer Hausdorff dimension. This breaks the deterministic-means-predictable intuition.',
      hint: 'Lorenz stumbled onto this accidentally while rounding an intermediate state from 6 digits to 3 digits in a 1961 re-run -- the forecasts diverged completely. The paper was the formalization of that discovery.',
      conceptsExplored: ['adaptive-systems-lorenz-predictability-limit'],
    },
    {
      instruction:
        'Integrate the system yourself. Pick any scipy/numpy notebook, Matlab, or even pen-and-paper RK4 at dt=0.01. Run two trajectories from x0=(1, 1, 1) and x0=(1, 1, 1+1e-5) for 30 time units. Plot |x_a(t) - x_b(t)| on a log scale. What do you see, and what is the slope?',
      expectedOutcome:
        'The log-distance curve rises approximately linearly with a slope equal to the maximal Lyapunov exponent λ ≈ 0.9 per time unit (in Lorenz\'s nondimensional time), meaning the error doubles roughly every ln(2)/0.9 ≈ 0.77 time units. After saturation the trajectories are essentially independent on the attractor.',
      hint: 'Sensitive dependence = the initial 1e-5 perturbation grows to O(1) in about 10-15 time units. The time to double is the error-doubling time; reciprocal is the Lyapunov exponent.',
      conceptsExplored: ['adaptive-systems-lorenz-predictability-limit', 'math-exponential-decay'],
    },
    {
      instruction:
        'Translate the abstract Lorenz time-unit back to real atmospheric time. The error-doubling time for synoptic-scale atmospheric features is 1-2 days (this is not the Lorenz model directly, but ECMWF operational analysis on full primitive-equation models). How many doublings fit in a typical observation-error window, and what does that imply for the deterministic forecast horizon?',
      expectedOutcome:
        'You reason: initial analysis error is ~1% of the feature amplitude; lose predictability at ~100% amplitude = 2^7 ≈ 128x growth = 7 doublings. At 1.5 days/doubling that is ~10.5 days -- the canonical two-week ceiling. Beyond that, the signal-to-noise ratio falls below 1, and only statistical/climate-scale forecasting is meaningful.',
      hint: 'The two-week horizon is not a hardware limitation -- it is a mathematical one. A perfect model with perfect observations still would not beat the Lyapunov cap.',
      conceptsExplored: ['adaptive-systems-lorenz-predictability-limit', 'math-exponential-decay'],
    },
    {
      instruction:
        'Now generate an ensemble. Perturb the initial condition 50 times with isotropic Gaussian noise of scale 1e-4, integrate each for 20 time units, and plot the spaghetti. What does the envelope look like at t=5, t=10, t=15, t=20?',
      expectedOutcome:
        'At t=5 the trajectories are still bunched (analysis phase). At t=10 the envelope is spreading but a central tendency remains (medium-range forecast). At t=15 the envelope nearly fills the attractor (long-range limit). At t=20 the ensemble samples the attractor\'s natural measure -- the climatology. The ensemble spread is itself the quantitative forecast of predictability loss.',
      hint: 'ECMWF\'s EPS (50 perturbed members + 1 control, launched 1992) and NOAA\'s GEFS (21 members, launched 1992) are direct operational descendants of exactly this numerical experiment at a much larger scale.',
      conceptsExplored: ['adaptive-systems-lorenz-predictability-limit'],
    },
    {
      instruction:
        'Read about the Lorenz attractor as a fractal object. Estimate its Hausdorff dimension (published value ~2.06) via box-counting on your integrated trajectory. Why is a non-integer dimension significant for the "predictability" question?',
      expectedOutcome:
        'You articulate that a strange attractor sits between a 2D surface and a 3D volume: trajectories densely fill a fractal subset of phase space, not a smooth manifold. Locally in time the flow is volume-contracting (dissipative), yet the attractor is measure-supported on this fractal; nearby trajectories diverge along one unstable direction (λ_1 > 0) while converging along two stable directions (λ_2 = 0, λ_3 < 0). Predictability is anisotropic.',
      hint: 'Sum of Lyapunov exponents = divergence of the flow = -σ - 1 - β = -13.67 < 0 for canonical parameters. Dissipation + single unstable direction = strange attractor of dimension slightly above 2.',
      conceptsExplored: ['adaptive-systems-lorenz-predictability-limit', 'math-fractal-geometry'],
    },
    {
      instruction:
        'Now the adaptive-systems punchline. The Lorenz horizon is why weather forecasting had to become an adaptive system rather than a deterministic one. State how ensemble forecasting + data assimilation (the obs-minus-background cycle every 6-12 hours) turn chaos from a roadblock into an operational workflow.',
      expectedOutcome:
        'You articulate that the forecast system cannot beat the Lyapunov cap, but it CAN: (a) quantify uncertainty through ensemble spread, (b) re-anchor the trajectory every 6-12 hours via data assimilation so the error clock resets, (c) extract probabilistic rather than deterministic forecasts in the medium range. The system adapts to chaos by measuring it, not by pretending it is absent.',
      hint: 'This is the operational compromise: no single forecast is right beyond ~10 days, but the ensemble\'s probabilistic forecast is skillful out to ~15 days, and the system is refreshed with new observations every cycle. The Lorenz horizon was accepted and engineered around.',
      conceptsExplored: ['adaptive-systems-lorenz-predictability-limit'],
    },
    {
      instruction:
        'Close by placing the Lorenz predictability limit on the complex plane of experience: it is a medium-abstractness, high-complexity concept at the crossroads of dynamical systems, atmospheric science, and adaptive control. State one line that captures why sensitive dependence on initial conditions is the concept that defines operational weather prediction.',
      expectedOutcome:
        'You state something like: "Edward Lorenz\'s 1963 three-equation system proved that deterministic does not mean predictable: trajectories on a fractal strange attractor diverge exponentially, capping synoptic-scale weather forecasts at roughly two weeks. Every modern operational center responded by running perturbed ensembles and re-initializing via data assimilation -- the forecast system became an adaptive system that measures chaos rather than fighting it."',
      hint: 'The Lyapunov exponent is the single number that translates "sensitive dependence" into an operational forecast horizon. Every ensemble spread curve in every forecast center\'s verification page is the Lorenz horizon in action.',
      conceptsExplored: ['adaptive-systems-lorenz-predictability-limit', 'math-fractal-geometry'],
    },
  ],
};
