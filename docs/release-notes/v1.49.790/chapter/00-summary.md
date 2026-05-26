> Following v1.49.789 — _Shelfware Verdict 1: WIRE `semantic-channel` via `dacp drift-check`_, v1.49.790 ships as Codification: 7 Lessons from v785-v789 → 2 New Operative Disciplines.

# v1.49.790 — Codification: 7 Lessons from v785-v789 → 2 New Operative Disciplines

**Shipped:** 2026-05-26

A focused codification ship draining the 7-candidate lesson backlog accumulated across the v785 PROJECT.md normalizer + v786 adoption-scanner + v787 adoption-dashboard + v789 first-shelfware-verdict series. Last codification was v1.49.784 (6 ships ago). Historical precedent (v654: 5 lessons; v784: 8 lessons) codifies at 5-8 candidates; threshold was met at v787 and one candidate (#10421) was field-validated at v789.

## What shipped

- **`docs/static-analysis-tool-discipline.md`** (~130 lines) — new canonical doc for the 5-lesson cluster. Covers test-harness `spawnSync`-over-`execSync` (#10417), multi-importer-root scanning (#10418), baseline-file commit discipline (#10419), `exitWhenDrained()` for >64KB stdout (#10420), and explicit warm-up-period documentation for diff-emitting tools (#10421, field-validated v789).
- **`docs/shelfware-verdict-patterns.md`** (~90 lines) — new canonical doc for the 2-lesson cluster. Covers observability/decision surface separation (#10422) and lightest-wire-wins (#10423). Both lessons emerged from the v789 first per-module verdict ship.
- **`tools/render-claude-md/disciplines.json`** — 2 new manifest entries; `key_lessons` arrays populated with the 7 new formal IDs. Manifest entries 13 → 15; manifest lessons 57 → 64.
- **CLAUDE.md** regenerated via `npm run render:claude-md` (gitignored — local only).
- **`docs/release-notes/v1.49.790/`** — this set (README + 4 chapters).

## Through-line

The v784 codification (8 lessons → 3 disciplines, drained the v780-v783 backlog) established the meta-pattern: when a lesson candidate backlog crosses the 5-8 historical threshold AND one candidate is field-validated, the next-ship default is codification. v790 honors that pattern.

The two new disciplines are independent surfaces:

- **Static-analysis tool authoring** captures pitfalls that recur for ANY CLI in `tools/` that scans the repo or emits metrics — broad applicability beyond the adoption-telemetry stack that surfaced them.
- **Shelfware verdict patterns** captures the design pressures of the per-module decision surface — narrower applicability (specific to the WIRED/RETIRED/ALLOWLISTED ledger) but high stakes per application.

Surface separation between the two disciplines mirrors the surface separation lesson (#10422) itself: the observability discipline (tool authoring) is independent from the decision discipline (verdict patterns).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED from v789). Counter-cadence count UNCHANGED at 5. v790 is forward-cadence discipline-codification work.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 ship 1 — Module-usage scanner | Delivered at v786 |
| T1.2 ship 2 — Dashboard + automation + allowlist | Delivered at v787 |
| T1.2 ship 3 — First shelfware verdict | Delivered at v789 |
| Path A — NASA 1.178 IBEX | Delivered at v788 |
| **Path A meta — Codification of v785-v789 lesson cluster** | **Delivered at v790 (this ship)** |
| T1.1 — Bounded-learning calibration loop | OPEN — 4-6 ships |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Next forward candidates

- **T1.2 ship 4 — Second shelfware verdict.** Five Math Foundations Refresh modules pending verdicts. `tonnetz` RETIRE is the cleanest next candidate (~30-45min); `wasserstein-hebbian` ALLOWLIST also strong.
- **NASA 1.179** — INTERSTELLAR-BOUNDARY axis obs#3 continuation candidates in `www/tibsfox/com/Research/NASA/1.178/to-1.179.md` (Wind, Voyager extensions, Pioneer 10/11, Cassini INCA, New Horizons, FAST, DE-1).
- **T1.1** — bounded-learning calibration loop (most ambitious Tier 1 remaining).
- **T1.3** — College of Knowledge consumer engine.

---
**Prev:** [v1.49.789](../v1.49.789/00-summary.md) · _(current tip)_
