/**
 * Causal Density Ratio try-session -- data-science (June-2026 arXiv cohort, T2).
 * @module departments/data-science/try-sessions/causal-density-ratio
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const causalDensityRatioSession: TrySessionDefinition = {
  id: 'data-science-causal-density-ratio-first-steps',
  title: "Reweighting Observation into Intervention",
  description:
    "Build a two-variable synthetic SCM, sample it passively, and derive by hand the causal density ratio that turns those observational samples into a do-interventional expectation — verifying the E_do = E_obs*rho identity against a directly simulated intervention and watching it break when overlap fails.",
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Write a synthetic SCM: draw X ~ Normal(0,1) as p_obs, then compute Y = g(X,U) = tanh(X) + 0.3*U with U ~ Normal(0,1), and code a sampler that returns N=100000 observational (X,Y) pairs as numpy arrays. Keep the mechanism g as its own reusable function.",
      expectedOutcome:
        "You see that the observational law arises from an input law p(x) composed with a fixed mechanism g plus exogenous noise, and that g is the invariant piece you will reuse unchanged under intervention.",
      hint: "Sample U separately from X so the exact same g(X,U) can be replayed later with a different input law.",
      conceptsExplored: ["data-science-causal-density-ratio", "data-correlation"],
    },
    {
      instruction:
        "Define a stochastic intervention as a new input law q: X ~ Normal(1,1), leaving g untouched. Simulate a ground-truth interventional sample by drawing X ~ q, pushing it through the SAME g, and compute E_do[Y] directly as the mean of that sample.",
      expectedOutcome:
        "You understand that do-intervention swaps the input distribution but not the mechanism, and that this directly simulated mean is the target E_do[Y] that reweighting must reproduce without ever sampling from q again.",
      hint: "Use a continuous q (not a point mass) so a pointwise density ratio against p actually exists.",
      conceptsExplored: ["data-science-causal-density-ratio"],
    },
    {
      instruction:
        "Derive the causal density ratio rho(x) = q(x)/p(x) analytically for the two Gaussians (a closed-form exp expression), then evaluate rho on the X values from your ORIGINAL observational sample of step 1.",
      expectedOutcome:
        "You see rho is a pointwise weight, above 1 where q places more mass than p and below 1 where it places less, encoding how the intervention re-distributes the input relative to what you passively observed.",
      hint: "For two Gaussians the log-ratio is quadratic in x; exponentiate it rather than dividing two pdf calls.",
      conceptsExplored: ["data-science-causal-density-ratio"],
    },
    {
      instruction:
        "Verify the change-of-measure identity: compute E_obs[Y * rho(X)] as the mean of Y*rho over the observational sample, and compare it numerically to the directly simulated E_do[Y] from step 2.",
      expectedOutcome:
        "You confirm the core identity E_do[f(Y)] = E_obs[rho * f(Y)]: reweighting passively collected samples reproduces the interventional expectation up to Monte-Carlo error, without drawing a single fresh interventional point.",
      hint: "Report the two numbers side by side plus their gap; it should shrink like 1/sqrt(N) as you raise the sample size.",
      conceptsExplored: ["data-science-causal-density-ratio"],
    },
    {
      instruction:
        "Check that rho is a valid Radon-Nikodym derivative by computing E_obs[rho] = rho.mean() over the observational sample and confirming it is approximately 1.",
      expectedOutcome:
        "You learn the normalization invariant: a genuine change of measure integrates the ratio back to 1 against the base law, and a mean that drifts from 1 warns of too few samples or a support mismatch between q and p.",
      hint: "If this diverges from 1 while N is large, suspect that q reaches into regions p barely covers.",
      conceptsExplored: ["data-science-causal-density-ratio"],
    },
    {
      instruction:
        "Run the null test: set q = p (no intervention), recompute rho and both expectations, and also compute the ordinary correlation of X and Y for comparison across this and the intervened case.",
      expectedOutcome:
        "You observe rho collapses to the constant 1 and E_do equals E_obs, so departure of rho from constant 1 — not the correlation, which is unchanged — is the actual score of directed influence of X on Y.",
      hint: "Contrast this measure-theoretic do/obs test with reading the effect off a graph via conditional independence.",
      conceptsExplored: ["data-science-causal-density-ratio", "data-correlation", "data-science-d-separation"],
    },
    {
      instruction:
        "Break the estimator: push q far from p (e.g. Normal(4, 0.5)) so its support pokes past where p has mass, recompute the importance weights rho, and inspect the maximum weight and the effective sample size N_eff = (sum rho)^2 / sum(rho^2).",
      expectedOutcome:
        "You see the estimate's variance explode as a few huge weights dominate, learning that the ratio requires absolute continuity P_do << P_obs (positivity/overlap) — the same failure mode as inverse-propensity weighting under poor overlap.",
      hint: "Watch N_eff crater relative to N; that ratio is your early-warning gauge for an untrustworthy reweighting.",
      conceptsExplored: ["data-science-causal-density-ratio", "data-science-drift-detection"],
    },
    {
      instruction:
        "Finally, pretend p and q are unknown: estimate rho from the two samples via a simple density-ratio fit (e.g. logistic classification of obs vs interventional draws, using its odds as rho), and re-run the E_do reweighting with the fitted ratio.",
      expectedOutcome:
        "You grasp that the causal density ratio is estimable purely from data, so a fitted rho that is non-constant is a testable score of directed influence even when the true laws are hidden — mirroring how drift detection fits a two-sample ratio.",
      hint: "A calibrated classifier's odds q/p ratio approximates rho; check its mean is near 1 before trusting the reweight.",
      conceptsExplored: ["data-science-causal-density-ratio", "data-science-drift-detection", "data-science-d-separation"],
    },
  ],
};
