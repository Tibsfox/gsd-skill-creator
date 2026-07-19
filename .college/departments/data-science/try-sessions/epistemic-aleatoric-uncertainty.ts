/**
 * Epistemic Aleatoric Uncertainty try-session -- data-science (June-2026 arXiv cohort, T2).
 * @module departments/data-science/try-sessions/epistemic-aleatoric-uncertainty
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const epistemicAleatoricUncertaintySession: TrySessionDefinition = {
  id: 'data-science-epistemic-aleatoric-uncertainty-first-steps',
  title: "Splitting Uncertainty: The Sample vs Mechanism Floor",
  description:
    "Derive the aleatoric/epistemic decomposition from the law of total variance on a synthetic dataset, then break the model's mechanism to expose the sample-reducible and mechanism-reducible pieces and watch the impossibility result appear as a nonzero floor.",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write a generator y = sin(x) + noise where the noise standard deviation itself depends on x, e.g. σ(x)=0.1+0.3|x|; sample 2000 points and keep x, y, and the true σ(x) array you used to draw the noise.",
      expectedOutcome:
        "You hold a dataset whose irreducible, input-dependent noise you know exactly — the ground-truth aleatoric term you will later try to recover blindly from an ensemble and grade against.",
      hint: "Heteroscedastic means the noise scale is a function of x, not a constant; store the true σ(x) so you can score your estimate.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty"],
    },
    {
      instruction:
        "Train an ensemble of K=30 regressors on bootstrap resamples of the data, each also predicting its own noise variance; stack member predictions into a (K, n) matrix P and their per-point variances into a (K, n) matrix V.",
      expectedOutcome:
        "You see that aleatoric information lives inside each member (V) while epistemic disagreement lives across members (the spread of P), which is why two matrices, not one, are needed.",
      hint: "Bootstrap resampling makes members disagree most where data is scarce — that cross-member disagreement is the epistemic signal.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty"],
    },
    {
      instruction:
        "Apply the law of total variance: compute aleatoric = V.mean(axis=0) and epistemic = P.var(axis=0), then plot both against x alongside the true σ(x)² curve you saved in step 1.",
      expectedOutcome:
        "You confirm aleatoric tracks the known noise floor while epistemic spikes in the sparse tails, empirically separating the two terms Var[Y]=E[Var[Y|θ]]+Var[E[Y|θ]].",
      hint: "The first term is the mean of member variances; the second is the variance of member means — exactly your two column reductions.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty", "data-science-prediction-calibration"],
    },
    {
      instruction:
        "Re-fit the ensemble for n in {125, 250, 500, 1000, 2000, 4000} and record the mean epistemic variance at one fixed test point; plot mean-epistemic against n on log-log axes.",
      expectedOutcome:
        "You observe the epistemic curve falling roughly like 1/n — this is the sample-reducible component that collecting more in-distribution data genuinely erases.",
      hint: "A slope near -1 on log-log axes is the 1/n signature of sampling-limited uncertainty.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty"],
    },
    {
      instruction:
        "Break the mechanism: regenerate y so it also depends on a second feature x2, but hide x2 from the ensemble; repeat the full n-sweep and overlay the new epistemic-vs-n curve on the previous one.",
      expectedOutcome:
        "You see the epistemic variance flatten to a nonzero floor no amount of n removes — the mechanism-reducible term created by the unmeasured driver x2.",
      hint: "This floor is model misspecification, not sampling noise; only observing x2, a change to the mechanism, can lower it.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty", "data-science-drift-detection"],
    },
    {
      instruction:
        "Fit the model epistemic(n) = a + b/n by least squares to your swept points for BOTH runs, and report the estimated a (floor) and b (sample-reducible coefficient) for the well-specified and the hidden-feature cases.",
      expectedOutcome:
        "You quantify the split numerically: a≈0 when the mechanism is captured but a>0 when x2 is hidden, cleanly isolating mechanism-reducible from sample-reducible uncertainty.",
      hint: "Regress epistemic on 1/n as a linear feature; the intercept is the irreducible-by-sampling floor.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty"],
    },
    {
      instruction:
        "Tie it to intervals: at the test point build a bootstrap confidence interval for E[Y|x] in the well-specified run and check its half-width shrinks like 1/√n, matching the square root of your sample-reducible term b/n.",
      expectedOutcome:
        "You connect the sample-reducible epistemic variance to classical CI width, seeing this decomposition as a strict extension of confidence-interval reasoning rather than a replacement.",
      hint: "CI half-width ∝ √(sample-reducible variance) ∝ 1/√n; the mechanism-reducible floor has no CI analogue.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty", "data-confidence-intervals"],
    },
    {
      instruction:
        "State the impossibility: argue from your two curves why no in-distribution sampling schedule drives total epistemic uncertainty to zero while x2 stays hidden, then verify by extrapolating your a + b/n fit to n→∞.",
      expectedOutcome:
        "You can articulate the paper's headline — epistemic uncertainty is not monotonically sample-erasable — and name what a real reduction needs: a richer model, a new feature, or interventional data.",
      hint: "Take the n→∞ limit of a + b/n; the surviving constant a IS the impossibility result.",
      conceptsExplored: ["data-science-epistemic-aleatoric-uncertainty", "data-science-conformal-prediction"],
    },
  ],
};
