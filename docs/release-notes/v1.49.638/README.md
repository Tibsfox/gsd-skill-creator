# v1.49.638 — Housekeeping Cluster #5

**Released:** 2026-05-11 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.637 (Housekeeping Cluster #4)
**Mission package:** `.planning/missions/v1-49-638-housekeeping-cluster-5/`
**Source vision:** v1.49.637 close handoff (1 named architectural carry-forward + STORY-gate ordering ambiguity + substrate-probe doc rebase + new flake-audit pre-emption)
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

v1.49.638 is the **sixth counter-cadence cleanup milestone** in
the engine (preceded by v1.49.585 / .634 / .635 / .636 / .637).
It absorbs the v1.49.637 ship-complete handoff by **closing 5 of
6 planned components + 1 explicit deferral to Cluster #6**:

- **C1 — Atlas LRU per-project API.** Closes v1.49.637 CL5-CF-1
  (atlas LRU promote-vs-batch-load architectural finding). New
  `get_or_open_for_project` method on the atlas at
  `src-tauri/src/atlas.rs`; LRU isolation invariant verified via
  3 new Rust tests. Operator chose option (a) per-project API
  over recommended (b) test rewrite for scoped-Tauri-commands
  roadmap context. Commits `7a9a2c5cb` + `b78097bb9`.

- **C2 — STORY-gate ordering.** New canonical
  `docs/T14-SHIP-SEQUENCE.md` authored as authoritative T14
  sequence reference. STORY append moved from pre-tag-gate step
  10 (where it was misplaced) to T14 post-tag-push position via
  documented sequence. New invariant test
  `tests/integration/c2-story-gate-ordering.test.ts`.
  `scripts/pre-tag-gate.sh` step-10 removed (now 9 steps).
  v1.49.637 meta-test C4 assertions inverted via W1A.T3 to
  match. Operator chose option (i) doc+invariant per
  recommendation. Commits `961e36943` + `a5ad270fb` + `04dbfdc7c`
  + `1e9d64dfc`.

- **C3 — Substrate-probe discipline codification.** New
  canonical `docs/SUBSTRATE-PROBE-DISCIPLINE.md` (relocated from
  gitignored `.planning/test-discipline/` for tracked
  codification). Codifies v1.49.637 Lesson #10192 plus the new
  runtime-environment-substrate extension (Lesson #10197).
  Commit `a8a50b21d`.

- **Dashboard skip-guard fix** (cherry-picked from C4-v2 work).
  Tightens `HAS_LIVE_PLANNING` heuristic to require
  `.planning/REQUIREMENTS.md` rather than just `.planning/`.
  Independent of C4 install issue; cherry-picked as standalone
  bug fix. Commit `06a0da610`.

- **C5 — Pre-emptive flake audit.** New
  `docs/test-discipline/flake-audit-2026-05-11.md` authored
  proactively (no carry-forward; preempts CI flake risk for
  v1.49.639 ship). 4 fixes applied: 2× `ORDER BY rowid`
  tiebreakers + 2× hookTimeout protections. Honest disclosure: 2
  Stage 2 false positives (Lesson #10198) + 1 MED-tier
  deferral to v1.49.639 retro. Commits `97a5ce3cf` + `deff7f9cd`
  + `6d1282c64` + `074ff9d44`.

- **C4 — Self-mod-guard CI install gap.** **DEFERRED to Cluster
  #6.** Attempted twice in W1B: v1 (PR #34) failed CI, reverted
  at `33f4af237`; v2 partial-merged with skip-guard fix retained
  and install step reverted. Diagnostic substrate enumerated:
  install works in CI; meta-test correct; hook itself exits
  status=1 in CI runner only. Narrow Cluster #6 target:
  self-mod-guard.js CI-vs-local runtime divergence.

- **W3 integration meta-test.**
  `tests/integration/v1-49-638-meta-test.test.ts` with 10
  assertions verifying C1 + C2 + C3 + C5 + C4 deferral. Commit
  `d49a6c381`.

## Scope-change disclosure

The original mission package framed v1.49.638 as **absorbing the
4-cluster carry-forward chain to closure on C4**. The actual
outcome is that **the carry-forward chain extends from 4-cluster
to 5-cluster**: C4 deferred to Cluster #6 with a narrower,
more-actionable target than the original C4 scope.

This is honest disclosure, not embarrassment. The v1+v2 attempts
enumerated diagnostic substrate that a successful first-try would
have skipped. Cluster #6 inherits "instrument self-mod-guard.js
for CI-vs-local divergence" instead of "diagnose C4 from scratch."

See `chapter/01-overview.md` "Scope change disclosure" for the
full rationale and `chapter/05-carry-forward.md` CF-1 for the
diagnostic substrate handoff.

## Test counts at ship

- Rust: +3 atlas tests (C1 LRU isolation invariant active under
  per-project API)
- TS integration: +9 tests across C2 ordering + C2 inversions +
  W3.T1 meta-test
- Tools (`vitest.tools.config.mjs`): no delta
- v1.49.638 meta-test: 10 PASS
- 2 known CI failures on self-mod-guard hook fire path — DEFERRED
  to Cluster #6 with diagnostic substrate (see CF-1)

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/01-overview.md` — milestone narrative + scope-change disclosure + why
- `chapter/02-walkthrough.md` — per-component walkthrough with commit anchors + invariants
- `chapter/03-retrospective.md` — what worked / what could be better / operator W0 decision trail
- `chapter/04-lessons.md` — forward lessons emitted (#10197–#10200)
- `chapter/05-carry-forward.md` — Cluster #6 inventory (CF-1 through CF-6)
- `chapter/99-context.md` — cross-references + predecessor pointer + T14 sequence link
- `docs/T14-SHIP-SEQUENCE.md` — NEW canonical T14 sequence reference (authored by C2 this milestone)
- `docs/SUBSTRATE-PROBE-DISCIPLINE.md` — NEW canonical substrate-probe discipline reference (codified by C3 this milestone)
