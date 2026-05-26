# v1.49.790 — Codification: 7 Lessons from v785-v789 → 2 New Operative Disciplines

**Released:** 2026-05-26
**Type:** forward-cadence discipline-codification milestone (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.789 — Shelfware Verdict 1: WIRE `semantic-channel` via `dacp drift-check`
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** Path A (highest-ROI) from the v789 handoff — drain the 7-candidate lesson backlog accumulated across v785-v789

## Summary

A focused codification ship closing the 7-lesson candidate backlog accumulated across the v785 PROJECT.md normalizer + v786 adoption-scanner + v787 adoption-dashboard/automation + v789 first-shelfware-verdict series. Last codification was at v1.49.784 — 6 ships ago. Historical precedent (v1.49.654 codified 5; v1.49.784 codified 8) supports codifying at 5-8 candidates; the threshold was met at v787 and one candidate (#10421) was field-validated at v789.

Two new domain entries land in `tools/render-claude-md/disciplines.json`, each backed by a new canonical doc in `docs/`:

| Domain | Lessons | Canonical doc |
|---|---|---|
| Static-analysis tool authoring | #10417–#10421 (5) | `docs/static-analysis-tool-discipline.md` |
| Shelfware verdict patterns | #10422, #10423 (2) | `docs/shelfware-verdict-patterns.md` |

Seven formal lesson IDs are promoted from `candidate` to `ESTABLISHED` at this ship, formalizing the candidate IDs from prior ships:

| Formal ID | First emitted | Discipline |
|---|---|---|
| #10417 | v785 | Static-analysis tool authoring |
| #10418 | v786 | Static-analysis tool authoring |
| #10419 | v786 | Static-analysis tool authoring |
| #10420 | v787 | Static-analysis tool authoring |
| #10421 | v787 (field-validated v789) | Static-analysis tool authoring |
| #10422 | v789 | Shelfware verdict patterns |
| #10423 | v789 | Shelfware verdict patterns |

## What was codified

### Static-analysis tool authoring (5 lessons)

Five consecutive ships authored or extended a CLI tool in `tools/` (normalizer, scanner, refresh orchestrator, drift checker). Each surfaced a distinct authoring pitfall; the cluster is the result of paying each bill once.

- **#10417** — Test harnesses use `spawnSync` (not `execSync`) so stderr survives exit 0. Three sequential applications (v785, v786, v787) before promotion.
- **#10418** — Cross-module analyzers scan multiple importer roots (not just `src/`). Caught at v786 first scan; 2 modules flipped from test-only to living after extending to `tools/`.
- **#10419** — Metric-emitting tools commit a baseline file so future runs diff via `git`. Both `.md` (human) and `.json` (machine) shapes emit.
- **#10420** — CLIs flush stdout via `exitWhenDrained()` before `process.exit()` to avoid 64 KB pipe-buffer truncation. Surfaced at v787 with 168 KB JSON truncated at byte 65536.
- **#10421** — Diff-emitting observability tools document the warm-up period (first run has no prior baseline). **Field-validated at v789** by the adoption-baseline diff emitting exactly the predicted line `↑ semantic-channel: test-only → living`.

### Shelfware verdict patterns (2 lessons)

The v789 ship was the first per-module shelfware verdict (`semantic-channel` WIRED via `dacp drift-check`). Two design pressures showed up on that first attempt — both load-bearing for the five remaining candidate modules and for every future verdict-driven ship.

- **#10422** — Verdict-pattern surface separation is load-bearing. Observability surface (scanner + dashboard + allowlist) and decision surface (per-module verdicts) MUST live in separate files and evolve independently.
- **#10423** — The lightest wire that satisfies the verdict is preferable to the most natural wire. A CLI subcommand usually suffices to flip the adoption-scan classification and preserves HARD-preservation invariants by not touching the surfaces those invariants protect.

## Files changed

### New (2 canonical docs + 5 release-notes)

- `docs/static-analysis-tool-discipline.md` — new (~130 lines)
- `docs/shelfware-verdict-patterns.md` — new (~90 lines)
- `docs/release-notes/v1.49.790/README.md` + `chapter/*` — this set

### Modified (1)

- `tools/render-claude-md/disciplines.json` — manifest entries 13 → 15 (+2 domains), manifest lessons 57 → 64 (+7 IDs).

CLAUDE.md regenerated via `npm run render:claude-md` (gitignored — local only).

## Test counts

- **render-claude-md `--check`:** "CLAUDE.md is up to date." (manifest ↔ rendered output in sync).
- **discipline-coverage report:** manifest entries 13 → 15; manifest lessons 57 → 64. All 7 new formal IDs are now in the COVERED bucket (in manifest AND in discipline doc).
- **Pre-tag-gate:** TO-FILL after gate run.

## What this ship is

- A focused discipline-codification ship — 2 new domain entries, 2 new canonical docs, 7 formal lesson IDs.
- An honor of the meta-discipline: when the 7-lesson backlog crossed the historical codification threshold (5-8 candidates) and one candidate was field-validated, the deferred-maintenance discipline (#10415) said close it now, not later.

## What this ship is not

- Not a NASA degree advance. Engine state unchanged at 1.178.
- Not a counter-cadence ship. Counter-cadence count stays at 5.
- Not a code refactor. Tools and source code unchanged beyond the manifest update; only docs added.

## Next session pickup

- **Path B — Second shelfware verdict.** Five Math Foundations Refresh modules pending verdicts. `tonnetz` RETIRE is the cleanest next candidate (~30-45min); `wasserstein-hebbian` ALLOWLIST also strong.
- **Path C — NASA 1.179 forward-cadence.** INTERSTELLAR-BOUNDARY axis substrate-cumulative obs#3 candidates queued in `to-1.179.md` (Wind 1994, Voyager 1/2 interstellar, Pioneer 10/11, Cassini INCA, New Horizons, FAST, DE-1).
- **Path D — T1.1 ship 1/4-6: Bounded-learning calibration loop.** Most ambitious remaining Tier 1 item.
- **Path E — T1.3 ship 1/3-5: College of Knowledge consumer engine.**

Operator picks per-ship.
