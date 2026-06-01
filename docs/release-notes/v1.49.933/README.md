---
title: "v1.49.933 — Sanitize NaN importance: close a silently-wrong-winner bug surfaced by the CF2b audit"
version: v1.49.933
date: 2026-05-31
summary: >
  CF2b set out to verify three preconditions of the MA-3 stochastic selector
  bridge (non-empty scores, finite/non-negative temperature, sorted decisions).
  An adversarial audit confirmed all three are already safe — and the original
  "add type-level guards" plan was wrong (a throw would break the existing
  sanitize-not-throw contract). But the audit's completeness-critic surfaced a
  REAL, separate bug the dimension-lenses missed: a NaN on the public
  Candidate.importance field produced a NaN composite score that defeated the
  desc-by-score ranking sort, silently picking the wrong winner on BOTH the
  deterministic and stochastic paths. This ship fixes it at the single clamp
  site (importanceScore: NaN -> 0) and documents the verified bridge contract.
tags: [bugfix, cf2b, scorer, selector, stochastic, audit, m5, "#10438"]
---

# v1.49.933 — Sanitize NaN importance: close a silently-wrong-winner bug

**Shipped:** 2026-05-31

One-line: CF2b's three stochastic-bridge preconditions are verified already-safe,
and the audit that proved it surfaced a real `NaN`-importance bug that silently
selected the wrong candidate — fixed here at the source.

## What CF2b set out to do

The v929 carry-forward 2(b) was a **verify-axis** task: promote three suspected
preconditions of the MA-3/MD-2 stochastic selector bridge to enforced guarantees —
the sampler's non-empty-scores requirement, finite/non-negative temperature, and
sorted decisions. The original framing assumed these needed new type-level guards.

## The audit (audit-first)

Rather than assume, an adversarial audit stress-tested the "already-safe"
hypothesis: four independent lenses (temperature pathologies, score/decision
pathologies, sort/RNG pathologies, the original-plan-was-wrong question), skeptic
refutation of every flagged finding, and a completeness-critic tasked with the
opposite job — hunting for a load-bearing precondition the lenses *cleared*. Every
conclusion was confirmed with throwaway runtime probes against the real modules.

**Verdict on the three named preconditions — all verified already-safe:**

- **Non-empty scores** is triple-guarded (`selectBranchVariant` throws on empty
  variants; the bridge short-circuits on empty decisions; `sampleByScore` throws a
  `RangeError` that no realistic caller can reach).
- **Temperature** is absorbed, never thrown: `≤ 0` and `−Inf` hit the T=0 valve;
  `NaN`/`+Inf` bypass the valve but are caught downstream by softmax's `Z`-guard
  (→ deterministic argmax) or its `T→∞` branch (→ uniform).
- **Sorted decisions**: `select()` sorts unconditionally before the bridge, and
  sampling is over score *values*, not positions.

The original "add guards" plan was therefore **unsound** — a throw-on-NaN guard
would break `softmax.test.ts`'s intentional sanitize-not-throw contract on NaN/Inf
scores. CF2b's preconditions need **no new guards**.

## The bug the audit surfaced

The completeness-critic (and an independent re-confirmation) found a defect the
"sorted decisions" precondition was hiding. `BranchVariant.importance` /
`Candidate.importance` is a **public, documented `[0,1]` field, completely
unvalidated**. A `NaN` flows through `gamma: cand.importance ?? 0` (`??` does not
catch `NaN`) into `importanceScore`, where `Math.max(0, Math.min(1, NaN))` is
itself **`NaN`** — the clamp bounds the range but not `NaN`. That `NaN` becomes the
composite ranking score and **defeats the desc-by-score sort comparator**
(`b.score − a.score` is `NaN`), leaving the poisoned entry mis-seated at position 0.
Softmax only sanitises `NaN`→0 in *probability* space, after the sort already
mis-seated it; the flag-off / branch-off / T=0 paths return the list unchanged.
Result: a **silently-wrong winner, no throw**, on *both* the deterministic
`ActivationSelector.select()` path and the MA-3 stochastic bridge. It is really an
M5 scorer defect that CF2b merely surfaced.

Runtime-confirmed: with a `NaN`-importance variant present, the deterministic path
chose it 5/5 over the true argmax; the same inputs with a finite importance chose
correctly.

## What shipped

- **The fix** (`src/memory/scorer.ts`, `importanceScore`): coerce a `NaN` gamma to
  `0` (no boost) at the single existing clamp site, so it can never propagate into
  the ranking score. `±Infinity` still clamps to the `[0,1]` bounds — only `NaN`
  needed the explicit guard. One line, fixing both selection paths at the source.

- **Unit test** (`src/memory/__tests__/m2-scorer.test.ts`): `NaN` gamma → 0,
  `±Inf` still clamp, and `scoreEntry` stays finite under a `NaN` gamma.

- **End-to-end regression** (`tests/integration/branch-variant-stochastic-wire.integration.test.ts`):
  a `NaN`-importance variant must not win — the true argmax wins on the
  deterministic path, every decision score is finite, and the stochastic path
  stays clean. Load-bearing: pre-fix this returned the poisoned variant.

- **Doc note** (`src/stochastic/selector-bridge.ts`): records the CF2b-verified
  precondition / absorb-to-deterministic contract (decisions must be pre-sorted
  with finite scores; non-finite temperature is absorbed, never thrown — no
  temperature guard added by design).

## Verification

- `tsc` (`npm run build`) — exit 0.
- `m2-scorer` 21/21 · `branch-variant` integration 8/8 · stochastic + memory
  549/549 · orchestration + branches 145/145.
- Probe re-run: the deterministic path now picks the true argmax; the stochastic
  path is clean (all scores finite).

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — a forward
bug fix). Manifest **150** (no new lesson — a #10438 verify-axis instance; the
"completeness-critic catches what dimension-lenses clear" observation is carried
forward as a candidate, see lessons). Fourth shipped item of the v929 carry-forward
campaign (CF2b); the audit closed CF2b's stated scope (preconditions verified safe)
and the fix closes the defect that scope surfaced.
