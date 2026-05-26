# 99 — Context: v1.49.786 Adoption Telemetry Scanner

## Predecessor

**v1.49.785** — PROJECT.md Normalizer + GAP Table Refresh.
- Tag: `v1.49.785` at SHA `74bf18706`
- Post-ship RH refresh: SHA `9881d7daa`
- First Tier 1 ship from AUDIT-2026-05-26 (T1.4 + S5 — PROJECT.md prose-drift converted to deterministic pre-tag-gate step 17 + GAP table refreshed).

## This milestone's source

`.planning/AUDIT-2026-05-26-core-functions-retrospective.md` §4 Tier 1 item **T1.2 — Wire intrinsic telemetry as adoption surface**:

> *Why:* Default-off substrate is the right posture, but without telemetry the project can't distinguish living-code from shelfware. Era D surfaced this: 6-ship gap between module ship and first non-test caller is the norm, not the exception.
>
> *What:* Extend `src/intrinsic-telemetry/` (v571) to emit a weekly "modules touched in last 30 days" report from real call sites (telemetry, not unit tests). Make adoption observable in `dashboard/`.
>
> *Cost:* 2-3 ships. Module exists; just needs wiring + dashboard widget.

v1.49.786 ships **ship 1 of 2-3** as a static-analysis-first wedge. The audit suggested extending `src/intrinsic-telemetry/`; on inspection that module is a pure-math correlation library (Spearman / Pearson), not a runtime tracking facility. The standalone scanner is the right shape for ship 1 — it runs in 200ms, produces immediately-actionable data, and the runtime-tracking side becomes the natural ship 2 of 2-3 extension.

## Successor candidates

Audit §6 + ship 1 retrospective:
1. **NASA 1.178 IBEX (recommended)** — 10-ship engine-state plateau is now overdue beyond the typical handoff threshold. Strongly recommend lifting before next Tier 1 ship.
2. v1.49.788 — T1.2 ship 2/3: dashboard widget + weekly automation (cron-like job that re-runs the scan + commits the baseline diff)
3. v1.49.789 — T1.2 ship 3/3: first shelfware verdict — pick the most striking Era D test-only module (probably from Math Foundations Refresh's 6-of-6 test-only set) and either wire it into a real call site OR formally retire it
4. v1.49.790+ — T1.1 ship 1/4-6: bounded-learning calibration loop first threshold change with evidence

## Branch state pre-ship

- `dev` = `origin/dev` = `origin/main` = `9881d7daa` (0-commit drift post-v785)
- Working tree: `dashboard/index.html` modified (auto-regen leave-alone), `.learn-staging/` + `graphify-out/` untracked runtime dirs
- `.planning/STATE.md` clean (hand-authored to v785 state)
- `.planning/PROJECT.md` clean (normalizer passes)

## Engine state baseline (carried forward)

- NASA degree: **1.177** (unchanged; **10 consecutive ships at this level** v777-v786)
- MUS / ELC / SPS / TRS: SCAFFOLD-PENDING continued
- §6.6 register: unchanged (no §6.6 events this ship)
- Counter-cadence count: 5 (unchanged — v585, v776, v777, v778, v779; v786 is audit-driven, not counter-cadence)

## Baseline-finding highlights

The scan's first run produced concrete evidence for the audit's adoption-gap thesis:

| Category | Count |
|---|---|
| Total `src/` modules | 153 |
| Living (≥1 real caller) | 91 (59%) |
| Test-only (only test imports) | 52 (34%) |
| Isolated (zero importers) | 10 (7%) |

**Era D substrate (v549-v580) slice: 20 of 33 tracked modules are test-only (61%).** Math Foundations Refresh (v572) is 6/6 test-only. Convergent Substrate (v570) is 4/5 test-only. LeJEPA's `sigreg` is test-only.

**The audit module is itself test-only.** `src/intrinsic-telemetry/` has 2 test importers and 0 real callers — recursive proof of the audit's thesis at the module the audit suggested as the adoption-telemetry anchor.

## Files committed this ship

| Path | Status | Notes |
|---|---|---|
| `tools/adoption-scan.mjs` | NEW | 297 lines |
| `tools/__tests__/adoption-scan.test.mjs` | NEW | 11 tests |
| `vitest.tools.config.mjs` | MODIFIED | +1 test-file entry |
| `package.json` | MODIFIED | +2 npm scripts |
| `package-lock.json` | MODIFIED | version bump |
| `src-tauri/Cargo.toml` | MODIFIED | version bump |
| `src-tauri/tauri.conf.json` | MODIFIED | version bump |
| `docs/ADOPTION-BASELINE-v1.49.786.md` | NEW | 180-line baseline |
| `docs/release-notes/v1.49.786/README.md` | NEW | |
| `docs/release-notes/v1.49.786/chapter/00-summary.md` | NEW | |
| `docs/release-notes/v1.49.786/chapter/03-retrospective.md` | NEW | |
| `docs/release-notes/v1.49.786/chapter/04-lessons.md` | NEW | |
| `docs/release-notes/v1.49.786/chapter/99-context.md` | NEW | this file |
| `docs/release-notes/STORY.md` | MODIFIED | v786 entry appended |
| `docs/RELEASE-HISTORY.md` | MODIFIED | v786 row added (post-ship RH refresh) |

Working-tree only (NOT committed; `.planning/` is gitignored):
- `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` (Tier 1 source)
- `.planning/audit-2026-05-26/era-{A,B,C,D,E}-*.md` (per-era notes)
- `.planning/STATE.md` (will be hand-authored to v786 state post-ship)
- `.planning/PROJECT.md` (already at v785 state; "Latest shipped release" will tick to v786 next refresh)
