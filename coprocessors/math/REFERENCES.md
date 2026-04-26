# Math Coprocessor — Reference Bibliography

This file records the academic anchors for the math coprocessor chipset
(algebrus / fourier / statos / symbex / vectora) and its theoretical
foundations.  Entries are ordered by arXiv identifier.

---

## arXiv:2603.03700 — Intrinsic Wasserstein Dimension and Diffusion Generalization Bounds

**Title:** Intrinsic Wasserstein Dimension and Generalization Bounds for
Diffusion-Based Models  
**Year:** 2026  
**Relevance:** Anchor for the `vectora` chip and the Wasserstein-Everywhere
direction (Phase 839, JP-024).

This paper establishes tight generalization bounds for diffusion-based
learning models in terms of the *intrinsic Wasserstein dimension* of the
data manifold — a quantity that can be substantially smaller than the
ambient dimension.  The key result is that sample complexity scales with
the intrinsic Wasserstein dimension rather than the ambient embedding
dimension, giving a theoretical foundation for why Wasserstein-geometry
regularization (used in JP-022 BOED scoring and JP-037 robust priors) is
the natural framework for distribution-aware bounded learning.

The `vectora` chip's embedding operations implicitly benefit from this
result: when the input distribution lies on a low-intrinsic-dimension
Wasserstein manifold, generalization error decays at the faster intrinsic
rate.  A future phase may add an explicit intrinsic-dimension estimator to
the chip pipeline.

---

## arXiv:2604.21580 — Wasserstein Distributionally Robust Optimization

**Title:** Wasserstein Distributionally Robust Optimization  
**Year:** 2026  
**Relevance:** Anchor for `src/orchestration/wasserstein-prior.ts` (JP-037,
Phase 839).

Establishes the dual formulation and tractable approximation of worst-case
risk minimization over Wasserstein-ball ambiguity sets.  The DRO dual is
used directly in the routing prior robustification procedure.

---

## arXiv:2604.21849 — Beyond Expected Information Gain: IPM-based BOED

**Title:** Beyond Expected Information Gain: Information-Projection Metric
Bayesian Optimal Experimental Design  
**Year:** 2026  
**Relevance:** Anchor for `src/ab-harness/wasserstein-boed.ts` (JP-022,
Phase 839).

Replaces KL-divergence EIG with an IPM (Integral Probability Metric)
utility based on the Wasserstein-1 distance between posterior and prior
predictive distributions.  More robust to prior misspecification than
standard EIG because W1 does not diverge under support mismatch.
