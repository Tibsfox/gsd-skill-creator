/**
 * Causal Density Ratio -- data-science concept (June-2026 arXiv cohort, T2).
 * @module departments/data-science/concepts/causal-density-ratio
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 12 * 2 * Math.PI / 14;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const causalDensityRatio: RosettaConcept = {
  id: "data-science-causal-density-ratio",
  name: "Causal Density Ratio",
  domain: 'data-science',
  description:
    "Two probability laws describe the same variables: the observational law P_obs you passively sample, and the interventional law P_do you would see after forcing a change to X. The causal density ratio rho = dP_do/dP_obs is their Radon-Nikodym derivative — a pointwise weight defined wherever P_obs has support. Its defining property is a change of measure: for any test function f, E_do[f(Y)] = E_obs[rho * f(Y)], so reweighting passively collected samples by rho reproduces the expectation you would observe under intervention, exactly as importance sampling reweights one distribution into another. Because rho is identically 1 precisely when intervention leaves the law unchanged, any departure of rho from the constant 1 is a testable, estimable score of X's directed influence on Y — sharper than a correlation, which cannot separate X->Y from confounding. Under an atomic intervention that sets the manipulated node X, a Markovian SCM makes the ratio factor through that one mechanism, collapsing to a propensity-style weight q(x)/p(x). Being a Radon-Nikodym derivative, rho is defined only where P_obs already has support — the positivity/overlap assumption of causal inference — and in practice is not assumed known but estimated directly as a density ratio, e.g. by training a probabilistic classifier to separate interventional from observational draws (classifier-based density-ratio estimation); the paper (Causal Density Functions) derives such practical estimators for do-curves and directed edge scores. (arXiv:2606.00754v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Draw X ~ p_obs, push through Y = g(X,U) on a numpy array, then form rho = q(X)/p(X) elementwise. The do-expectation collapses to a reweighted mean: `(rho * f(Y)).mean()` — importance sampling in one vectorized line, no Python loop. Sanity-check against a fresh interventional sample drawn with X ~ q: the two means agree up to Monte-Carlo noise, and `rho.mean()` approx 1 confirms a valid change of measure. See Pearl 2009.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Hold the samples in a `std::vector<double>` (or `Eigen::ArrayXd`) owned by RAII; a templated `reweight<F>` fuses the ratio buffer rho[i]=q(x[i])/p(x[i]) with f(y[i]) in one contiguous pass. The do-expectation is `(rho*fy).sum()/n` — a multiply-accumulate over cache-friendly memory, zero allocation in the loop. Assert `rho.sum()/n` approx 1 as a normalization invariant before trusting the estimate. See Pearl 2009.",
    }],
    ['unison', {
      panelId: 'unison',
      explanation: "Model P_obs sampling as an ability: `Sample.draw` requests, a handler supplies the stream. The ratio `rho x = q x / p x` is a pure immutable term whose #hash IS its identity — reweighting by that same #hash on any node yields the same do-expectation, so the change of measure is reproducible across the Merkle-DAG. Swapping the handler from the obs-law to the do-law and checking the two expectations agree is a content-addressed equivalence proof. See Pearl 2009.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "data-correlation",
      description: "Correlation measures undirected statistical association; the causal density ratio upgrades it to a directed, intervention-grounded score. rho departs from the constant 1 exactly when forcing X changes Y's law — the directed effect a correlation cannot certify against confounding, so the ratio presupposes and then sharpens the correlational reading.",
    },
    {
      type: "cross-reference",
      targetId: "data-science-d-separation",
      description: "Both certify causal structure but by different machinery: d-separation reads directed influence off a graph via a conditional-independence criterion, while the causal density ratio measures it analytically as a Radon-Nikodym reweighting of the interventional against the observational law — complementary graphical and measure-theoretic views of the same do-semantics.",
    },
    {
      type: "analogy",
      targetId: "data-science-drift-detection",
      description: "Drift detection flags when a live distribution diverges from a reference by monitoring their density ratio; the causal density ratio runs the same two-law comparison, but the reference is the observational law and the live law is the interventional one, so a departure of the ratio from 1 signals causal influence rather than covariate shift.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
