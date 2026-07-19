/**
 * Conformal Prediction try-session -- distribution-free prediction intervals.
 *
 * Walk a learner from raw calibration residuals, through the finite-sample
 * conformal quantile, an empirical coverage check, the exchangeability
 * assumption and how drift breaks it, one-sided (upper/lower-tail) splits,
 * and the calibration-vs-coverage distinction, to why conformal prediction
 * is the wrapper that makes any point predictor honest about uncertainty.
 *
 * @module departments/data-science/try-sessions/conformal-prediction
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const conformalPredictionSession: TrySessionDefinition = {
  id: 'data-science-conformal-prediction-first-steps',
  title: 'Conformal Prediction: Coverage You Can Prove Without Knowing the Distribution',
  description:
    'A guided first pass through split conformal prediction -- from raw ' +
    'calibration residuals, through the finite-sample conformal quantile and ' +
    'an empirical coverage check, to the exchangeability assumption, one-sided ' +
    'tail splits, and why conformal wraps any point predictor with an honest, ' +
    'distribution-free uncertainty guarantee.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Fit any regression model (linear, gradient-boosted, a neural net -- it does not matter which) on a proper training split. Hold out a separate calibration set the model never saw, compute residuals = |y_cal - y_hat_cal| on it, and plot their histogram. Look at the shape: what raw material does conformal prediction actually use, and what does it deliberately NOT assume about that shape?',
      expectedOutcome:
        'You articulate that conformal prediction only needs the empirical distribution of held-out nonconformity scores (here, absolute residuals). It makes no parametric assumption -- the residuals need not be Gaussian, symmetric, or homoscedastic. The model is a black box; conformal reads its errors on fresh data and turns them into a calibrated interval.',
      hint: 'The model can be arbitrarily good or bad -- conformal wraps it either way. A worse model just yields wider intervals; the coverage guarantee is unchanged.',
      conceptsExplored: ['data-science-conformal-prediction'],
    },
    {
      instruction:
        'Compute the conformal quantile: with n calibration points and target miscoverage alpha = 0.1, take q = the ceil((n+1)(1-alpha))/n empirical quantile of your residuals. Form the interval y_hat +/- q for a test point. Now vary n (say 20, 100, 1000) and watch the (n+1) finite-sample correction shrink toward the ordinary (1-alpha) quantile. Why is the +1 there at all?',
      expectedOutcome:
        'You explain that the (n+1) correction accounts for the unseen test point joining the calibration sample under exchangeability -- there are n+1 exchangeable scores, and the interval must cover the test score among them. For small n the correction is large (conservative, wider intervals); as n grows it vanishes and q approaches the plain empirical (1-alpha) quantile.',
      hint: 'ceil((n+1)(1-alpha))/n can exceed 1 when n is tiny (e.g. n < 1/alpha - 1); in that regime the interval is unbounded -- honest conformal says "I do not have enough calibration data to promise 90% coverage."',
      conceptsExplored: ['data-science-conformal-prediction', 'data-confidence-intervals'],
    },
    {
      instruction:
        'Now audit the promise empirically. Run many random calibration/test resplits (or a large test set); for each, record whether the true y falls inside C(X). Average the indicator over all trials. Compare that empirical coverage against the target 1-alpha = 0.9, and repeat with a deliberately terrible model. What do you observe about the coverage number in both cases?',
      expectedOutcome:
        'You observe empirical coverage hovering at ~0.9 regardless of model quality -- the guarantee P(Y in C(X)) >= 1-alpha is marginal and distribution-free, so it holds even for a bad model. What changes with model quality is interval WIDTH, not coverage. You connect this to a confidence interval: same coverage semantics, but earned from exchangeability rather than a parametric sampling model.',
      hint: 'Coverage is slightly conservative (a hair above 1-alpha) because of the finite-sample (n+1) correction -- that is the guarantee doing its job, not a bug.',
      conceptsExplored: ['data-science-conformal-prediction', 'data-confidence-intervals'],
    },
    {
      instruction:
        'Stress the one load-bearing assumption. Break exchangeability on purpose: train and calibrate on data from one regime, then evaluate on a shifted regime (a later time period, a different region, a covariate-shifted slice). Recompute empirical coverage. Watch it fall below 0.9. What single property did you violate, and what would have caught the failure?',
      expectedOutcome:
        'You articulate that conformal coverage holds only under exchangeability of calibration and test scores; distribution shift breaks it and coverage silently degrades below 1-alpha with no error raised. A drift detector monitoring the score distribution (or the covariates) is what flags that the exchangeability premise has failed and the interval is no longer trustworthy.',
      hint: 'This is why conformal and drift detection are paired in production: conformal gives the guarantee, drift detection guards the assumption the guarantee rests on.',
      conceptsExplored: ['data-science-conformal-prediction', 'data-science-drift-detection'],
    },
    {
      instruction:
        'Split the two-sided guarantee into one-sided halves. Instead of absolute residuals, keep SIGNED residuals (y_cal - y_hat_cal) and take a separate upper-tail quantile and lower-tail quantile. Build an asymmetric interval [y_hat - q_lo, y_hat + q_hi]. Observe how the two half-widths differ on skewed errors, and reason about when you would want to bound only over-prediction or only under-prediction.',
      expectedOutcome:
        'You explain that one-sided conformal controls each tail independently, so over-prediction and under-prediction get their own guarantees -- crucial when the costs are asymmetric (e.g. under-forecasting demand is worse than over-forecasting). On skewed residuals q_lo and q_hi differ, yielding an asymmetric interval that a single symmetric +/- q would misrepresent.',
      hint: 'This upper/lower-tail split is the arXiv:2606.18199 refinement: two separate exchangeability guarantees, one per tail, that compose back into the two-sided interval.',
      conceptsExplored: ['data-science-conformal-prediction'],
    },
    {
      instruction:
        'Disentangle conformal from calibration. Take a classifier that is well-calibrated in probability (its 0.7-confidence predictions are right ~70% of the time) and build conformal prediction SETS at 1-alpha coverage on the same data. Show that a model can be probability-calibrated yet its raw softmax sets under-cover, and that conformal repairs set coverage without touching the probabilities. Which property does each tool actually guarantee?',
      expectedOutcome:
        'You distinguish the two: calibration is a property of the predicted PROBABILITIES (reliability of confidence values), whereas conformal is a CONSTRUCTION that guarantees SET/interval coverage. They are complementary -- calibrated probabilities can still yield sets that miss the true label at the wrong rate, and conformal wraps any scorer to restore the coverage guarantee.',
      hint: 'A perfectly calibrated model is not automatically conformal-valid at the set level, and a conformal set is valid even from a wildly miscalibrated scorer -- they answer different questions.',
      conceptsExplored: ['data-science-conformal-prediction', 'data-science-prediction-calibration'],
    },
    {
      instruction:
        'Close by placing conformal prediction on the complex plane of experience: a medium-concreteness, medium-complexity wrapper at the crossroads of nonparametric statistics and applied machine learning. State one line that captures why conformal prediction is the honesty layer for any point predictor.',
      expectedOutcome:
        'You state something like: "Conformal prediction takes any black-box scorer, calibrates its nonconformity on a held-out exchangeable fold, and returns a prediction set with a finite-sample marginal coverage guarantee -- distribution-free, splittable into per-tail controls, and valid as long as exchangeability holds, which is exactly what a drift detector is there to watch."',
      hint: 'The single most scrutinized diagnostic is realized coverage on a rolling window: if it drifts below 1-alpha, exchangeability has broken and the interval is lying -- recalibrate.',
      conceptsExplored: ['data-science-conformal-prediction', 'data-science-drift-detection'],
    },
  ],
};
