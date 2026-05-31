---
title: "v1.49.931 — In-branch stochastic selector wire into M4 exploration (CF2a)"
version: v1.49.931
date: 2026-05-31
summary: >
  selectBranchVariant() — a new M4 primitive — becomes the first production
  caller of the M5 selector's inBranchContext:true stochastic path. That path
  was wired at v1.49.927 but, until now, reachable only from unit tests: live
  sessions are blocked by the ME-3 gate, and an M4 branch frame is the only
  sanctioned home for in-branch stochasticity. explore() gains an optional,
  byte-identical-by-default variant-selection step that consumes it.
tags: [branches, M4, stochastic, MA-3, consume-axis, "#10428", selector, ME-3, integration-test]
---

# v1.49.931 — In-branch stochastic selector wire into M4 exploration (CF2a)

**Shipped:** 2026-05-31

One-line: add `src/branches/select-variant.ts` (`selectBranchVariant`) — the first
production consumer of the M5 selector's `inBranchContext: true` stochastic
re-ranking — and consume it from `explore()` as an optional, default-off variant
picker.

## What shipped

- **The M4 primitive** (`src/branches/select-variant.ts`, NEW): `selectBranchVariant()`
  chooses among N candidate branch-skill variants by running a real
  `ActivationSelector` with `inBranchContext: true`, a tractability-scaled
  Boltzmann temperature, and a per-branch seeded `mulberry32(branchSeed)`. It is
  the M4 peer of `fork` / `explore` / `commit` / `abort` / `gc`, exported from the
  barrel. Until this ship, the selector's stochastic promotion
  (`applyStochasticBridge`, v1.49.927) had **no production caller that set
  `inBranchContext: true`** — live activations always pass `false` (the ME-3 gate,
  CF-MA3-03), so the promotion only ever fired in unit tests. An M4 branch frame is
  the sanctioned home for in-branch stochasticity (exploration legitimately wants
  to try a non-argmax variant), so this is a *sound* composition, not a forced one.

- **The in-loop consumer** (`src/branches/explore.ts`): `ExploreOptions` gains an
  optional `variantSelection` field. When supplied, `explore()` chooses which
  variant *body* to run as the branch side via `selectBranchVariant()` and returns
  the selection on `ExploreResult.variantSelection`. When absent, behaviour is
  **byte-identical** to before (read `skill.md` from disk; no selection attached).

- **Reproducibility + safety valves**: a given `(branchSeed, variants, query)`
  selects the same variant every run. The choice collapses to the deterministic
  argmax when the stochastic flag is off, when there is a single variant, or when
  the effective temperature is ~0 — inherited from the bridge, no new branching.

## Verification

- New integration test (`tests/integration/branch-variant-stochastic-wire.integration.test.ts`,
  7 cases) drives a **real** `ActivationSelector`. The load-bearing assertion:
  flag-on produces a **spread** of winners across 40 seeds while flag-off yields a
  **single** winner (the argmax) — this can only pass if `inBranchContext: true`
  reaches the bridge. (Mutation: forcing `inBranchContext:false` collapses the
  spread → test fails.)
- `explore()` with `variantSelection` runs the chosen variant body (proven by a
  branch dir that deliberately has **no** `skill.md`); without it, `skill.md` is
  read and no selection is attached.
- 235 existing branch + selector + stochastic tests pass (no regression).
  `tsc --noEmit` clean.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward
consume-axis work). Manifest **150** (no new lesson — a consume-axis instance,
#10428; the first-production-caller-of-a-dormant-frame-gated-path pattern is noted
for promotion if a second instance appears). Second item of the v929 carry-forward
campaign (CF2a of CF1–CF4).
