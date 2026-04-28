# v1.49.578 -- Engine Context (Snapshot)

**Released:** 2026-04-26
**Backfilled:** 2026-04-27 (1 day after release; original ship did not author release-notes -- drift remediation)

## Backfill provenance

This release-notes set was authored on 2026-04-27, one day after v1.49.578 shipped on 2026-04-26. The original W6 closing wave (commits `520419af8` on dev / `2100e5391` on main; tag `v1.49.578` annotated and pushed; npm `gsd-skill-creator@1.49.578` published; GitHub release created) did not produce the standard `docs/release-notes/v1.49.578/` directory at ship time. The user flagged the drift on 2026-04-27 and authorised this backfill.

Sources used for the backfill:
- `.planning/STATE.md` blocks `v1_49_578_legacy_block` + `v1_49_578_summary` (canonical wave outcomes, test deltas, open items)
- `.planning/missions/v1-49-578-jp-substantiation/` mission package (README + 01-vision-doc + 03-milestone-spec + 04-wave-execution-plan + 05-test-plan + components/00-07)
- `git log --oneline 1b9eedb9b..520419af8` (11 commits in the v1.49.578 range)
- `git show` on closing commits `520419af8` (dev) and `2100e5391` (main)
- `docs/release-notes/v1.49.581/` and `docs/release-notes/v1.49.582/` (template structure reference)

Items flagged as `[unavailable -- backfill 2026-04-27]` in the chapter files indicate information that was not recoverable from the sources above. The most notable: the precise reason release-notes were skipped at original ship is not recorded in STATE.md or commit messages.

The backfill is structurally complete (5 files matching the v1.49.581/v1.49.582 template) but readers should treat the prose as 1-day-after reconstruction, not real-time ship narration.

## Engine state (post-v1.49.578)

| Metric | Value |
|---|---|
| Milestone status | `ready_for_review` (closed 2026-04-26) |
| Profile | Solo (one-developer Opus session) |
| Pipeline speed | Fast (Vision + Mission, no separate research stage) |
| Archetype | Infrastructure Component (extends existing JP-NNN primitives + closes deferred items) |
| Total commits in milestone range | 11 (range `1b9eedb9b..520419af8`) |
| Substantive commits in v1.49.578 (W2-W6) | 4 (`33a8a93e3`, `e9f6da224`, `96936725d`, `520419af8`) |
| Carryforward commits (W0/W1) | 4 (`fd3d40b74`, `b75d675df`, `e71f488b5`, `e9be25f72`) |
| Test count baseline (v1.49.577 close) | 28,492 passing |
| Test count final (v1.49.578 close) | 28,510 passing |
| Test delta | +18 (target was >=+10) |
| Regressions | 0 |
| Open items at close | 1 (down from 5 at v1.49.577 close) |

## Wave outcome table

| Wave | Component | Outcome | Commit | Tests |
|---|---|---|---|---|
| W0/W1 | Pre-staged carryforward (test-fix + JP-001 pin + JP-002 retrieve + JP-010a runAB) | (already on dev at `e9be25f72`) | `b9076c4d9..e9be25f72` | (carried) |
| W2a | `src/orchestration/selector.ts` -- JP-002 wiring | DEFER (one-shot batch, no streaming-decision shape) | (no commit) | 0 |
| W2b | `src/orchestration/draft-verify-router.ts` -- JP-002 wiring | WIRED | `33a8a93e3` | +5 |
| W2c | `src/orchestration/mesh-degree-monitor.ts` -- JP-002 wiring | DEFER (event-driven + hard-rule + one-shot) | (no commit) | 0 |
| W3  | `docs/research/nasa-citations.md` + JP-040 presence test | WIRED | `e9f6da224` | +4 |
| W4  | `tools/verify-mathlib-pin.sh` + JP-001 lake build PASS | WIRED + LAKE_BUILD_PASS | `96936725d` | +6 |
| W5  | JP-010a real-caller seed at `src/ab-harness/cli.ts` | WIRED | `520419af8` | +2 |
| W6  | Closing wave | (this commit) | `520419af8` (dev) / `2100e5391` (main) | regression-only |

## JP-001 Mathlib lake build PASS detail

Ran `tools/verify-mathlib-pin.sh` end-to-end on Lean 4.15.0 / Mathlib4 commit `6955cd00cec441d129d832418347a89d682205a6`:

| Namespace | Jobs | Status |
|---|---|---|
| `Mathlib.Probability.Kernel.Disintegration.Basic` | 1760 | PASS |
| `Mathlib.InformationTheory.KullbackLeibler.Basic` | 2479 | PASS |
| `Mathlib.Probability.Distributions.Gaussian` | 2706 | PASS |
| `Mathlib.Probability.IdentDistrib` | 2438 | PASS |

All four namespaces compiled cleanly. The CLAUDE.md External Citations §arXiv:2510.04070 anchor (Markov kernels in Lean Mathlib by Degenne et al.) is now reproducible in one command.

## Open items remaining at close

| # | Item | Status | Why |
|---|---|---|---|
| 1 | `src/ab-harness/wasserstein-boed.ts` IPM-BOED replacement | DEFER (carried from v1.49.577) | Info-blocked: needs a concrete `p(y \| d, theta)` data-generating model that doesn't exist yet for skill-promotion experiments. Will unblock when a real BOED experimental design surfaces. |

The other four open items from v1.49.577 close (JP-001 lake build / JP-002 wirings / JP-040 on-tree / JP-010a real caller) are now all closed -- either with a commit SHA + tests, or with an explicit DEFER + read-of-source evidence.

## Versions bumped at v1.49.578

- `package.json` -> `1.49.578`
- `package-lock.json` -> `1.49.578`
- (Tauri/Rust side) -- **[unavailable -- backfill 2026-04-27]** the merge-stat output for `2100e5391` shows package.json + package-lock.json bumps but does not list `src-tauri/Cargo.toml` or `src-tauri/tauri.conf.json` in the visible portion; if those were bumped, the bumps would have happened in the same closing commit `520419af8` on dev.

## Branch + tag + npm state at close

- Branch `dev`: closing commit `520419af8`
- Branch `main`: closing merge commit `2100e5391` (carries 11 commits `b9076c4d9..2e2eff22c`)
- Tag: `v1.49.578` (annotated, pushed)
- GitHub release: https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.578
- npm: `gsd-skill-creator@1.49.578` (published)

## Self-review pass status

The v1.49.577 self-review pass (cleanup commit `268950204`, 6 findings: 2 MEDIUM + 4 LOW) is the most recent self-review on record. v1.49.578 did not run a separate self-review pass -- its W2-W6 work was small enough that the 4 substantive commits (`33a8a93e3` / `e9f6da224` / `96936725d` / `520419af8`) are themselves the documented surface, and no new src/ subsystem was added. **[unavailable -- backfill 2026-04-27]** whether a self-review pass was explicitly considered and skipped, or simply not triggered by the milestone's small shape, is not recorded.

## CLAUDE.md anchor relationship

v1.49.578 did NOT add new CLAUDE.md External Citations anchors. The four anchors landed at v1.49.577 (arXiv:2604.20897 deployment-horizon ROI / arXiv:2604.20915 causal-synchronization KL bound / arXiv:2510.04070 Markov kernels in Lean Mathlib / arXiv:2604.21101 hybridizable neural time integrator) plus the philosophical anchor (arXiv:2604.21048 Mandelbrot/Julia 3-parameter slices) remain canonical.

v1.49.578's substantiation work touches the §arXiv:2510.04070 anchor concretely: the JP-001 lake build PASS is the operational verification that the Mathlib commit hash pinned in `src/mathematical-foundations/lean-toolchain.md` actually compiles the load-bearing namespaces against which v1.50's proof companion is intended to compile.

## Next milestone

Per `.planning/STATE.md` last_activity entry, v1.49.578 closed `ready_for_review` 2026-04-26. The next milestone (v1.49.579+) is not pre-determined by v1.49.578's output -- v1.49.578 is closure work, not capability-extension work, so the next milestone's scope is a fresh decision.

Forward lessons from v1.49.578 that the next milestone should consume:
- Substantiation-after-substantive pattern (lesson 1 in `chapter/04-lessons.md`)
- DEFER with read-of-source evidence as first-class outcome (lesson 2)
- Author release-notes at W6 close, not as follow-on (lesson 8) -- this lesson exists specifically because v1.49.578's release-notes were backfilled

---

*v1.49.578 / JULIA-PARAMETER Substantiation + Closure / 2026-04-26 (release-notes backfilled 2026-04-27)*
