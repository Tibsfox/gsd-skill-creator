# 00 — Summary: v1.49.638 Housekeeping Cluster #5

v1.49.638 is the **sixth counter-cadence cleanup milestone** in the
engine, the fifth in the explicit cluster chain.

| Milestone | Cluster | Date | Notes |
|---|---|---|---|
| v1.49.585 | #1 | 2026-04-28 | Concerns cleanup (initial cadence) |
| v1.49.634 | #2 | 2026-05-11 | Concerns cleanup #2 |
| v1.49.635 | #3 | 2026-05-11 | Housekeeping (8 components + Meta-Lesson) |
| v1.49.636 | #3-followup | 2026-05-11 | Housekeeping absorbing v1.49.635 handoff |
| v1.49.637 | #4 | 2026-05-11 | Keystore finalization + audit-tool catalog |
| **v1.49.638** | **#5** | **2026-05-11** | **Atlas-LRU per-project API + STORY-gate ordering + substrate-probe codification + flake audit** |

The fundamental design choice was to **close v1.49.637 carry-forwards
that did not require deep architectural rework** and **codify two
operational disciplines that surfaced as new docs** (T14 ship
sequence; substrate-probe discipline). A fifth component — C4
self-mod-guard CI install gap — was attempted twice in W1B,
diagnostic substrate was enumerated, and the component was **deferred
to Cluster #6** with a narrow CI-vs-local divergence target.

## Mission outcome

**5 of 6 planned components shipped + 1 explicit deferral.** The
original mission package framed v1.49.638 as absorbing the
4-cluster carry-forward chain to closure on C4. The actual outcome
is that **the carry-forward chain extends from 4-cluster to
5-cluster**: C4 self-mod-guard CI install gap was attempted as
option (a) "CI install" per operator W0 choice, failed CI under v1
(reverted at `33f4af237`), re-attempted as partial-merge under v2,
unmasked a deeper bug (self-mod-guard.js hook exits status=1 in CI
runner), and was deferred to Cluster #6 with the dashboard
skip-guard fix cherry-picked forward as an independent bug fix.

This is honest disclosure, not embarrassment: the v1+v2 attempt
**enumerated substrate** that a successful first-try would have
skipped, and the resulting Cluster #6 diagnostic target is narrower
and more actionable than the original C4 scope.

## Component delivery

Seven atomic commits across three waves: W1A (C1 + C2 parallel +
T3 STORY-gate inversion fix), W1B (C4-v1 + revert + C4-v2 partial +
substrate-probe doc rebase), W1C (C5 pre-emptive flake audit), W3
stage 1 (W3.T1 integration meta-test + W3.T2 release-notes). G3
(ship) is operator-only via team-lead relay.

### Components shipped

- **C1 — Atlas LRU per-project API** (W1A.T1) — `get_or_open_for_project` added at `src-tauri/src/atlas.rs` per operator option (a) "per-project API" choice. LRU isolation invariant verified at 3 new Rust tests including cross-project access does not promote in source project. Commits `7a9a2c5cb` + `b78097bb9`.

- **C2 — STORY-gate ordering** (W1A.T2 + W1A.T3) — canonical `docs/T14-SHIP-SEQUENCE.md` authored per operator option (i) "doc+invariant" choice. New invariant test `tests/integration/c2-story-gate-ordering.test.ts` enforces append-after-tag-push ordering. `scripts/pre-tag-gate.sh` step-10 STORY-append removed (was misplaced; T14 sequence is the canonical home). v1.49.637 meta-test C4 assertions inverted via W1A.T3 to match new ordering. Commits `961e36943` + `a5ad270fb` + `04dbfdc7c` + `1e9d64dfc`.

- **C3 — Substrate-probe discipline codification** (W1B.T1) — `docs/SUBSTRATE-PROBE-DISCIPLINE.md` authored as canonical reference (relocated from `.planning/test-discipline/` for tracked codification). Codifies Lesson #10192 from v1.49.637 plus the runtime-environment-substrate extension (Lesson #10197 forward). Commit `a8a50b21d`.

- **Dashboard skip-guard fix** — cherry-picked from C4-v2 attempt as an independent bug fix. Tightens `HAS_LIVE_PLANNING` heuristic to require `.planning/REQUIREMENTS.md` (not just `.planning/`) so the dashboard skip-guard does not false-positive on bare planning directories. Commit `06a0da610`.

- **C5 — Pre-emptive flake audit** (W1C) — `docs/test-discipline/flake-audit-2026-05-11.md` authored with 4 fixes applied: 2× `ORDER BY rowid` tiebreaker additions (`97a5ce3cf` + `deff7f9cd`) + 2× `hookTimeout` protections (`6d1282c64`) + Stage 3 closure (`074ff9d44`). Honest disclosure: 2 Stage 2 false positives (audit-method grep limitation surfaced as Lesson #10198) + 1 MED-tier escalation deferred to v1.49.639.

- **W3 integration meta-test** (W3.T1) — `tests/integration/v1-49-638-meta-test.test.ts` with 10 assertions verifying all 5 landed components + 1 explicit C4-deferral assertion. Commit `d49a6c381`.

### Component deferred

- **C4 — Self-mod-guard.js CI install gap** — DEFERRED to Cluster #6. Diagnostic substrate enumerated: install.cjs works in CI under verbose mode; meta-test assertion is correct; **the actual failure is `self-mod-guard.js` hook itself exits status=1 in the CI runner** while passing locally (2/30,275 failures, both on the hook fire path). Narrow Cluster #6 target: env/path/permission divergence between CI runner and local execution context.

## See also

- `chapter/01-overview.md` — milestone narrative + scope-change disclosure + why
- `chapter/02-walkthrough.md` — per-component walkthrough
- `chapter/03-retrospective.md` — what worked / what could be better / operator W0 trail
- `chapter/04-lessons.md` — forward lessons emitted (#10197–#10200)
- `chapter/05-carry-forward.md` — Cluster #6 inventory (CF-1 through CF-6)
- `chapter/99-context.md` — cross-references + predecessor pointer + T14 sequence link
