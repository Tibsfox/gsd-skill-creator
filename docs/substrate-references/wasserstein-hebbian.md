# Wasserstein-Hebbian — Substrate Reference

<!-- Phase: 0751-w6-t2c-wasserstein-hebbian-reference -->
<!-- Milestone: v1.49.572 arXiv April 17-23 Math Foundations -->
<!-- Source: arXiv:2604.16052 (Tan 2026, 75 pp, bib key `arxiv260416052`) -->
<!-- Source artifact: .planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex §sec:m5-wasserstein -->
<!-- Requirement: MATH-19 -->

**Status:** canonical substrate documentation
**Implements:** MATH-19 (Phase 751)
**Relationship to source:** compressed summary of a 75-page monograph,
oriented toward gsd-skill-creator adapter-stack applicability. This document
is deliberately **not** a faithful re-derivation of Tan's proofs; it is a
substrate-level reader's reference to the framework, its hypotheses, and the
points at which GSD code can plausibly observe — never enforce — consistency
with it.
**Cross-references:** Phase 741 M5 §m5-wasserstein (theoretical foundation),
Phase 743 synthesis connection 6 (M4 W₁ ↔ M5 W₂), Phase 746 Ricci-Curvature
Audit (W₁ discrete sibling), Phase 748 Bounded-Learning Reference (adjacent
substrate theorem), Phase 750 Hourglass-Persistence (adjacent T2 sibling).

---

## §1. Background — Hebbian Learning as Optimal Transport

The classical Hebbian rule — "neurons that fire together wire together" —
updates a synaptic weight `w_ij` in proportion to the correlation of
pre-synaptic activity `x_i` and post-synaptic activity `x_j`:

```
w_ij ← w_ij + η · x_i · x_j
```

In the standard reading this is a point-estimate update: at each time step
there is one scalar value per synapse. Tan's monograph, arXiv:2604.16052
(bib key `arxiv260416052`, 75 pp), lifts this picture from scalar weights
to **probability distributions over weight configurations**, and frames the
time evolution of those distributions as a **Wasserstein-2 gradient flow on
the Wasserstein manifold** $\mathcal{P}_2(\mathbb{R}^d)$.

The lift has two motivations. First, biological synapses are noisy — the
effective weight is a random variable, not a scalar. Second, modern
learning systems that evolve weights by SGD or variational methods produce,
in aggregate, a distribution over weights; reasoning about the geometry of
that distribution is the mathematically correct framing for stability,
convergence, and recovery claims. The M5 module (Phase 741,
[`module_5.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex)
§`sec:m5-wasserstein`) identifies this paper as the primary Silicon-Layer
reference for plasticity geometry.

## §2. The Core Update — Gradient Flow on $\mathcal{P}_2$

Let $\mu_t \in \mathcal{P}_2(\mathbb{R}^d)$ denote the probability
distribution over synaptic weights at time `t`. Tan's framework recasts the
Hebbian update as a probability-measure-valued flow

```
μ_{t+1} = μ_t - τ · ∇_{W₂} ℱ[μ_t]
```

where:

- $\tau > 0$ is a time-step parameter;
- $\nabla_{W_2}$ is the **Wasserstein-2 gradient** — the gradient in the
  geometry of the $W_2$ metric on $\mathcal{P}_2$, not the ordinary
  functional derivative;
- $\mathcal{F}[\mu]$ is a **synaptic free-energy functional** of the form
  $\mathcal{F}[\mu] = \mathbb{E}_\mu[\ell(w)] + \beta \cdot H[\mu]$,
  combining an expected loss term and an entropy-regularisation term with
  inverse-temperature weight $\beta \geq 0$.

The classical Hebbian update is recovered in the degenerate case where $\mu$
is a point mass and the loss is the negative correlation $\ell(w) = -x \cdot
y \cdot w$. In the non-degenerate case, Tan shows (via the Jordan–Kinderlehrer–Otto
variational framework lineage — section ~§2 of the source, approximate
reference) that this gradient flow is **well-posed** on $\mathcal{P}_2$ under
mild regularity hypotheses on $\ell$ and that it admits a
**stationary measure** $\mu_\infty$ satisfying a Wasserstein-Hebbian
**fixed-point equation**. The fixed-point measure encodes the "natural
learning equilibrium" of the underlying correlation structure of the input
distribution — an object with no counterpart in the scalar-Hebbian reading.

The 75-page treatment includes four detailed theorems (well-posedness,
convergence to $\mu_\infty$, variance-contraction under second-order
hypotheses, and a fluctuation-dissipation-style identity) plus worked
examples on linear Gaussian networks, rate-coded populations, and two
illustrative non-Gaussian scenarios. This reference does not reproduce those
proofs; the interested reader is directed to the source for depth.

## §3. Connection to W₁ / Ollivier-Ricci — Synthesis Connection 6

Phase 743 synthesis document (connection 6, also referenced as the
M4 ↔ M5 cross-cut) articulates the geometric pairing explicitly:

> M4's Ollivier-Ricci edge curvature is the **discrete W₁** half of the
> optimal-transport framework; M5's Wasserstein-Hebbian free-energy
> gradient flow is the **continuous W₂** half. Both are faces of the same
> optimal-transport framework.

Specifically:

- **Phase 746 Ricci-Curvature Audit** (`src/ricci-curvature-audit/`)
  computes Ollivier-Ricci edge curvature $\kappa(u,v) = 1 - W_1(m_u, m_v) /
  d(u,v)$ on a finite directed skill-DAG. The transport cost is $W_1$
  (Euclidean) and the support is discrete (vertex neighbourhoods).
- **Phase 751 Wasserstein-Hebbian** (this document +
  `src/wasserstein-hebbian/`) operates on the continuous manifold
  $\mathcal{P}_2(\mathbb{R}^d)$. The transport cost is $W_2$ (quadratic)
  and the support is continuous (distributions over real-valued weight
  configurations).

The two primitives are complementary: a GSD operator may simultaneously
surface "which **edges** of the skill-DAG are topological bottlenecks" (W₁)
and "is this candidate **plasticity rule** consistent with a Wasserstein-2
gradient-flow interpretation" (W₂). No coupling between the two audits is
required at module load; both are pure, read-only, and default-off.

## §4. Substrate Applicability to gsd-skill-creator

### §4.1 Relationship to `src/sensoria/` (M6 net-shift receptors)

The sensoria substrate (Lanzara 2023 lineage, Phase 639) models
receptor-weight updates as a net-shift dynamical system. The
Wasserstein-Hebbian framework provides the **geometrically correct**
reinterpretation of those updates: the receptor-weight trajectory, viewed as
a time-indexed family of distributions $\mu_t$, is a candidate for a
Wasserstein-2 gradient flow on $\mathcal{P}_2$ with a net-shift-specific
free-energy functional $\mathcal{F}[\mu]$.

The Phase 751 adapter does **not** rewrite sensoria. It exposes the audit
surface that a downstream operator could use to ask: "does this sensoria
update rule satisfy the shape-and-range constraints that would make a
Wasserstein-2 gradient-flow interpretation plausible?" The answer is
structural (a boolean plus reasons) — never prescriptive.

### §4.2 Relationship to the Bounded-Learning Discipline (Phase 748)

Phase 748's substrate reference carries the 20/3/7 bounded-learning rule
through an `additional-assumptions` outcome: the rule is a consequence of
Peng et al.'s recovery guarantee only under two named calibrations
(Assumption 1 on percentage-to-task-similarity, Assumption 2 on
cooldown-to-buffer-regeneration).

The Wasserstein-Hebbian viewpoint supplies a **complementary constraint**:
the Wasserstein-2 gradient flow requires bounded velocity
$\|\nabla_{W_2} \mathcal{F}\|$, which translates into a flow-rate condition
on the learning-rate parameter $\eta$ analogous to the 20% content-change
cap. The two constraints — operational cap + Wasserstein flow-rate bound —
are not equivalent; they are two defensible families of discipline on the
same update event. Future milestones may calibrate the Wasserstein flow-rate
against the token-diff percentage to sharpen Assumption 1.

### §4.3 Adapter-Stack Audit

Given the optional `src/wasserstein-hebbian/` primitive, a GSD-skill-creator
operator can audit whether a declared plasticity rule is **consistent with
a well-defined Wasserstein-2 gradient flow** at the structural level. The
audit reports:

- `consistent` — rule's learning-rate and regularization parameters lie
  within the stable region (learning rate $\in (0, 1]$, regularization
  $\in [0, 10]$) and the bounded-variance check passes;
- `inconsistent` — one or more parameters out of range; audit enumerates
  reasons;
- `unaudited` — rule shape invalid or the feature flag is off (fail-closed).

The audit is **advisory**. It does not gate sensoria updates. It does not
emit CAPCOM actions. It answers one question — "does the candidate rule
live in the plausible-flow region?" — and returns a structured finding.

## §5. Non-Goals (Explicit)

This substrate reference and its optional adapter primitive **DO NOT**:

- propose replacing the classical Hebbian rule in `src/sensoria/` or any
  existing subsystem;
- mutate sensoria, orchestration, embedding, or Lyapunov internals;
- alter the authority of any CAPCOM gate (G1, G4, G6, G7, G8, or any other);
- claim derivability of the 20/3/7 bounded-learning rule from
  arXiv:2604.16052 — that remains `additional-assumptions` per Phase 748;
- claim the adapter computes the exact Wasserstein gradient flow. It uses
  a closed-form W₂² on Gaussian approximations and a structural range
  check; a fuller integrator is Phase-753+ work;
- claim the reference re-derives Tan's 75-page monograph. It is a
  compressed summary at substrate-reader depth.

The Wasserstein-Hebbian framework is a **principled geometric lens** on
plasticity dynamics. The adapter stack is a **minimum-viable structural
audit** consistent with that lens. Neither replaces any existing subsystem;
both are advisory-only and default-off.

## §6. Cross-References

- **Source paper.** arXiv:2604.16052 Tan 2026, *A Wasserstein Geometric
  Framework for Hebbian Plasticity* (75 pp, bib key `arxiv260416052`).
- **M5 module (Phase 741).**
  [`.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex)
  §`sec:m5-wasserstein` — expanded treatment, forward-handoff to this phase.
- **Synthesis (Phase 743).**
  [`.planning/missions/arxiv-april-17-23-math-foundations/work/synthesis.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/synthesis.tex)
  connection 6 (M4 ↔ M5 optimal-transport pairing).
- **Adjacent substrate references.**
  [`docs/substrate/semantic-channel.md`](../substrate/semantic-channel.md)
  (Phase 747 DACP reference),
  [`docs/substrate-theorems/bounded-learning.md`](../substrate-theorems/bounded-learning.md)
  (Phase 748 bounded-learning reference).
- **Sibling audit primitives.**
  [`src/ricci-curvature-audit/`](../../src/ricci-curvature-audit/)
  (Phase 746, W₁ discrete sibling);
  [`src/hourglass-persistence/`](../../src/hourglass-persistence/)
  (Phase 750, topological sibling);
  [`src/wasserstein-hebbian/`](../../src/wasserstein-hebbian/)
  (Phase 751, this phase).
- **ROADMAP entry.**
  [`.planning/ROADMAP.md`](../../.planning/ROADMAP.md) Phase 751 block
  (W6 T2c, MATH-19).

## §7. Limitations

- **Source compression.** The real arXiv:2604.16052 paper is 75 pp with
  substantial mathematical depth across four theorems, a JKO-style
  variational-framework lineage, and extensive worked examples. This
  reference summarises at substrate-level depth (≈1500 words) oriented
  toward gsd-skill-creator adapter-stack applicability. A reader requiring
  full detail is directed to the source.
- **Section references are approximate.** Where this document cites "§2" or
  "§3" of the source, these are approximate section references — the
  exact theorem and equation numbering is not reproduced verbatim because
  the mission memos do not carry that level of provenance and this
  reference declines to fabricate specifics. A future calibration pass
  could pin exact numbers.
- **Finite-dimensional Gaussian restriction.** The adapter stack's
  `wasserstein-geometry.ts` uses the closed-form W₂² between 1-D Gaussians
  — a finite-dimensional parametric approximation of the
  infinite-dimensional $\mathcal{P}_2(\mathbb{R}^d)$ manifold. The
  restriction is documented in the module JSDoc.
- **Free-energy not numerically evaluated.** The adapter does not evaluate
  $\mathcal{F}[\mu] = \mathbb{E}_\mu[\ell] + \beta H[\mu]$. The structural
  check (shape, parameter-range) is a necessary — but not sufficient —
  condition for a well-posed Wasserstein-2 gradient flow.
- **No gradient-flow stepping.** The adapter does not simulate one step of
  the flow. Simulation is out of scope for a substrate-reference phase;
  Phase 753+ work may add a gradient-flow integrator if a concrete
  downstream consumer materialises.
- **No calibration of the flow-rate ↔ bounded-learning relationship.** §4.2
  notes the complementary constraint structure but does not calibrate the
  Wasserstein flow-rate against the 20% content-change cap. That is an
  empirical question for a future milestone.

---

*Part of the arXiv April 17–23 Math Foundations milestone (v1.49.572). See
[ROADMAP](../../.planning/ROADMAP.md) Phase 751 for the build history and
Phase 741 §`sec:m5-wasserstein` for the theoretical foundation.*
