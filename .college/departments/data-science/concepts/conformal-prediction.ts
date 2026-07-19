/**
 * Conformal Prediction concept -- distribution-free prediction intervals.
 *
 * Statistical Inference wing: finite-sample coverage without distributional
 * assumptions. Split conformal prediction (Vovk, Gammerman, Shafer 2005)
 * calibrates a nonconformity score on a held-out fold and forms a prediction
 * set from the empirical quantile of the calibration residuals; the marginal
 * coverage bound P(Y in C(X)) >= 1-alpha holds under exchangeability alone.
 * Surfaced for the College from arXiv:2606.18199, which splits the guarantee
 * into separate upper/lower-tail (one-sided) controls.
 *
 * @module departments/data-science/concepts/conformal-prediction
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 4 * 2pi/29 (statistical inference: a calibration wrapper), radius ~0.8
const theta = 4 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const conformalPrediction: RosettaConcept = {
  id: 'data-science-conformal-prediction',
  name: 'Conformal Prediction',
  domain: 'data-science',
  description: 'Distribution-free prediction intervals whose coverage is ' +
    'guaranteed by calibration rather than by a parametric model. Split ' +
    'conformal prediction fixes a miscoverage level alpha, scores a held-out ' +
    'calibration set with a nonconformity measure (for regression, the ' +
    'absolute residual |y - y_hat|), and takes the ceil((n+1)(1-alpha))/n ' +
    'empirical quantile q of those scores. The prediction set ' +
    'C(X) = {y : score(X,y) <= q} then satisfies the marginal coverage bound ' +
    'P(Y in C(X)) >= 1-alpha in finite samples under exchangeability alone -- ' +
    'no Gaussianity, no asymptotics, no well-specified likelihood. The ' +
    'guarantee splits into separate upper- and lower-tail (one-sided) ' +
    'controls, so over-prediction and under-prediction can be bounded ' +
    'independently (arXiv:2606.18199, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In sklearn/numpy idiom, split conformal is a fit on the proper training set, then residuals = np.abs(y_cal - model.predict(X_cal)) over a held-out calibration fold. The interval half-width is np.quantile(residuals, np.ceil((n+1)*(1-alpha))/n) -- one line -- and coverage is a list-comprehension mean over the test set (MAPIE wraps the whole loop). ' +
        'See Vovk et al. 2005.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ keeps the calibration residuals in a contiguous Eigen::VectorXd owned through an RAII CalibrationSet handle; std::nth_element extracts the ceil((n+1)(1-alpha)) order statistic in place, no full sort. A templated NonconformityScore functor abstracts absolute-residual versus normalized scores, so the conformal quantile is one pass over a preallocated buffer. ' +
        'See Vovk et al. 2005.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'Unison hashes the nonconformity score and each calibration split to a content-addressed identifier; a conformal interval is a composition of those hashes over an immutable residual list, so the quantile is deterministic and cached by hash. An ability handler tracks the calibration-data effect; every prediction set is reproducible from its input hashes as a Merkle-DAG node. ' +
        'See Vovk et al. 2005.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-confidence-intervals',
      description: 'Conformal intervals are distribution-free confidence intervals: they earn finite-sample coverage from exchangeability instead of from a parametric sampling model',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-prediction-calibration',
      description: 'Two faces of trustworthy prediction: calibration is a property of the predicted probabilities, while conformal is a construction that guarantees set/interval coverage',
    },
    {
      type: 'dependency',
      targetId: 'data-science-drift-detection',
      description: 'Conformal coverage holds only under exchangeability; drift detection flags when that assumption breaks and the coverage guarantee silently degrades',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
