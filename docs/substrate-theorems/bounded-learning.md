# Bounded Learning Theorem — Substrate Reference

<!-- THEOREM-OUTCOME: additional-assumptions -->
<!-- Phase: 0748-w5-t1d-bounded-learning-theorem-reference -->
<!-- Milestone: v1.49.572 arXiv April 17-23 Math Foundations -->
<!-- Source artifact: .planning/missions/arxiv-april-17-23-math-foundations/work/m5-bounded-learning-theorem.tex -->
<!-- Requirement: MATH-16 -->

**Status:** canonical substrate documentation
**Implements:** MATH-16 (Phase 748)
**Theorem outcome:** `additional-assumptions` — carried forward from Phase 741
MATH-06 theorem attempt (see
[`.planning/missions/arxiv-april-17-23-math-foundations/work/m5-bounded-learning-theorem.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/m5-bounded-learning-theorem.tex)
line 1 `% THEOREM-OUTCOME: additional-assumptions`).
**Cross-references:** CAPCOM gate design decisions from Phase 738 Module M2
`tab:coord-capcom` mapping table.

---

## 1. The Discipline

The gsd-skill-creator **bounded-learning discipline** imposes three numerical
constraints on every update to a learned pattern held in the skill substrate
(a `.claude/skills/…` file, an agent spec, a chipset descriptor, or any other
record produced by the six-step Observe → Detect → Suggest → Manage →
Auto-Load → Learn/Compose loop):

1. **20% content-change cap per update.** A single update must not alter more
   than 20% of the pattern's canonical-serialised content, measured by
   token-diff ratio. Larger updates are rejected and must be split across
   multiple updates, each independently subject to the same cap.
2. **3-correction minimum per commit.** Before a learned pattern is committed
   to the persistent substrate, it must accumulate at least three independent
   corrective signals on the MA-6 reinforcement-channel taxonomy. Patterns
   with fewer than three corrections are held in a candidate state and are
   not persisted.
3. **7-day cooldown per pattern.** After a pattern is committed, further
   updates to the same pattern are suppressed for a seven-day window. Updates
   arriving during the cooldown are queued and merged into the first
   post-cooldown commit.

These are **operational rules**. They are not, in the strict mathematical
sense, a theorem. This document states, for a substrate-level reader, what
would need to be true for the 20/3/7 rule to follow from a named recovery
guarantee, and it reports the Phase 741 MATH-06 resolution of that question.

## 2. The Reference Result — arXiv:2604.17578

Peng, Tadipatri, Xu, Eaton, and Vidal (UPenn, April 21, 2026, bib key
`peng2026continual`) prove a continual-learning recovery guarantee of the
following shape. A learner faces a sequence of tasks `T₁, T₂, …, Tₖ`; for
each task, the learner maintains a memory buffer `M` of prior-task examples
and applies a regularization term `R(θ; M, w)` depending on model parameters
`θ`, the buffer, and a vector of data-dependent weights `w` attached to
stored examples.

Under the four hypotheses

- **H1** task-similarity matrix `S` bounded: `‖S‖ ≤ ρ` for a precise ρ;
- **H2** shared-representation subspace available across the task sequence;
- **H3** memory buffer of sufficient size: `|M| ≥ m*`;
- **H4** data-dependent regularization weights `w` chosen according to a
  task-aware procedure,

Peng et al. show the post-training loss on any prior task `Tᵢ` satisfies

```
loss_{T_i}(θ_k) ≤ P(S, |M|, w),
```

where `P` is a polynomial in the task-similarity norms, memory buffer size,
and regularization magnitudes. This is the "recovery guarantee" that Module
M5 (Phase 741,
[`work/modules/module_5.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex)
§`sec:m5-continual`) identifies as the reference point for the 20/3/7 rule.
The key feature is that `P` is quantitative: given the hypotheses, a concrete
polynomial bound is available.

## 3. The Attempt — Outcome: `additional-assumptions`

Phase 741 MATH-06 evaluated whether the 20/3/7 rule is a **consequence** of
Peng et al.'s recovery guarantee. The resolution, recorded as the sole
machine-readable flag on line 1 of `m5-bounded-learning-theorem.tex`, is

> `% THEOREM-OUTCOME: additional-assumptions`

This substrate reference carries that outcome forward unchanged. A
proof-sketch is premature because the operational-parameter → hypothesis
mapping has not been calibrated; a counterexample is too strong because no
concrete obstruction has been exhibited. The honest mathematical posture is
that the 20/3/7 rule follows from Peng et al.'s recovery guarantee **only
under two named additional assumptions**.

### 3.1 Assumption 1 — Calibration of Percentage

**Statement.** There exists a calibration function `ρ: [0, 100%] → [0, ∞)`,
monotone non-decreasing, such that an update `U` with content-change
percentage `π(U) ≤ 20%` implies the pre-update and post-update patterns have
task-similarity norm `‖S‖ ≤ ρ(π(U))`, bounded in the sense required by **H1**.
Moreover, `ρ(20%)` is less than the threshold at which Peng et al.'s
polynomial bound `P` becomes vacuous.

**Status.** Plausible, not proved. Token-diff percentage is a crude proxy for
representational distance, and empirically small token-diffs yield small
representational drift, but the calibration `ρ` has not been derived from
first principles. It is an empirical question.

### 3.2 Assumption 2 — Calibration of Cooldown

**Statement.** There exists a cooldown period `τ* > 0`, possibly depending on
update rate, underlying task distribution, and memory-buffer regeneration
mechanism, such that: if two consecutive updates `Uⱼ, Uⱼ₊₁` to the same
pattern are separated by time `τ ≥ τ*`, then the memory buffer `M` and
data-dependent weights `w` available at `Uⱼ₊₁` satisfy **H3** and **H4**.
Moreover, `τ* ≤ 7 days`.

**Status.** Plausible, not proved. The 7-day window is long enough in
practice for the MA-6 reinforcement emitters to repopulate the buffer with
corrective signals and for the data-dependent weights to be recomputed, but
the claim `τ* ≤ 7 days` is an empirical calibration.

### 3.3 What the 3-Correction Minimum Is

The 3-correction minimum sits **between** the two calibrations. It is not a
mathematical consequence of Peng et al. — it is a discipline that raises the
correction-signal-to-noise ratio before **H4** (data-dependent weights
chosen by a task-aware procedure) can matter at all. Without at least three
independent corrective signals, the data-dependent weight vector `w` is
dominated by single-observation noise and the hypothesis **H4** is
operationally vacuous.

### 3.4 Conditional Proof-Sketch Pattern

Conditional on Assumptions 1 and 2, a proof-sketch of the bounded-learning
claim as a consequence of Peng et al. proceeds:

1. For each update `Uⱼ`, Assumption 1 certifies **H1** (task-similarity norm
   is bounded).
2. The 3-correction minimum plus the MA-6 emitter buffer structure certifies
   **H3** (`|M| ≥ m*` for patterns with sufficient usage).
3. Assumption 2 certifies **H4** (7-day cooldown allows the weight
   recomputation to match Peng's task-aware procedure).
4. **H2** (shared-representation subspace) is inherited from the
   gsd-skill-creator skill-DAG structure: Phase 740 Module M4 Ollivier-Ricci
   analysis already identifies the shared subspace of the DAG.
5. Under (1)–(4), Peng et al.'s Theorem applies and yields the polynomial
   bound `P`. This is exactly the 20/3/7 bounded-learning claim.

The sketch is **conditional**. Without Assumption 1 and Assumption 2, it does
not close — and the outcome `additional-assumptions` reflects precisely that.

## 4. Substrate Implications

### 4.1 Where the Calibrations Could Be Measured

The calibration functions `ρ` and `τ*` are empirical questions. A future
measurement apparatus — prospectively `src/bounded-learning/calibration/` —
could estimate them from the historical update log of the skill-DAG:

- For `ρ`: sweep over `π(U)` ∈ {5%, 10%, 20%, 30%} and measure the pre/post
  task-similarity norm of the updated pattern against its prior evaluation
  set. Fit a monotone non-decreasing function.
- For `τ*`: sweep over `τ` ∈ {1d, 3d, 7d, 14d, 30d} and measure whether the
  buffer `M` and weights `w` at update time match the task-aware procedure
  required by **H4**. The smallest `τ` for which that match holds with a
  confidence floor is a candidate `τ*`.

Neither measurement is required for v1.49.572. Both are plausible candidates
for a post-milestone empirical-calibration phase.

### 4.2 What Happens When Calibrations Are Violated

If an operational 20/3/7 rule is applied outside the region where
Assumption 1 and Assumption 2 hold — for example, on a radically novel task
distribution where token-diff percentage does not proxy representational
distance — the discipline still runs but **Peng et al.'s bound no longer
certifies recovery**. The failure mode is **operational degradation**, not
catastrophic forgetting: regression on earlier pattern uses may exceed the
polynomial bound `P`, but the discipline itself does not break.

This matters for the substrate: the 20/3/7 rule is a **defensible default**,
not a guarantee. Operators who observe degradation have license to revise
the numbers — conservative directions (tighter caps, more corrections,
longer cooldowns) trade throughput for more aggressive containment of the
calibration gap; permissive directions reverse the trade.

### 4.3 Integration with the Phase 747 Semantic-Channel Drift Checker

The Phase 747 drift checker
([`src/semantic-channel/drift-checker.ts`](../../src/semantic-channel/drift-checker.ts),
documented in [`docs/substrate/semantic-channel.md`](../substrate/semantic-channel.md))
already computes per-component content drift and per-component fidelity-tier
weakening for DACP bundles at handoff boundaries. A bounded-learning
integration, when future milestones choose to build it, would wire the
drift checker's `weakened: true` finding and its `contentDrift ≥ 0.25`
threshold into the observation layer of the skill-update pipeline, allowing
the runtime to flag candidate skill updates that sit at or outside the
Assumption 1 validity region.

Explicit non-coupling: the drift checker is **advisory-only** per Phase 747
§6. A bounded-learning layer that consumes its findings must also be
advisory-only — it may annotate a candidate update with a drift-risk
indicator, but it may not gate, block, or rewrite the update. The gate
authority sits with CAPCOM, as described in §5.

## 5. CAPCOM-Gate Cross-References

The bounded-learning discipline **does NOT replace, bypass, or weaken any
CAPCOM gate**. It is a complementary substrate constraint — operational
discipline, not gate authority. The specific CAPCOM elements this document
acknowledges and leaves intact are:

- **CAPCOM Gate G1 (Wave 1A close, phase-scheduled-reduction invariant).**
  Per Phase 738 Module M2 `tab:coord-capcom` row 2 (Phase-Scheduled MAS,
  `dubey2026phasemas`), Gate G1 enforces the wave barrier with a per-wave
  token budget and a handoff condition. Bounded-learning 20/3/7 rules
  operate **inside** a wave — they do not set the wave barrier's token
  budget or decide whether the wave closes. Gate G1 retains authority over
  wave-boundary invariants.
- **CAPCOM Gate G4 / Safety Warden BLOCK (round-robin consensus-trap
  invariant).** Per Phase 738 `tab:coord-capcom` row 4 (Consensus Trap,
  `arxiv260417139`), the Safety Warden gate enforces per-invariant pass/fail
  rather than unanimous-vote agreement. Bounded-learning 20/3/7 rules never
  participate in a vote and never flag-down a pattern that a Safety Warden
  invariant has already accepted; the discipline is a candidate-state
  discipline, and CAPCOM's Safety Warden remains authoritative.
- **CAPCOM Gate G6 (T1a hard preservation, coherent-functor primitives).**
  Per Phase 745 T1a closing invariant, `src/coherent-functors/` surface is
  byte-identical under flag-off. Bounded-learning rules never modify that
  surface — they operate on the skill substrate, not on the categorical
  primitives the skill substrate composes over.
- **CAPCOM Gate G7 (T1c hard preservation, DACP wire format).** Per Phase
  747 T1c closing invariant, the DACP wire format and `DACP_VERSION` are
  untouched. Bounded-learning rules observe DACP bundles (via the
  semantic-channel drift checker, when that integration is built) but never
  modify the bundle format, `src/dacp/types.ts`, `src/dacp/bundle.ts`, or
  any serialisation constant.

**Non-collapse invariant.** Nothing in the 20/3/7 discipline — not the cap,
not the correction minimum, not the cooldown — is proposed as a substitute
for, or an override of, any CAPCOM gate. A reader should not be able to
interpret this document as a proposal to alter gate authority. If a future
milestone discovers that bounded-learning findings would be strengthened by
CAPCOM-layer enforcement, that would be a separate proposal, routed through
the standard CAPCOM amendment path, and is explicitly **out of scope here**.

## 6. Non-Goals (Explicit)

This substrate reference does **NOT**:

- alter the authority of any CAPCOM gate (G1, G4, G6, G7, G8, or any other);
- replace, weaken, or bypass the Safety Warden BLOCK discipline;
- collapse the 20/3/7 numerical parameters into a single learned knob (that
  is the separate Phase 730 single-λ audit question, if-budget);
- prescribe automatic runtime enforcement — enforcement remains operational,
  discretionary, and auditable;
- close the calibration question. Assumptions 1 and 2 remain empirical.

The 20/3/7 numbers are **operational floors** in the conservative direction:
tighter caps and longer cooldowns are always safe under the outcome
`additional-assumptions`. Permissive relaxations require calibration
evidence.

## 7. Optional Machine-Checked Skeleton — Deferred

Phase 748's ROADMAP block marks the machine-checked Lean 4 / Rocq skeleton
at `src/bounded-learning-theorem/` as **OPTIONAL**. This phase **defers**
the skeleton, for three reasons:

1. **Token budget.** Phase 748 is allocated ~15k tokens for a primarily
   documentation deliverable. Implementing a Lean 4 skeleton with ≥5 passing
   tests would substantially exceed that allocation.
2. **PCWP-M1 pattern permits staged delivery.** The Proof-Companion Workflow
   Pattern (Figure~\ref{fig:pcwp-m1} in Phase 737 `module_1.tex`) specifies
   six sequential steps: (1) informal claim formalization, (2) proof-assistant
   selection, (3) LLM-assisted drafting, (4) machine-checked verification,
   (5) claim-to-code traceability, (6) recovery from proof failures. Steps
   1 and 2 are executed by this markdown reference; steps 3–6 can be
   deferred to a future milestone without violating the pattern.
3. **No downstream dependency on a formal skeleton.** Phase 753 (W8
   Integration) requires that `docs/substrate-theorems/` carry the bounded-
   learning reference, not that a Lean 4 proof-object exist.

**Future-implementation sketch.** When a future milestone carries Lean 4
tooling in-tree (for example, a `coprocessors/lean/` chipset analogous to
the `coprocessors/math/` Python GPU chipset), the `src/bounded-learning-
theorem/` module would instantiate PCWP-M1 as follows:

1. **Step 1 — Informal claim formalization.** Translate Assumption 1
   (`∃ρ: π(U) ≤ 0.20 ⇒ ‖S‖ ≤ ρ(π(U))`), Assumption 2 (`∃τ*: τ ≥ τ* ⇒
   H3 ∧ H4, τ* ≤ 7 days`), and the conditional claim (Assumptions 1, 2
   together with H2 imply the Peng et al. bound `P`) into Lean 4 `structure`
   / `theorem` declarations.
2. **Step 2 — Proof assistant selection.** Lean 4 preferred for
   decidability friendliness on `ℝ` predicates; Rocq fallback for deeper
   dependent-type manipulations if the representation-subspace H2 requires
   them.
3. **Step 3 — LLM-assisted proof drafting.** Draft the conditional proof
   (Assumptions 1, 2, 3-correction minimum, H2 ⇒ Peng-bound) via the
   LLM-drafting loop described in `module_1.tex` §`sec:m1-patent`.
4. **Step 4 — Machine-checked verification.** Lean 4 kernel check; the
   resulting `.olean` artifact lives at
   `src/bounded-learning-theorem/BoundedLearning.lean`.
5. **Step 5 — Claim-to-code traceability.** Map the 20/3/7 operational
   values to the formalized predicates; document the mapping in a
   `docs/bounded-learning-theorem-traceability.md` companion.
6. **Step 6 — Recovery from proof failures.** If the machine-checked
   verification uncovers a gap in the conditional proof, update Assumption
   1 / Assumption 2 statements accordingly (possibly via a stronger
   `additional-assumptions` revision) rather than widening the operational
   20/3/7 parameters.

The deferral is explicit, scoped, and reversible. No code changes are made
under `src/bounded-learning-theorem/` in Phase 748.

## 8. GAP-6-adjacent Closure Note

Phase 747 closed substrate-audit **GAP-6** (DACP Not Publicly Documented) by
shipping [`docs/substrate/semantic-channel.md`](../substrate/semantic-channel.md)
plus the read-only adapter and advisory drift checker at
`src/semantic-channel/`. Phase 748 closes the adjacent gap — call it
**GAP-6′** for local reference — about bounded-learning-rule provenance: the
20/3/7 numbers are operational calibrations, not theorem consequences; their
substrate relationship to arXiv:2604.17578 is `additional-assumptions` per
the Phase 741 MATH-06 resolution; and the calibrations `ρ` and `τ*` remain
empirical questions that future milestones may choose to measure.

A reader who arrives at this document asking "why 20%, why 3, why 7 days"
should leave with the following answer: the numbers are defensible
operational defaults, not proved consequences of Peng et al.; they are safe
in the conservative direction; their tighter justification is empirical and
open; and they operate **entirely inside** the CAPCOM gate perimeter
described in §5, never over it.

## References

- **Peng et al. 2026** — *Continual Learning Recovery Guarantees under
  Task-Similarity and Data-Dependent Regularization*, arXiv:2604.17578,
  bib key `peng2026continual`.
- **Phase 741 theorem attempt** —
  [`.planning/missions/arxiv-april-17-23-math-foundations/work/m5-bounded-learning-theorem.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/m5-bounded-learning-theorem.tex)
  (outcome flag `additional-assumptions` on line 1).
- **Phase 741 M5 module** —
  [`.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex)
  §`sec:m5-continual`.
- **Phase 737 M1 module (PCWP-M1 pattern)** —
  [`.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_1.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_1.tex)
  Figure `fig:pcwp-m1`.
- **Phase 738 M2 module (coord-capcom mapping)** —
  [`.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_2.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_2.tex)
  §`sec:m2-capcom`, Table `tab:coord-capcom`.
- **Phase 743 synthesis** — through-line connection 1 (M1 PCWP-M1 ↔ M5
  theorem-attempt) at
  [`.planning/missions/arxiv-april-17-23-math-foundations/work/synthesis.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/synthesis.tex).
- **Phase 747 semantic-channel precedent** —
  [`docs/substrate/semantic-channel.md`](../substrate/semantic-channel.md).
- **ROADMAP** — [`.planning/ROADMAP.md`](../../.planning/ROADMAP.md) Phase
  748 block (W5 T1d, MATH-16) and Gate G8 (T2a Koopman-Memory, downstream).

---

*Part of the arXiv April 17–23 Math Foundations milestone (v1.49.572). See
[ROADMAP](../../.planning/ROADMAP.md) Phase 748 for the build history and
Phase 741 for the carrier theorem attempt.*
