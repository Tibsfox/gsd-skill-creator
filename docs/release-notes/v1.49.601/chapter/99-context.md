# v1.49.601 — Engine State Context

## Engine state delta (v1.80 → v1.80 — no advance)

| Track | v1.49.600 close | v1.49.601 close | Delta |
|---|---|---|---|
| NASA degree | 1.80 (Mariner 9) | 1.80 (Mariner 9) | unchanged |
| MUS degree | 1.80 (*Nilsson Schmilsson*) | 1.80 (*Nilsson Schmilsson*) | unchanged |
| ELC degree | 1.80 (Stockholm + UNEP) | 1.80 (Stockholm + UNEP) | unchanged |
| SPS species | #77 (Gray Whale) | #77 (Gray Whale) | unchanged |
| §6.6 register | 23 LOCKED (5 watchlist) | 23 LOCKED (5 watchlist) | unchanged |
| TRS substrate | M1 Wave 2 (pack-11 bound) | M1 Wave 2 (pack-11 bound) | unchanged |
| vitest tests | 29,479 | 29,494 | +15 (catalog-index tests) |
| pre-tag-gate steps | 7 | **8** | **+1 (catalog-index drift, BLOCKER)** |

## Pre-tag-gate evolution timeline

The composite gate's step count is a long-soak record of operational-debt counter-cadence work:

| Milestone | Steps | Step added |
|---|---|---|
| v1.49.585 | 4 | 1=build / 2=vitest / 3=completeness — gate created |
| v1.49.587 | 5 | 4=CI-on-dev / 5=www-bundles |
| v1.49.591 | 6 | 6=depth-audit BLOCKER (hardened from WARN) |
| v1.49.596 | 7 | 7=CLAUDE.md drift |
| **v1.49.601** | **8** | **8=catalog-index drift BLOCKER (this milestone)** |

Step count growth rate: ~1 step per ~5 milestones; each step closes a class of silent-drift failure surfaced by post-ship discovery. The gate growth tracks the operational-debt accumulation rate.

## Lessons evolution at v1.49.601

| Lesson | v598 | v599 | v600 | v601 |
|---|---|---|---|---|
| #10221 dev/main sync | ESTABLISHED (3-ex) | applied | applied | applied (will fire 2x at v601 ship) |
| #10231 graceful-thinness | observation #2 | PROMOTED ESTABLISHED | applied (nominal direction) | n/a (no engine state) |
| #10232 INSIDE-window MUS | observation #2 | PROMOTED ESTABLISHED | applied (4th obs reaffirmed) | n/a (no MUS degree) |
| #10233 Tier-2 inline-Opus W2 | observation #1 | observation #2 | PROMOTED ESTABLISHED | applied (tool build path) |
| #10236 substrate-emergent | originated | observation #2 | PROMOTED ESTABLISHED | n/a (no substrate work) |
| #10237 §6.6 watchlist-not-pre-decision | applied (admits + promote) | applied (default no-admit) | PROMOTED ESTABLISHED | n/a (no §6.6 work) |
| #10238 depth-audit gold-standard ext | candidate emitted | DEFERRED | DEFERRED | DEFERRED (still v603) |
| #10239 lab-director G3-boundary | candidate emitted | PATCHED pre-spawn | applied (operator G3) | applied (operator G3) |
| #10240 depth-audit gate refinement | — | — | candidate emitted; DEFERRED | DEFERRED (still v603) |
| #10243 W2 prompt-template patch | — | — | candidate emitted | carryforward (still v602+) |
| **#10244 counter-cadence-on-post-ship-discovery** | — | — | — | **candidate emitted (v601)** |

## Pre-tag-gate exit-code allocation

Updated for step 8:

| Exit | Step | Class |
|---|---|---|
| 0 | all PASS | success |
| 1 | step 1 | npm build failure |
| 2 | step 2 | vitest failure |
| 3 | step 3 | release-notes completeness |
| 4 | step 4 | CI-on-dev red/pending |
| 5 | step 5 | www-bundles esbuild failure |
| 6 | step 6 | depth-audit FAIL (BLOCKER) |
| 7 | step 7 | CLAUDE.md drift |
| 8 | step 8 | catalog-index drift (NEW v601, BLOCKER) |

## Override env vars

| Var | Default | Override |
|---|---|---|
| `SC_SKIP_CI_GATE` | unset | `=1` skip CI-on-dev verification |
| `SC_SKIP_DEPTH_AUDIT` | unset | `=1` skip depth-audit BLOCKER |
| `SC_SKIP_CLAUDE_MD_GATE` | unset | `=1` skip CLAUDE.md drift |
| `SC_SKIP_CATALOG_INDEX_GATE` | unset | `=1` skip catalog-index drift (NEW v601) |

All overrides are emergency-only by convention; the deterministic gate is preferred. Each override exists because skipping the gate is sometimes the right operational call (ship-now > fix-now), but the gate addition is always the right structural call.

## v601 ship metrics

- Wall-time: ~1.5h end-to-end (open → spec → tool-build → wiring → release-notes → operator G3 → ship)
- Token budget: ~120K tokens for tool build (gsd-executor sub-agent) + ~30K for release-notes (inline) + orchestration overhead = ~200K total milestone budget
- vitest delta: +15 tests (catalog-index hermetic suite)
- File count: 2 new (tool + tests) + 5 modified (pre-tag-gate.sh / ftp-sync.mjs / render-claude-md/env-vars.json / vitest.tools.config.mjs / CLAUDE.md) + 4 manifest version bumps + 5 new release-notes files = 16 files in commit
- No engine state advance; no per-degree dirs touched; no FTP sync to tibsfox.com required (the catalogs are already correct from v600+1 hand-fix; v601 just ratifies the deterministic gate that ensures they stay correct)

## Next milestone projection

v1.49.602 will likely be a NASA-degree milestone (1.81). Pre-tag-gate now runs 8 steps; step 8 catalog-index drift will fire as the W2 cross-track refresh discipline. If catalog updates are made at W2 close (per #10244 candidate operational pattern), step 8 PASS at G3 is automatic; if not, step 8 BLOCKS the ship until they are. The class of silent drift that v598/v599/v600 fell to is now closed.
