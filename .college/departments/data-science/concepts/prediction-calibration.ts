/**
 * Prediction Calibration concept -- when a model's probabilities mean what they say.
 *
 * Statistical Inference wing: reliability of probabilistic forecasts.
 * A forecaster is calibrated when, among all cases predicted with confidence p,
 * a fraction p actually occur. Surfaced for the College from the June-2026 arXiv
 * survey arXiv:2606.03245, which organises calibration into an average -> partial
 * -> full hierarchy that unifies classification and regression, and revisits the
 * Guo et al. 2017 finding that modern deep networks are systematically overconfident.
 *
 * @module departments/data-science/concepts/prediction-calibration
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 5 * 2pi/29 ~ 1.083 rad (inference ring, medium abstraction), radius 0.8
const theta = 5 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const predictionCalibration: RosettaConcept = {
  id: 'data-science-prediction-calibration',
  name: 'Prediction Calibration',
  domain: 'data-science',
  description: 'A probabilistic forecaster is calibrated when its stated ' +
    'probabilities are statistically indistinguishable from observed outcomes: ' +
    'among all cases predicted with confidence p, a fraction p should actually ' +
    'occur. arXiv 2606.03245 (2026) organises this into a hierarchy -- average ' +
    '(marginal) calibration, partial (group-conditional) calibration, and full ' +
    '(distribution) calibration -- a single ladder that unifies classification ' +
    'and regression, where the regression rung is quantile / PIT calibration. ' +
    'Miscalibration is quantified by the Expected Calibration Error, ' +
    'ECE = sum_m (|B_m|/n) |acc(B_m) - conf(B_m)| over M confidence bins, with ' +
    'the Maximum Calibration Error the worst bin; a reliability diagram plots ' +
    'accuracy against confidence, the diagonal being perfect calibration. ' +
    'Guo et al. 2017 showed modern deep networks are systematically overconfident ' +
    'and that temperature scaling -- dividing logits by a single learned scalar T ' +
    'before the softmax -- restores calibration post-hoc without changing the ' +
    'argmax accuracy. Calibration is the reliability half of any proper scoring ' +
    'rule: the Brier score decomposes into calibration plus refinement.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In sklearn idiom, calibration is calibration_curve binning softmax confidences against observed accuracy, and CalibratedClassifierCV wrapping isotonic regression or Platt scaling. ' +
        'ECE is a one-line comprehension, sum(w_m * abs(acc_m - conf_m) for m in bins), and temperature scaling is a scalar scipy.optimize.minimize over validation NLL. ' +
        'See Guo et al. 2017.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ inference cores score calibration over a contiguous Eigen::ArrayXf of logits: a templated Binner<M> owns preallocated per-bin accumulators -- count, confidence-sum, hit-count -- through RAII, so the reliability histogram fills in one cache-friendly pass. ' +
        'Temperature scaling holds a single learned T, dividing logits in place before the softmax. ' +
        'See Guo et al. 2017.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'Unison hashes the calibration pipeline as content-addressed terms: the binner, the ECE reducer, and the temperature optimiser each carry a unique hash, and an ability handler tracks the {Random} effect of the validation split so every run is deterministic. ' +
        'A reliability report is an immutable value derived from those hashes, a reproducible node in the evaluation Merkle-DAG. ' +
        'See Guo et al. 2017.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-confidence-intervals',
      description: 'Confidence intervals target the same reliability property calibration does: predicted probabilities should match observed frequencies, so a nominal 90% interval should contain the truth 90% of the time',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-conformal-prediction',
      description: 'Calibration is a probability-reliability property a model may or may not have; conformal prediction is the distribution-free construction that guarantees marginal coverage by design',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-drift-detection',
      description: 'A model\'s calibration decays as the input distribution drifts away from training, so a rising Expected Calibration Error (ECE) is itself a monitorable drift signal',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
