/**
 * Prediction Calibration try-session -- when a model's probabilities mean what they say.
 *
 * Walk a learner from a reliability diagram that exposes deep-network
 * overconfidence, through Expected Calibration Error and temperature scaling,
 * up the average -> partial -> full calibration hierarchy that unifies
 * classification and regression, to why a rising ECE is a drift signal and how
 * calibration differs from the coverage guarantee of conformal prediction.
 *
 * @module departments/data-science/try-sessions/prediction-calibration
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const predictionCalibrationSession: TrySessionDefinition = {
  id: 'data-science-prediction-calibration-first-steps',
  title: 'Prediction Calibration: When Your Model\'s Probabilities Mean What They Say',
  description:
    'A guided first pass through calibration -- from a reliability diagram that ' +
    'exposes deep-network overconfidence, through Expected Calibration Error and ' +
    'temperature scaling, up the average -> partial -> full calibration hierarchy ' +
    'that unifies classification and regression, to why a rising ECE is a drift ' +
    'signal and how calibration differs from conformal coverage.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Train any classifier on a held-out split (a ResNet on CIFAR-10, or sklearn\'s GradientBoostingClassifier on a tabular set), then feed its top-class softmax confidences and correctness flags into sklearn.calibration.calibration_curve(y_true, y_prob, n_bins=15) and plot the returned (prob_true, prob_pred) as a reliability diagram against the y=x diagonal. Look at where the curve sits relative to the diagonal.',
      expectedOutcome:
        'You see the reliability curve bow BELOW the diagonal for the deep model: at a predicted confidence of 0.9 the empirical accuracy is only ~0.75. You articulate calibration as statistical indistinguishability of stated probabilities from observed frequencies, and you name this gap overconfidence -- the model\'s probabilities are larger than the frequencies they should match.',
      hint: 'A perfectly calibrated model traces the diagonal exactly. A curve below the diagonal is overconfident; above it is underconfident. Guo et al. 2017 found modern deep nets are almost always overconfident, and worse as depth and width grow.',
      conceptsExplored: ['data-science-prediction-calibration'],
    },
    {
      instruction:
        'Reduce that whole curve to one number. Bin the predictions into M=15 equal-width confidence bins, and compute the Expected Calibration Error as the weighted average gap ECE = sum_m (|B_m|/n) * |acc(B_m) - conf(B_m)|. Compute the Maximum Calibration Error too, MCE = max_m |acc(B_m) - conf(B_m)|. Print both.',
      expectedOutcome:
        'You get a scalar ECE well above zero (commonly 0.05-0.15 for an uncalibrated deep net) and an MCE that is larger still, dominated by the worst bin. You explain that ECE is the single scrutinised summary of a reliability diagram: the population-weighted L1 distance between the curve and the diagonal, and that MCE flags the confidence region where the model is most untrustworthy.',
      hint: 'ECE weights each bin by how many predictions land in it, so an ugly but nearly-empty bin barely moves it. MCE ignores population and reports the worst-case bin -- use it when any miscalibration is unacceptable.',
      conceptsExplored: ['data-science-prediction-calibration'],
    },
    {
      instruction:
        'Now fix it post-hoc with temperature scaling. On a validation split, hold the trained logits fixed and fit a single scalar T by minimising the negative log-likelihood of softmax(logits / T) with scipy.optimize.minimize. Apply the learned T to the test logits, then recompute BOTH the reliability diagram and the ECE. Also recompute plain argmax accuracy before and after.',
      expectedOutcome:
        'You observe ECE collapse (often by 5-10x) and the reliability curve snap onto the diagonal, while top-1 accuracy is byte-for-byte unchanged. You explain why: dividing every logit by the same T > 1 softens the softmax uniformly, so it never reorders the classes -- it rescales confidence without moving the argmax. Calibration is a property you can repair without retraining.',
      hint: 'T > 1 makes the model less confident (softer), T < 1 sharpens it. Because T is a single shared scalar it cannot change which class is largest, so accuracy is invariant -- only the probabilities move.',
      conceptsExplored: ['data-science-prediction-calibration'],
    },
    {
      instruction:
        'Compare recalibrators. Wrap the base model in sklearn.calibration.CalibratedClassifierCV twice -- once with method="sigmoid" (Platt scaling) and once with method="isotonic" -- fit each on the validation split, and score ECE plus a proper scoring rule (Brier score, or log-loss) on the test split for temperature scaling vs Platt vs isotonic. Watch what happens as you shrink the validation set to a few hundred points.',
      expectedOutcome:
        'You see isotonic regression achieve the lowest ECE with abundant validation data but overfit and degrade on small sets, while Platt/temperature scaling are lower-variance parametric fits that stay robust. You connect this to the Brier decomposition -- calibration plus refinement -- and conclude the recalibrator is a bias/variance choice governed by how much held-out data you can spend.',
      hint: 'Isotonic is non-parametric (a monotone step function) so it is flexible but data-hungry; Platt/temperature are 1-2 parameter fits that resist small-sample noise. The Brier score rewards calibration AND resolution, so a flat "always predict base rate" model is calibrated but useless.',
      conceptsExplored: ['data-science-prediction-calibration', 'data-confidence-intervals'],
    },
    {
      instruction:
        'Climb the hierarchy from average to partial calibration. Your ECE so far is marginal (averaged over the whole test set). Now slice the test set by a subgroup -- e.g. class label, or a sensitive attribute -- and recompute ECE within each group. Compare the per-group ECEs against the single marginal ECE.',
      expectedOutcome:
        'You find a model that is well-calibrated on average yet badly miscalibrated inside individual groups: the marginal ECE hid offsetting per-group errors that cancel in the mean. You articulate the arXiv 2606.03245 ladder -- average (marginal) is the weakest rung, partial (group-conditional) is stronger, and full (distribution) calibration is strongest -- and why marginal calibration alone is a weak guarantee.',
      hint: 'Average calibration can be gamed: overconfidence on group A and underconfidence on group B cancel in the pooled ECE. Partial calibration demands the reliability diagonal hold WITHIN each group, which is a strictly harder condition.',
      conceptsExplored: ['data-science-prediction-calibration'],
    },
    {
      instruction:
        'Cross the classification/regression divide. Take a probabilistic regressor that emits a full predictive distribution (a Gaussian mean+variance head, or a quantile regressor), and for each test point compute the Probability Integral Transform value u_i = F_i(y_i) -- the predictive CDF evaluated at the realised target. Plot a histogram of the u_i and a uniform QQ-plot.',
      expectedOutcome:
        'You see that a calibrated regressor makes the PIT values uniform on [0,1] (flat histogram, points on the QQ diagonal), while an over-narrow predictive distribution makes the PIT pile up at 0 and 1. You recognise PIT/quantile calibration as the SAME reliability property expressed for continuous targets -- the regression rung of the hierarchy -- so one definition covers classification and regression.',
      hint: 'PIT uniformity is the regression analogue of the reliability diagram: a U-shaped PIT histogram means the intervals are too tight (overconfident); a hump in the middle means they are too wide. It is exactly the interval-coverage question in disguise.',
      conceptsExplored: ['data-science-prediction-calibration', 'data-confidence-intervals'],
    },
    {
      instruction:
        'Close on the two neighbours. First, feed the calibrated model a stream of gradually drifted inputs (shift the feature distribution over synthetic batches) and track ECE per batch over time. Then contrast with conformal prediction: wrap the same model to emit prediction sets at a target 90% coverage and check empirical coverage on both clean and drifted data. State how the two ideas differ.',
      expectedOutcome:
        'You watch ECE climb monotonically as drift grows -- so calibration error is itself a label-light drift monitor -- while the conformal sets keep ~90% marginal coverage on exchangeable data by construction but can also break under drift. You state the punchline: calibration is a reliability property a model may or may not possess and that decays under drift; conformal prediction is the distribution-free construction that guarantees coverage on exchangeable data.',
      hint: 'Calibration is diagnostic (measure the gap, watch it rise); conformal is constructive (guarantee coverage by design). Both assume exchangeability, so both degrade under distribution drift -- which is exactly why rising ECE doubles as an early-warning drift signal.',
      conceptsExplored: [
        'data-science-prediction-calibration',
        'data-science-conformal-prediction',
        'data-science-drift-detection',
      ],
    },
  ],
};
