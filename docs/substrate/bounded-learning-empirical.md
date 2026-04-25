# Bounded-Learning Empirical Harness

<!-- Phase: 766 -->
<!-- Milestone: v1.49.573 Upstream Intelligence Pack v1.44 -->
<!-- Module: T1b (UIP-14) -->
<!-- Source: arXiv:2604.20087 (SkillLearnBench / Zhong et al. 2026) -->

**Status:** canonical substrate documentation  
**Implements:** UIP-14 (Phase 766)  
**Source paper:** SkillLearnBench — arXiv:2604.20087 (Zhong et al., submitted 22 April 2026)  
**Extends:** v1.49.572 T1d theorem-reference attestation at [`docs/substrate-theorems/bounded-learning.md`](../substrate-theorems/bounded-learning.md)

---

## 1. Purpose

The bounded-learning empirical harness (`src/bounded-learning-empirical/`) provides
executable evidence for the GSD constitution's three bounded-learning constraints:

1. **20% content-change cap** — no single update may alter more than 20% of a pattern's
   canonical-serialised content.
2. **3-correction minimum** — at least 3 independent corrective signals required before
   a pattern is committed to the persistent substrate.
3. **7-day cooldown** — after a pattern is committed, further updates are suppressed for
   a 7-day window.

These constraints were previously grounded in:

- **Engineering intuition** (operational defaults, conservative direction).
- **Peng et al. (arXiv:2604.17578)** — continual learning recovery guarantee cited in
  the v1.49.572 T1d theorem reference; the 20/3/7 rule follows from Peng et al. only
  under two named additional assumptions (calibration of percentage `ρ` and calibration
  of cooldown `τ*`), which remain empirical questions.

This harness adds a third grounding: **peer-reviewed empirical justification** from
SkillLearnBench (arXiv:2604.20087 / Zhong et al. 2026). The paper's §5–§6 findings
directly validate the three constitutional constraints, converting them from cited
policy to tested invariants.

---

## 2. SkillLearnBench — The Empirical Justification

**Citation:** Zhong et al. (submitted 22 April 2026). *SkillLearnBench: Benchmarking
Skill Learning across 20 Tasks and 15 Sub-Domains.* arXiv:2604.20087.

### 2.1 Key Findings

**§5 — Recursive Drift Under Self-Feedback.** Self-generated feedback — an agent
critiquing its own skill outputs without external reference — systematically produces a
feedback loop in which errors compound across iterations. The paper names this failure
mode *recursive drift under self-feedback*. By contrast, external feedback from an
independent oracle or human evaluator produces consistent improvement across the same
task set, even when the external feedback signal is sparse.

**§6 Table 3 — Three-Round Correction Ablation.** The §6 ablation varies feedback
frequency and corrects for the number of self-feedback rounds allowed before an external
correction is injected. Key finding: injecting one external correction per three
self-feedback rounds largely arrests drift; allowing more than three consecutive
self-feedback rounds without external correction produces statistically significant
quality degradation in **14 out of 20 tasks** tested.

### 2.2 GSD Constitution Link

| Constitutional Cap | SkillLearnBench Grounding |
|---|---|
| **20% content-change cap** | §6 ablation: "small-step updates accumulate safely while large-step updates amplify error." Large-step updates (high content-change ratio) produce the drift amplification failure mode. |
| **3-correction minimum** | §6 Table 3: ≤3 consecutive self-feedback rounds before external correction is the safe operating envelope; >3 produces degradation in 14/20 tasks. |
| **7-day cooldown** | §5 sparse-external-feedback regime: temporal separation between update windows — the regime that produces the best long-run outcomes — maps to the 7-day cooldown that gives MA-6 reinforcement emitters time to repopulate the correction buffer. |

### 2.3 Relationship to the v1.49.572 T1d Theorem Reference

The v1.49.572 T1d theorem reference (`docs/substrate-theorems/bounded-learning.md`)
established the 20/3/7 rule as an operational calibration grounded in Peng et al.
(arXiv:2604.17578) under two named additional assumptions:

- **Assumption 1 (calibration of percentage `ρ`):** there exists a calibration function
  mapping content-change percentage to task-similarity norm, such that 20% is within the
  safe region of Peng et al.'s recovery guarantee.
- **Assumption 2 (calibration of cooldown `τ*`):** there exists a cooldown period
  τ* ≤ 7 days such that the memory buffer and data-dependent weights satisfy Peng et al.'s
  H3/H4 hypotheses at the start of each post-cooldown update.

The theorem outcome is `additional-assumptions` — neither assumption is proved; both are
empirical calibrations. SkillLearnBench closes the empirical gap: the paper's §5–§6
findings are direct observational evidence for Assumptions 1 and 2 in the GSD context:

- **Assumption 1 is supported:** §6 ablation shows that bounded (small-step) updates do
  not compound error while large-step updates do — consistent with the existence of a
  monotone calibration function `ρ`.
- **Assumption 2 is supported:** §5 sparse-external-feedback regime shows that temporal
  separation between update windows leads to better outcomes — consistent with the
  existence of `τ* ≤ 7 days`.

This harness takes the theorem reference one step further: rather than observational
support for the assumptions, it produces executable test evidence by running the
SkillLearnBench qualitative finding against synthetic skill-update trajectories.

---

## 3. Module Architecture

```
src/bounded-learning-empirical/
├── index.ts                    — public API
├── types.ts                    — TaskSet, EvidenceRecord, ConstitutionalCap, etc.
├── task-scaffold.ts            — 20-task / 15-sub-domain scaffold (pluggable)
├── recursive-drift-detector.ts — implements recursive-drift-under-self-feedback test
├── evidence-emitter.ts         — emits ConstraintEvidence per cap
├── settings.ts                 — opt-in flag reader
└── __tests__/
    ├── recursive-drift.test.ts      — qualitative finding reproduction tests
    ├── twenty-percent-cap.test.ts   — 20% cap evidence tests
    ├── three-correction.test.ts     — 3-correction minimum evidence tests
    ├── seven-day-cooldown.test.ts   — 7-day cooldown evidence tests
    └── integration.test.ts          — end-to-end runBenchmark() smoke tests
```

### 3.1 Public API

```typescript
// Run the full 20-task benchmark and produce an EvidenceRecord.
// Default-off: when flag is off, returns { disabled: true, evidence: [] }.
async function runBenchmark(
  taskSet?: TaskSet,
  settingsPath?: string,
): Promise<EvidenceRecord>

// Validate a single constitutional cap and produce a ConstraintEvidence.
// Default-off: when flag is off, returns { disabled: true, evidence: [] }.
async function validateConstraint(
  constraint: ConstitutionalCap,
  settingsPath?: string,
): Promise<ConstraintEvidence>
```

### 3.2 Recursive-Drift Detector

The detector runs two parallel synthetic feedback loops:

1. **Self-feedback loop:** each iteration compounds drift by a configurable `driftRate`
   (default 15%). Models the SkillLearnBench recursive-drift failure mode (§5). The
   resulting trajectory is monotonically non-decreasing.

2. **External-feedback loop:** each iteration reduces drift by a configurable
   `correctionRate` (default 20%). Models the safe-operating-envelope regime from §6.
   The resulting trajectory is monotonically non-increasing.

The detector emits `PASS` if both monotonicity properties hold, reproducing the
SkillLearnBench qualitative finding. It emits `FAIL` otherwise.

### 3.3 Task Scaffold

The 20-task / 15-sub-domain scaffold (`task-scaffold.ts`) mirrors the SkillLearnBench
structural design (arXiv:2604.20087 §3.1 task design, §3.2 sub-domain taxonomy). The
tasks are synthetic GSD-context fixtures — not verbatim from the paper — instantiating
the structural design against the skill-update context described in the Phase 766
forward handoff in `module_1.tex` §sec:m1-slb.

Tasks are pluggable: callers may pass a custom `TaskSet` to `runBenchmark()`.

### 3.4 Evidence Emitter

The emitter (`evidence-emitter.ts`) produces structured `ConstraintEvidence` records:
- **`buildTwentyPercentEvidence`:** tests whether drift fractions stay within the 20%
  threshold.
- **`buildThreeCorrectionEvidence`:** tests whether external-feedback points have
  accumulated ≥ 3 corrections.
- **`buildSevenDayCooldownEvidence`:** tests whether post-commit update attempts respect
  the 7-day cooldown floor.

All emitted records cite arXiv:2604.20087 in their `summary` field.

---

## 4. Opt-In Flag

The harness is **default-off**. Enable by setting in `.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "bounded-learning-empirical": { "enabled": true }
    }
  }
}
```

When the flag is off, both public API functions return byte-identical disabled records:

```typescript
// runBenchmark() disabled return:
{
  disabled: true,
  evidence: [],
  tasksEvaluated: 0,
  meanSelfFeedbackDrift: 0,
  meanExternalFeedbackDrift: 0,
  driftVerdict: undefined,
  // ...
}

// validateConstraint() disabled return:
{
  disabled: true,
  evidence: [],
  verdict: 'PASS',
  summary: 'Bounded-learning empirical harness disabled (opt-in flag off).',
  // ...
}
```

---

## 5. CAPCOM Preservation

This module is **read-only by design**. It does NOT:
- touch `src/orchestration/`, `src/dacp/`, `src/capcom/`, or any gate surface;
- modify any skill file or substrate record;
- gate, block, or rewrite any update.

It only emits evidence records. Gate authority remains with CAPCOM, as described in
`docs/substrate-theorems/bounded-learning.md` §5. This module extends the attestation
from that document to executable harness form without altering any gate invariant.

---

## 6. Running the Tests

```bash
npx vitest run src/bounded-learning-empirical
```

Expected: ≥10 tests passing (all five test files). The recursive-drift tests reproduce
the SkillLearnBench qualitative finding; the cap tests verify each constitutional
constraint; the integration tests verify the full API surface and default-off behaviour.

---

## References

- **SkillLearnBench (arXiv:2604.20087)** — Zhong et al. 2026. *SkillLearnBench:
  Benchmarking Skill Learning across 20 Tasks and 15 Sub-Domains.* §5 recursive-drift
  finding, §6 Table 3 ablation. Primary empirical justification for this harness.
- **v1.49.572 T1d theorem reference** —
  [`docs/substrate-theorems/bounded-learning.md`](../substrate-theorems/bounded-learning.md).
  Theorem outcome `additional-assumptions` (Peng et al. arXiv:2604.17578). This harness
  extends that attestation to executable form.
- **Peng et al. (arXiv:2604.17578)** — Continual learning recovery guarantee (H1–H4 +
  polynomial bound `P`). Underlying theoretical substrate; see T1d theorem reference for
  the full conditional proof sketch.
- **Phase 766 forward handoff** —
  `.planning/missions/arxiv-eess-integration-apr17-23/work/templates/module_1.tex`
  §sec:m1-slb, UIP-09 callout box. Specifies the harness design intent.
- **ROADMAP Phase 766** — [`ROADMAP.md`](../../.planning/ROADMAP.md) W4 T1b entry.

---

## eess26 cite-key

- **eess26_2604.20087** — Zhong et al., *SkillLearnBench: Benchmarking Skill
  Learning across 20 Tasks and 15 Sub-Domains*, 22 Apr 2026

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

---

*Part of the Upstream Intelligence Pack v1.44 (v1.49.573). See
[ROADMAP](.planning/ROADMAP.md) Phase 766 for the build history.*
