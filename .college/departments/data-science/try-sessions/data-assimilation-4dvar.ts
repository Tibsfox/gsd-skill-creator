/**
 * Data Assimilation 4D-Var try-session -- variational state estimation.
 *
 * Walk a learner from the observation gap problem, through the 3D-Var and
 * 4D-Var cost functions, the tangent-linear / adjoint operators, the
 * Ensemble Kalman Filter, and hybrid 4DEnVar, to why every ML weather
 * model is downstream of a classical assimilation analysis.
 *
 * @module departments/data-science/try-sessions/data-assimilation-4dvar
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const dataAssimilation4dvarSession: TrySessionDefinition = {
  id: 'data-science-data-assimilation-4dvar-first-steps',
  title: 'Data Assimilation 4D-Var: How Observations Become the Initial Condition',
  description:
    'A guided first pass through variational data assimilation -- from the ' +
    'irregular-observation problem, through the 3D-Var and 4D-Var cost ' +
    'functions, tangent-linear and adjoint operators, the Ensemble Kalman ' +
    'Filter, and hybrid 4DEnVar, to why every ML weather model is ' +
    'downstream of a classical assimilation analysis.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open a global forecast chart and a map of the current observation network (satellites, radiosondes, aircraft, surface stations, buoys). Observations are irregular in space and time; the model needs a full 3D state at t=0 on a regular grid. What is the missing piece between "we have observations" and "we have an initial condition"?',
      expectedOutcome:
        'You articulate that observations are sparse, noisy, and on irregular grids, while a forecast needs a complete state on the model grid. The bridge is data assimilation: combine the short-range forecast (background x^b, complete on the grid) with observations y° (sparse, noisy) weighted by their error covariances B and R to produce the analysis x^a.',
      hint: 'Major centers ingest about 200 million observations per 12-hour cycle. None of them lie exactly on the model grid; all of them have non-trivial error characteristics.',
      conceptsExplored: ['data-science-data-assimilation-4dvar'],
    },
    {
      instruction:
        'Write down the 3D-Var cost function: J(x) = ½(x-x^b)^T B^(-1) (x-x^b) + ½(y°-H(x))^T R^(-1) (y°-H(x)), where H is the observation operator mapping state to obs space. What does minimizing J accomplish, and what role does B^(-1) play versus R^(-1)?',
      expectedOutcome:
        'You explain that minimizing J trades off fitting the background against fitting the observations, weighted by their respective precision (inverse covariance) matrices. B^(-1) propagates background trust across the grid via its correlation structure; R^(-1) sets each observation\'s individual weight. The analysis x^a is the Bayesian maximum-a-posteriori estimate under Gaussian error assumptions.',
      hint: 'The key insight: observations can influence state variables they do not directly measure, because B carries the correlation structure. Surface pressure obs can update the temperature field 500 mb aloft through B\'s cross-covariances.',
      conceptsExplored: ['data-science-data-assimilation-4dvar', 'math-ratios-proportions'],
    },
    {
      instruction:
        'Now generalize to 4D-Var. Instead of minimizing at a single time, minimize over a 12-hour assimilation window: J(x_0) = ½(x_0-x^b)^T B^(-1) (x_0-x^b) + Σ_k ½(y°_k - H(M_k(x_0)))^T R_k^(-1) (y°_k - H(M_k(x_0))), where M_k is the nonlinear forecast model to time k. Why does this require the tangent-linear and adjoint operators?',
      expectedOutcome:
        'You explain that computing the gradient ∇J requires back-propagating obs-minus-model residuals through the model: M^T (the adjoint) propagates residuals backward in time, while M_T (tangent-linear) propagates increments forward. Both are derived once from the nonlinear model M and evaluated on every iteration of the inner-loop minimizer.',
      hint: 'ECMWF has been running 4D-Var operationally since 1997; Météo-France since 2000. The inner-loop minimizer is typically an incremental conjugate-gradient that runs 30-50 iterations per outer loop.',
      conceptsExplored: ['data-science-data-assimilation-4dvar', 'physics-primitive-equations'],
    },
    {
      instruction:
        'Read about the Ensemble Kalman Filter (Evensen 1994). Instead of a static B derived from climatology, the EnKF estimates B from the sample covariance of a forecast ensemble. What does this buy you that static B cannot, and what is the price?',
      expectedOutcome:
        'You explain that EnKF gives flow-dependent error covariances: during a rapidly intensifying cyclone, B reflects the instantaneous error structure (steep vertical correlations in the storm column). The price is sampling noise (ensemble size ~80-100 members) and the need to inflate and localize the sample covariance to avoid filter divergence.',
      hint: 'Static B is smooth and climatological; flow-dependent B from a 100-member ensemble is noisy and requires localization -- but it captures the error structure of today\'s atmosphere, not yesterday\'s average.',
      conceptsExplored: ['data-science-data-assimilation-4dvar'],
    },
    {
      instruction:
        'Now consider hybrid 4DEnVar (NCEP GFS operational since 2016). Combine static climatological B with flow-dependent EnKF covariance B_e via a weighted sum: B_hybrid = α B_static + (1-α) B_e. What does each term contribute, and why do all major centers land on a hybrid rather than pure 4D-Var or pure EnKF?',
      expectedOutcome:
        'You reason: static B captures the slowly-varying climatological error structure (well-sampled, low noise); flow-dependent B_e captures today\'s atmosphere (high signal, high noise). The hybrid trades off both error sources; α is tuned (~0.25 to 0.5) per-center. Pure EnKF underestimates long-range correlations; pure 4D-Var misses regime-dependent structure.',
      hint: 'The hybrid pattern generalizes: any time you have a well-sampled slow prior and a noisy fast prior, the optimal combination is a weighted sum with weights set by their relative precision.',
      conceptsExplored: ['data-science-data-assimilation-4dvar', 'math-ratios-proportions'],
    },
    {
      instruction:
        'Now the punchline: ML weather models (GraphCast, AIFS, FourCastNet) are trained on ERA5, which is itself a 4D-Var reanalysis. What does this mean for the ML models\' fundamental limits, and what breaks if you try to train them on raw observations directly?',
      expectedOutcome:
        'You articulate that ML weather models learn the manifold of plausible atmospheric states defined by 4D-Var: they inherit ERA5\'s biases (model error, obs-operator error, B/R choices). Training on raw obs directly would require the ML model to discover data assimilation internally -- a vastly harder problem, with ~200M irregular inputs per timestep. Every skillful ML forecast is downstream of classical assimilation.',
      hint: 'This is the quiet truth of the 2022-2026 AI weather progression: ERA5 is the ground-truth label, and ERA5 is 4D-Var + IFS + historical observations. The ML models are learning the 4D-Var manifold.',
      conceptsExplored: ['data-science-data-assimilation-4dvar', 'data-science-ai-weather-pipeline'],
    },
    {
      instruction:
        'Close by placing data assimilation on the complex plane of experience: it is a medium-high-concreteness, high-complexity concept at the crossroads of numerical optimization, linear algebra, and atmospheric dynamics. State one line that captures why 4D-Var is the infrastructural backbone of modern weather prediction.',
      expectedOutcome:
        'You state something like: "4D-Var combines 200 million observations per cycle with a short-range forecast through a 12-hour variational minimization, weighted by B and R, to produce the analysis x^a that every subsequent forecast -- classical or ML -- starts from. Reanalyses like ERA5 are 4D-Var at scale over four decades, and they define the training manifold for every modern AI weather model."',
      hint: 'The obs-minus-background analysis residual is the single most scrutinized diagnostic in operational weather: it tells you whether your B and R are calibrated and whether the model itself is drifting.',
      conceptsExplored: ['data-science-data-assimilation-4dvar', 'data-science-ai-weather-pipeline'],
    },
  ],
};
