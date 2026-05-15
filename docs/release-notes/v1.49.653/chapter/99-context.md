# v1.49.653 Chapter 99 — Context

## Predecessor / successor in the engine

- **Predecessor (degree-advancing):** v1.49.652 STS-51-A Discovery (NASA 1.115→1.116; shipped 2026-05-13)
- **Predecessor (counter-cadence):** v1.49.585 Concerns Cleanup / Foundation Shoring (shipped 2026-04-28; 68 forward-cadence milestones ago)
- **Successor (degree-advancing) candidate:** v1.49.654 STS-51-C Discovery 1985-01-24 OR alternate STS-51-D Discovery 1985-04-12 (TBD at v654 W0)
- **Successor (counter-cadence) candidate:** v1.49.654+ FA-652-11 NASA template-uplift milestone (see `.planning/fa-652-11-drift-survey.md` — 16 missing MUS/ELC index.html files at degrees 1.109-1.116)

## Engine state (UNCHANGED from v1.49.652)

| Track | State | Notes |
|---|---|---|
| NASA | 1.116 STS-51-A | Catalog at 117 degree-directories; FA-652-11 drift open |
| MUS | 1.116 Madonna *Like a Virgin* | LANDING-SYMMETRICAL-INSIDE-STRICT obs#1 |
| ELC | 1.116 1984 US presidential election | ELECTORAL-LANDSLIDE-AS-CULTURAL-COHORT obs#2 |
| SPS | #113 Pacific Tree Frog | FIRST-AMPHIBIAN + FIRST-ANURA + FIRST-HYLIDAE + FIRST-LISSAMPHIBIAN obs#1 |
| TRS | pack-38 K_38=505 | functional analysis; 26-of-26 single-pass K_N achievement |

## Mission-package context

This milestone does **not** carry a `.planning/missions/v1-49-653-*/` package. Work was driven by:

1. `.planning/long-term-roadmap-2026-05-15.md` — the 6-item roadmap authored at session start sizing L-01 through L-06.
2. `.planning/codebase/CONCERNS.md` — same-day codebase-mapping audit (2026-05-15 refresh).
3. `.planning/citation-debt-audit-2026-05-15.md` — V-flag ledger audit memo.
4. `.planning/fa-652-11-drift-survey.md` — scope doc for the deferred NASA template-uplift milestone.
5. `.planning/todo-scaffold-audit-2026-05-15.md` — TODO/scaffold-marker audit memo.
6. `.planning/concerns-addendum-2026-05-15.md` — addendum documenting 3 stale CONCERNS findings + 4 newly-fixed items.

All 6 planning artifacts are gitignored under `.planning/`. They are NOT committed to repo history.

## File map (gitignored vs tracked)

**Tracked this milestone:**
- `docs/release-notes/v1.49.653/` (5 files — this chapter set)
- `docs/citation-debt-syntax.md` (L-03 syntax spec)
- `docs/T14-SHIP-SEQUENCE.md` (step 2.6 added)
- `tools/check-scaffolder-residue.mjs` (L-02 dependency)
- `tools/check-story-drift.mjs` (recurrence prevention)
- `tools/check-discipline-coverage.mjs` (L-04 audit tool)
- `tools/citation-debt/scan-retrospectives.mjs` (L-03 scan tool)
- `tools/citation-debt/apply-diff.mjs` (L-03 apply tool)
- `tools/diagnostics/list-daemons.sh` (CONCERNS §22)
- `tools/restore-from-live.sh` (CONCERNS §24.4)
- `tools/bench/` (3 files — L-05 infra + baseline)
- `tools/pre-tag-gate.sh` (consolidation + 4 new steps)
- `tools/pre-tag-gate.test.sh` (test fixture updated)
- `tools/render-claude-md.mjs` (renderDisciplines + diffMode added)
- `tools/render-claude-md/agents.json` (observer removed)
- `tools/render-claude-md/disciplines.json` (NEW — manifest)
- `tools/render-claude-md/env-vars.json` (new vars + deprecation flags)
- `vitest.bench.config.mjs` (L-05 bench config)
- `src/citations/extractor/__benches__/` (2 bench files)
- `src/cli/commands/gsd-init.ts` (observer setup-check removed)
- `src/dashboard/collectors/topology-collector.test.ts` (observer test fixture renamed to passive-monitor)
- `project-claude/agents/observer.md` (DELETED)
- `project-claude/hooks/git-add-blocker.js` (regex extended)
- `project-claude/hooks/__tests__/git-add-blocker.test.sh` (8 new test cases)
- `project-claude/install.cjs` (observer entries removed)
- `project-claude/manifest.json` (observer entry removed)
- `docs/release-notes/STORY.md` (preamble + 8 backfilled entries)
- `package.json` (new bench + render:diff scripts)
- `README.md` (CLAUDE.md regeneration docs)
- `.gitignore` (5 new entries)
- `CLAUDE.md` (AUTO:disciplines section added)

**NOT tracked (gitignored):**
- `.planning/long-term-roadmap-2026-05-15.md` and 5 other planning memos
- `tools/bench/last-run.json` (per-run output)
- `graphify-out/` (pre-session)

## Why this milestone is counter-cadence

Per Lesson #10168 (v1.49.585 origin), counter-cadence milestones run periodic operational-debt closure between substrate-content (NASA / MUS / ELC / SPS / TRS) advances. They have these properties:

- **No engine-state forward-cadence content** — substrate-axes remain at predecessor positions.
- **Multi-component scope** — usually 5+ coordinated subsystem changes that benefit from atomic landing.
- **System gates itself at ship time** — the newly-installed gates are exercised against the milestone's own release-notes/push/chapters during ship pipeline.
- **No mission package required** — driven by audit memos + planning docs rather than the W0-W6 mission-package pattern.

v1.49.653 satisfies all four properties.

## Pre-tag-gate matrix at ship

13 gate steps; 4 added this milestone.

| Step | Check | Status at ship |
|---|---|---|
| 1/13 | `npm run build` | PASS |
| 1.5/13 | version-sequence sanity | PASS |
| 2/13 | `npx vitest run` full suite | PASS |
| 3/13 | release-notes completeness | PASS (5 files present) |
| 4/13 | CI-on-dev | BYPASSED (unpushed at ship; operator pushes post-tag) |
| 5/13 | www-bundles freshness | PASS |
| 6/13 | depth-audit | PASS (no engine advance) |
| 7/13 | CLAUDE.md auto-render | PASS (AUTO:disciplines in sync) |
| 8/13 | catalog-index drift | PASS (no catalog change) |
| 9/13 | tauri-boundary | PASS (no src/ or desktop/ change) |
| 9.5/13 | apply-to-self | PASS (no new test files w/ anti-patterns) |
| 10/13 | scaffolder-residue (NEW) | PASS (0 findings) |
| 11/13 | citation-debt-sync (NEW) | PASS (0 V-flag activity) |
| 12/13 | story-drift (NEW) | PASS (in-sync after backfill) |
| 13/13 | discipline-coverage (NEW) | WARN (31 UNCODIFIED — counter-cadence pattern absorbs) |

## Cross-references for next-session agents

If you are starting a fresh session and want to continue from v1.49.653:

1. **STATE.md** — should show milestone=v1.49.653 status=shipped after this milestone closes.
2. **`.planning/long-term-roadmap-2026-05-15.md`** — L-01 through L-05 marked as ✅ closed. L-06 remains deferred.
3. **`docs/release-notes/v1.49.653/`** — this chapter set (5 files).
4. **`docs/release-notes/STORY.md`** — preamble at 696 chapters (after T14 step 2.5 appends v653 entry).
5. **Pre-tag-gate** — 13 steps. New `SC_PRE_TAG_GATE_BYPASS=<csv>` syntax preferred over legacy `SC_SKIP_*` env vars.
6. **CLAUDE.md** — has new "Operative Disciplines" auto-rendered section. Regenerate with `npm run render:claude-md` after any `disciplines.json` change.

## Standing rules unchanged

- HARD RULE: work on `dev` branch only.
- Never commit unless explicitly asked.
- No `Co-Authored-By: Claude` trailers (pre-commit hook blocks).
- Mission packages never committed.
- Lab-director G3 authority boundary (operator-only push to main).
