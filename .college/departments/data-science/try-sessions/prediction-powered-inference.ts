/**
 * Prediction-Powered Inference try-session -- valid inference from few labels + many predictions.
 *
 * Walk a learner from the two bad estimators (biased imputation vs wide
 * labels-only), through the rectifier / control-variate correction, the
 * variance decomposition, coverage validity under a broken model, the
 * hypothesis-testing view, PPI++ power tuning, and the tie to conformal
 * prediction -- all by running small simulations and SEEING the intervals
 * move.
 *
 * @module departments/data-science/try-sessions/prediction-powered-inference
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const predictionPoweredInferenceSession: TrySessionDefinition = {
  id: 'data-science-prediction-powered-inference-first-steps',
  title: 'Prediction-Powered Inference: Making a Few Labels Go Further',
  description:
    'A guided first pass through prediction-powered inference -- from the two ' +
    'failing estimators (biased imputation and wide labels-only), through the ' +
    'rectifier control variate, the variance decomposition, coverage validity ' +
    'under a broken predictor, the p-value view, PPI++ power tuning, and the ' +
    'link to conformal prediction, by simulating each step and watching the ' +
    'confidence interval move.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Simulate the setup: draw N=10000 unlabeled features X_tilde and a small n=100 labeled pair set (X, Y), with a trained model f that predicts Y from X. Compute two estimates of the mean of Y: (a) the naive imputation mean = mean(f(X_tilde)) over the unlabeled set, and (b) the classical mean = mean(Y) over the 100 labels, with its 95% z-interval. Plot both against the true mean. What is wrong with each?',
      expectedOutcome:
        'You see the naive imputation interval is narrow but off-center -- it inherits the model\'s bias, so its coverage of the true mean is poor. The classical labels-only interval is centered on the truth but wide, because n=100 is small. Neither is satisfactory: one trades validity for width, the other width for validity. PPI is the attempt to get the classical interval\'s validity at closer to the imputation interval\'s width.',
      hint: 'Treating predictions as if they were ground truth (imputation) is the single most common mistake; it is valid only if f is perfect, which it never is.',
      conceptsExplored: ['data-science-prediction-powered-inference', 'data-confidence-intervals'],
    },
    {
      instruction:
        'Now compute the rectifier: Delta = mean(f(X) - Y) over the 100 labeled pairs -- the model\'s average signed error where you can actually check it. Form the PPI point estimate theta_hat = mean(f(X_tilde)) - Delta. Print theta_hat next to the naive imputation mean and the true mean. What did subtracting Delta do?',
      expectedOutcome:
        'You observe that Delta is the model\'s systematic bias, measured on the only data where truth is known, and subtracting it re-centers the imputation estimate onto the truth. theta_hat = (prediction mean on the big unlabeled set) minus (measured prediction bias on the labeled set): the large set supplies precision, the labeled set supplies the debiasing correction.',
      hint: 'Read theta_hat as "what the model says, corrected by how wrong the model was where we could grade it."',
      conceptsExplored: ['data-science-prediction-powered-inference'],
    },
    {
      instruction:
        'Build the PPI variance as the sum of two independent pieces: Var(f(X_tilde))/N from the unlabeled predictions, plus Var(f(X) - Y)/n from the labeled residuals. Compute each term numerically, take the square root for the standard error, and form the 95% PPI interval. Overlay it on the classical interval from step 1. Which term dominates, and when is the PPI interval much narrower?',
      expectedOutcome:
        'You see the labeled-residual term Var(f-Y)/n dominates whenever f is accurate, and it is small precisely because a good model has low-variance residuals -- so the PPI interval collapses toward the tight imputation width while staying centered. When f is useless, Var(f-Y) approaches Var(Y) and PPI reduces to roughly the classical width. The interval width is a direct readout of how much the model is helping.',
      hint: 'The residual variance -- not the prediction variance -- is what buys you the tighter interval; a model that halves its residual spread roughly halves the dominant variance term.',
      conceptsExplored: ['data-science-prediction-powered-inference', 'data-confidence-intervals'],
    },
    {
      instruction:
        'Stress-test validity: deliberately corrupt f (add a large constant bias and extra noise), then run a Monte Carlo loop of 2000 trials, each redrawing labels and unlabeled data, and tally how often the PPI 95% interval covers the true mean. Do the same tally for the naive imputation interval. Which one keeps its coverage?',
      expectedOutcome:
        'You confirm PPI holds ~95% coverage even with a badly broken f -- the rectifier measures whatever bias f has and cancels it, so validity never depends on the model being good; only the interval width grows. The naive imputation interval\'s coverage collapses far below 95%, because nothing corrects its bias. This is the core guarantee: valid for ANY predictor.',
      hint: 'Coverage validity is a property of the rectifier construction, not of the model. A worse model widens the PPI interval but does not break it.',
      conceptsExplored: ['data-science-prediction-powered-inference', 'data-confidence-intervals'],
    },
    {
      instruction:
        'Switch to testing a hypothesis H0: theta = theta_0. Compute the PPI z-statistic (theta_hat - theta_0) / SE_PPI and its p-value, then compute the classical test using only the 100 labels. Sweep a range of true effect sizes and plot the power (rejection rate under H1) of each test on the same axes. What has the model bought you?',
      expectedOutcome:
        'You see the PPI test controls Type-I error at the nominal level (the rectifier keeps it valid) while achieving higher power than the labels-only test, because the control variate shrinks the standard error. The predictions act exactly as a control variate does in Monte Carlo: same expectation, lower variance, so you reject true departures from H0 with fewer gold labels.',
      hint: 'A control variate is a quantity correlated with your estimator whose mean you can correct for; the model\'s predictions are that variate, and the rectifier is the correction.',
      conceptsExplored: ['data-science-prediction-powered-inference', 'data-hypothesis-testing'],
    },
    {
      instruction:
        'Add the PPI++ tuning knob: replace the rectifier with lambda * Delta and the prediction term with lambda-weighted predictions, then sweep lambda from 0 to 1 and plot the resulting interval width. Read off the width-minimizing lambda*. Repeat once with a strong f and once with a useless f. Where does lambda* land in each case?',
      expectedOutcome:
        'You find lambda* near 1 when f is strong (use the predictions fully) and lambda* near 0 when f is useless (fall back to the classical labels-only estimator, losing nothing). The width curve is convex in lambda, and its minimum is the semiparametrically efficient variance -- PPI++ picks the optimal blend automatically, so you never do worse than classical inference by adopting PPI.',
      hint: 'lambda is a power-tuning dial, not a coverage dial: every lambda in [0,1] stays valid; only the width changes, and lambda* minimizes it.',
      conceptsExplored: ['data-science-prediction-powered-inference'],
    },
    {
      instruction:
        'Close by placing PPI beside conformal prediction and on the complex plane of experience. Both wrap the same black-box f for a finite-sample guarantee -- conformal outputs a prediction set for a new point, PPI outputs an interval for a population parameter. State one line capturing why PPI is the estimator you reach for when labels are scarce and predictions are cheap.',
      expectedOutcome:
        'You articulate something like: "When gold labels cost real money and model predictions are nearly free, PPI debiases the abundant predictions with a rectifier measured on the few labels, delivering confidence intervals and p-values that are valid for any model yet strictly tighter than using the labels alone -- and PPI++ guarantees you never lose to classical inference." You note it sits at medium concreteness and high complexity, at the crossroads of estimation theory and machine learning.',
      hint: 'Conformal prediction and PPI are the two finite-sample wrappers around a black-box predictor: one certifies predictions, the other certifies parameter inference.',
      conceptsExplored: ['data-science-prediction-powered-inference', 'data-science-conformal-prediction'],
    },
  ],
};
