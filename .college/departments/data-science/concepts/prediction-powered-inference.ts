/**
 * Prediction-Powered Inference concept -- valid inference from few labels + many predictions.
 *
 * Statistical Inference wing: how to make a small labeled sample go further.
 * Prediction-powered inference (Angelopoulos et al. 2023) fuses n gold labels
 * with N machine-learning predictions to produce confidence intervals and
 * p-values that are statistically valid for any predictor, yet strictly
 * tighter than the classical labels-only estimator. The debiasing "rectifier"
 * is the model's average error on the labeled set, used as a control variate;
 * PPI++ power-tunes it to the semiparametrically efficient variance. Surfaced
 * for the College from arXiv:2606.08730.
 *
 * @module departments/data-science/concepts/prediction-powered-inference
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 7*2pi/29 ~ 1.52 rad (a research-grade inference backbone), radius ~0.82
const theta = 7 * 2 * Math.PI / 29;
const radius = 0.82;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const predictionPoweredInference: RosettaConcept = {
  id: 'data-science-prediction-powered-inference',
  name: 'Prediction-Powered Inference',
  domain: 'data-science',
  description: 'Combining a small gold-standard labeled sample with a large pool of ' +
    'machine-learning predictions to produce statistically valid inference -- ' +
    'confidence intervals and p-values -- on a target parameter theta. A naive ' +
    '"imputation" estimator that treats predictions f(X) as ground truth is biased; ' +
    'the classical estimator that uses only the n labeled points is valid but wide. ' +
    'PPI forms a prediction-powered estimate theta_f (from f over the large unlabeled ' +
    'set) minus a rectifier Delta = mean(f(X) - Y) measured on the labeled set, which ' +
    'acts as a variance-reducing control variate that debiases the imputation. Coverage ' +
    'holds for any predictor f, however inaccurate -- provided the labeled and unlabeled ' +
    'samples are drawn from the same distribution (simple random sampling) -- while the ' +
    'interval tightens as f sharpens; PPI++ tunes a power parameter lambda to reach the ' +
    'semiparametrically efficient variance. The framework covers any M-estimation estimand ' +
    '-- means, quantiles, and GLM coefficients. The 2026 source (Statistical Optimality of ' +
    'Prediction-Powered Inference) reframes PPI as M-estimation and, via its efficient ' +
    'influence function, proves PPI attains the semiparametric efficiency bound exactly ' +
    'when the predictor is score-calibrated (its output matches the true conditional ' +
    'expectation), with cross-fitting extending the guarantee to learned predictors ' +
    '(Angelopoulos et al., 2023; arXiv:2606.08730).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom PPI is two arrays: model predictions f(X_tilde) over N unlabeled points and the rectifier residuals [f(x) - y for x, y in labeled] over the n gold labels. The ppi_py library subtracts the residual mean (a control variate) from the predicted mean; sklearn supplies f and scipy.stats returns the z-interval, whose half-width shrinks as f sharpens. ' +
        'See Angelopoulos et al. 2023.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ keeps labeled residuals and unlabeled predictions in preallocated Eigen::VectorXd buffers owned by an RAII PpiEstimator handle; a templated Estimand functor (mean, quantile, GLM link) fixes the objective at compile time. The rectifier Delta = mean(f(X)-Y) is a contiguous reduction subtracted from the prediction mean, and the sandwich variance is two dot products. ' +
        'See Angelopoulos et al. 2023.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'In Unison the predictor f and the rectifier Delta each hash to a content-addressed term; a PPI interval is a deterministic composition of those hashes over immutable labeled and unlabeled values. Resampling runs under a typed {Random} ability handler, so a confidence interval is reproducible from its input hashes -- the inference is a Merkle-DAG auditable end to end. ' +
        'See Angelopoulos et al. 2023.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-confidence-intervals',
      description: 'PPI produces valid confidence intervals from a few labels plus many model predictions, tightening the classical interval without sacrificing coverage',
    },
    {
      type: 'cross-reference',
      targetId: 'data-hypothesis-testing',
      description: 'PPI yields valid p-values by using the model predictions as a variance-reducing control variate -- the rectifier term -- while the labeled sample keeps Type-I error under control',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-conformal-prediction',
      description: 'Both wrap a black-box predictor to obtain finite-sample-valid guarantees: PPI for parameter inference (CIs, p-values), conformal prediction for prediction sets',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
