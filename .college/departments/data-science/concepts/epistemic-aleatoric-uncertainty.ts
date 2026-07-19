/**
 * Epistemic Aleatoric Uncertainty -- data-science concept (June-2026 arXiv cohort, T2).
 * @module departments/data-science/concepts/epistemic-aleatoric-uncertainty
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 13 * 2 * Math.PI / 14;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const epistemicAleatoricUncertainty: RosettaConcept = {
  id: "data-science-epistemic-aleatoric-uncertainty",
  name: "Epistemic Aleatoric Uncertainty",
  domain: 'data-science',
  description:
    "Predictive uncertainty is not one scalar. The law of total variance splits Var[Y|x] into an aleatoric term E[Var[Y|θ,x]] — irreducible noise in the data-generating process — and an epistemic term Var[E[Y|θ,x]] arising from ignorance of the true parameter θ. The 2026 refinement (the sample/mechanism decomposition) partitions the epistemic term again: a sample-reducible piece that shrinks like O(1/n) as more in-distribution data arrives, and a mechanism-reducible piece fixed by model misspecification and unmeasured mechanisms, invariant to in-distribution sample size. The headline is an impossibility result: no in-distribution sampling schedule drives epistemic uncertainty to zero when the mechanism-reducible term is nonzero — genuine reduction requires a richer hypothesis class, a new feature, or interventional data, not merely more rows. (arXiv:2606.12646v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Fit an ensemble of K models, predict on x, and read the two variances off the stack. `preds = np.array([m.predict(X) for m in ensemble])  # (K, n)`; aleatoric ≈ `np.mean(member_var, axis=0)`, epistemic ≈ `preds.var(axis=0)`. Grow n and watch only the sample-reducible slice of `epistemic` decay like 1/n; the residual floor is the mechanism-reducible term no resampling touches. See Hüllermeier & Waegeman 2021.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Hold the ensemble in a `std::vector<Model>` and predictions in a contiguous `Eigen::MatrixXd P(K, n)` — one RAII buffer, no leaks. `P.colwise().mean()` gives E[Y]; the column-wise sample variance of P over the K rows is the epistemic term, the mean of members' own variances is aleatoric. Template the scalar so float/double share the decomposition. The 1/n slice is sample-reducible; the invariant floor is mechanism-reducible. See Hüllermeier & Waegeman 2021.",
    }],
    ['unison', {
      panelId: 'unison',
      explanation: "Each fitted member is an immutable term whose #hash IS its identity, so an ensemble is a set of hashes and its variance split is content-addressed: same members, same #hash, same aleatoric/epistemic decomposition — reproducible across the Merkle DAG. Sampling runs under a `Sample` ability whose handler records each draw; the sample-reducible term is a fold over those draws, the mechanism-reducible floor is the residual no handler can shrink. See Hüllermeier & Waegeman 2021.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "data-confidence-intervals",
      description: "A confidence interval quantifies sampling uncertainty about an estimate; the sample-reducible epistemic term is exactly the CI half-width that shrinks as 1/√n, so this taxonomy extends interval reasoning to the mechanism-reducible part a CI cannot express.",
    },
    {
      type: "cross-reference",
      targetId: "data-science-conformal-prediction",
      description: "Conformal prediction yields finite-sample-valid coverage sets but bundles total uncertainty into one width; this decomposition explains why a conformal set can stay wide despite abundant in-distribution data — the mechanism-reducible floor is untouched by more calibration rows.",
    },
    {
      type: "cross-reference",
      targetId: "data-science-prediction-calibration",
      description: "Calibration checks whether predicted probabilities match empirical frequencies, a property about the aleatoric/reported match; a perfectly calibrated model can still carry large epistemic uncertainty, so calibration and this source-taxonomy diagnose different failure modes.",
    },
    {
      type: "analogy",
      targetId: "data-science-drift-detection",
      description: "Distribution drift is a change in the data-generating mechanism over time; analogously the mechanism-reducible term is the uncertainty an unchanged in-distribution sampling regime cannot erase — both point outside the current mechanism as the only lever.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
