# 99 — Context: v1.49.650 Engine State + Predecessor Chain

## Predecessor

**v1.49.634 — Concerns Cleanup #2** (counter-cadence operational-debt milestone).

- Tag: `v1.49.634`
- dev=main SHA at ship: `d4ffa4f32be315bc8bf1c91b43d56b78a01a2ad2`
- Shipped: 2026-05-11 (predecessor of this milestone; reading the date forwards: same calendar day)
- Counter-cadence: `true` (matches v1.49.650's own counter-cadence flag — second consecutive cleanup-shape ship)
- Degree-advancing: `false` (no NASA / MUS / ELC / SPS / TRS forward-cadence content advanced)

The v1.49.634 ship pipeline post-bump pre-tag-gate failed on a sharp-threshold perf assertion at
`src/memory/__tests__/m2-short-term.test.ts` CF-M2-02 (observed p95 10.37ms vs sharp 10ms). The
inline fix at commit `411edf9ee` added 20 warmup iterations before the measurement window. That
fix is C3's canonical example at v1.49.650 — v1.49.650 generalizes the pattern, surfaces it across
the suite, and ships per-site-tuned warmup across 8 additional sites.

Two further v1.49.634 inline stabilizations (`13e2df2a8` widening a skip-guard to full-manifest;
`c6d49d8ab` + `c49528c42` bumping beforeEach timeouts 10s → 60s) are the canonical examples for C4's
Template 3 + Template 2 respectively.

## Engine state — UNCHANGED from v1.49.634 close

| Engine track | Degree at v1.49.634 close | Degree at v1.49.650 close | Delta |
|---|---|---|---|
| NASA | 108 (v1.49.633 STS-6 Challenger) | 108 | UNCHANGED |
| MUS | 108 (LANDING-ANCHOR-ONLY-INSIDE candidate) | 108 | UNCHANGED |
| ELC | 108 (FIRST-AFRICAN-AMERICAN-BIG-CITY-MAYOR locked) | 108 | UNCHANGED |
| SPS | #105 (Picidae order-pivot) | #105 | UNCHANGED |
| TRS | pack-30 (information-theory binding) | pack-30 | UNCHANGED |

This is by design. v1.49.650 is a counter-cadence operational-debt milestone (Lesson #10168 cadence:
every ~30 forward-cadence milestones, run a concerns-cleanup ship). Counter-cadence milestones do
NOT advance engine state — they convert accumulated social-rule operational debt into deterministic
gates, tools, and discipline docs. The next degree-advancing ship resumes engine-state advance at
the next forward-cadence milestone.

## Cleanup cluster cadence

| Cluster ship | Tag | Predecessor degree | Counter-cadence? | Distance from prior cleanup |
|---|---|---|---|---|
| First cleanup | v1.49.585 | degree 66 | `true` | n/a (origin) |
| Second cleanup | v1.49.634 | degree 108 | `true` | +42 forward-cadence ships |
| **Third cleanup (this)** | **v1.49.650** | **degree 108** | **`true`** | **+0 forward-cadence ships** |

v1.49.650 fires close to v1.49.634 because the second cleanup landed *late* (19 forward-cadence ships
past the ideal 30-ship interval per Lesson #10168). The cadence is now resetting: v1.49.650 absorbs
the v1.49.634 deferred batch (C3 perf-warmup pattern, C4 fragile-test class) plus the operator-pinned
C1 encryption work. The next cleanup window opens after the next ~30 forward-cadence ships advance
the NASA / MUS / ELC / SPS / TRS engines.

## Mission package + decision artifacts

- Mission package: `.planning/missions/v1-49-650-housekeeping-cluster/` (21 files, ~4,461 lines source)
- Source vision: `.planning/codebase/CONCERNS.md` (2026-05-10 audit)
- Decision artifact: `.planning/keystore-encryption-decision.md` (operator-approved at W0 HARD GATE; absorbs operator Q1 + Q2 decisions 2026-05-11; pins Model A + hybrid CLI + feature flag rename + 4-byte sanitizer threshold)
- W0 HARD GATE verdict (lab-director arch-review): PASS at iteration 2 (absorbed M1/M2/M3/A1/A2 refinements)
- W1A G-gate verdict: PASS (verdict at `.planning/missions/v1-49-650-housekeeping-cluster/W1A-GATE-VERDICT.md`)
- W1B G-gate verdict: PASS (verdict at `.planning/missions/v1-49-650-housekeeping-cluster/W1B-GATE-VERDICT.md`)

## v1.49.651 carry-forward

The following items defer to the next counter-cadence cleanup milestone:

- **C2 cartridge-finalization** — halted at Stage 1; pre-mission spec at `.planning/cartridge-migration-cli-gap.md` (5 deliverables, ~4-7h Sonnet estimate)
- **C7 upstream rename absorb** — upstream still v1.41.2; Stage-1 re-probe at v1.49.651
- **Real Tauri keystore commands** — `src-tauri/src/commands/keystore.rs` wiring; flips `getKeystoreApi()` factory return value from stub to production
- **Pre-existing atlas test failures** — 2 in `intelligence::atlas::tests` (Rust); confirmed on predecessor `d4ffa4f32`, flagged exempt at W1A G-gate
- **C3 perf-warmup remainder** — 9 `no-warmup` sites documented-for-followon in `.planning/test-discipline/perf-assertion-audit-2026-05-11.md`
- **C4 fragile-test remainder** — 6 sites documented-for-followon in `.planning/test-discipline/fragile-test-audit-2026-05-11.md` (split between Template-5 injected-clock candidates and subprocess-in-beforeEach patterns)

The v1.49.650 → v1.49.651 handoff will reference this section as the carry-forward index.
