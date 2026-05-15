# v1.49.653 — Long-Term Roadmap + Audit Closure

**Released:** 2026-05-15
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree)
**Predecessor:** v1.49.651 STS-41-G Challenger (v1.49.652 STS-51-A Discovery already shipped 2026-05-13; v1.49.653 is the first counter-cadence milestone post-eight-degree-sprint)
**Source vision:** `.planning/long-term-roadmap-2026-05-15.md` (this session) + `.planning/codebase/CONCERNS.md` (2026-05-15 refresh)
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

v1.49.653 ships the **second counter-cadence operational-debt milestone** in the engine, six months after v1.49.585's first wave. The work was driven by a same-day audit of `.planning/codebase/CONCERNS.md` plus systematic closure of the 6-item long-term roadmap (L-01 through L-05 — L-06 deferred).

**The session shipped 5 categories of work:**

1. **Hygiene hardening** — `.gitignore` + `git-add-blocker.js` extended to cover `.env`, `.gsd/`, `.chipset/`, and `project-claude/hooks/.log/`. STORY.md preamble + backfill of 8 missing entries v645–v652. MUS/1.61 placeholder PNGs replaced with valid 1×1 transparent PNGs. New `tools/diagnostics/list-daemons.sh` + `tools/restore-from-live.sh`. `tools/render-claude-md.mjs --diff` mode added.
2. **L-01 — observer-agent retirement** — vestigial `passive-monitor`-style stub agent retired across 7 dependency sites (manifest, install.cjs, gsd-init.ts setup-check, topology-collector test fixture, agents.json, source-of-truth + installed copies). Phase 87 implementation at `src/integration/monitoring/scanner.ts` is what actually runs.
3. **L-02 — pre-tag-gate consolidation** — replaces 15 ad-hoc `SC_SKIP_*`/`SC_REQUIRE_*` env vars with `SC_PRE_TAG_GATE_BYPASS=<csv>` + `SC_PRE_TAG_GATE_REQUIRE=<csv>`. Legacy vars honored with deprecation warning for one milestone cycle. Step labels migrated `X/9` → `X/13` to cover the 4 new gates added this session.
4. **L-03 — citation-debt auto-mutation** — formal markdown syntax (`### V-flag emit/close/state:`) for retrospective authors, `tools/citation-debt/scan-retrospectives.mjs --write-diff` parser, `tools/citation-debt/apply-diff.mjs` interactive applicator with operator confirmation + backup. T14 step 2.6 documented. Round-trip tested end-to-end against synthetic fixtures.
5. **L-04 — discipline-as-data scaling** — curated 8-domain manifest at `tools/render-claude-md/disciplines.json` + auto-rendered checklist in CLAUDE.md (under new "Operative Disciplines" heading) + `tools/check-discipline-coverage.mjs` audit that classifies 95 lesson IDs into COVERED (6) / PARTIAL (10) / UNCODIFIED (31) buckets. Closes the "future agent re-introduces closed-by-discipline issue" risk.
6. **L-05 — performance benchmarks** — vitest bench infra (`vitest.bench.config.mjs` + `npm run bench` + `npm run bench:check`) + initial bench suites for `detectDois()` and `extractCitations()` end-to-end pipeline at small/medium/large input sizes. Baseline JSON committed. 15% regression threshold tuned for run-to-run variance.

**Pre-tag-gate now at 13 steps.** v1.49.601 added step 8 (catalog-index), v1.49.634 added step 9 (tauri-boundary), v1.49.636 added step 9.5 (apply-to-self), v1.49.653 added steps 10 (scaffolder-residue), 11 (citation-debt-sync), 12 (story-drift), 13 (discipline-coverage). All four new steps either BLOCKER (10) or WARN-only with escalation flag (11, 12, 13).

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone.** Engine remains at NASA 1.116 / MUS 1.116 / ELC 1.116 / SPS #113 / TRS pack-38 (v1.49.652 close).
- **No new external citations.**
- **No new V-flags emitted.** The 9 carry-forward V-flags from v1.49.584 remain in `.planning/citation-debt.json`. The scan-retrospectives audit ran clean across 68 retrospectives (v1.49.585 → v1.49.652).
- **Second counter-cadence cleanup milestone** — first was v1.49.585 (Apr 28, 6 weeks ago). The pattern is now established: a counter-cadence ship every ~60 forward-cadence milestones, scoping operational-debt closure between substrate-content advances.
- **First milestone to formally close a long-term roadmap.** L-01 through L-05 were sized in `.planning/long-term-roadmap-2026-05-15.md` earlier this session and all closed in the same session (vs the original 6-milestone estimate).
- **Three stale CONCERNS findings empirically closed.** §8 (run-with-pg.mjs hardcoded path), §13 (ELC vs MUS regex drift), §16 (bounded-tape framing tests) all turned out to be already-shipped at v1.49.585 but flagged as open in the 2026-05-15 codebase mapping. Documented in `.planning/concerns-addendum-2026-05-15.md`.

## Threads closed / opened / extended

- **OPENED:** discipline-as-data manifest as auto-rendered CLAUDE.md section (8 domains, 12 indexed lessons, 31 uncodified gaps surfaced for future codification).
- **OPENED:** vitest bench infrastructure + first 6 benchmark slots (2 modules × 3 sizes).
- **OPENED:** consolidated pre-tag-gate bypass/require vocabulary (15 step-name tokens — `build`, `version-sequence`, `vitest`, `completeness`, `ci-gate`, `www-bundles`, `depth-audit`, `claude-md`, `catalog-index`, `tauri-boundary`, `apply-to-self`, `scaffolder-residue`, `citation-debt-sync`, `story-drift`, `discipline-coverage`).
- **CLOSED:** observer-agent vestigial layer (Phase 87 shipped in v1.11; agent retired across 7 sites).
- **CLOSED:** citation-debt manual-update gap (scan + apply pipeline now wired; T14 step 2.6 documented).
- **CLOSED:** STORY.md 8-degree latent drift (v645–v652 backfilled; recurrence-prevention gate added as step 12).
- **CARRY-FORWARD:** all v1.49.652 engine states (NASA 1.116, MUS 1.116, ELC 1.116, SPS #113, TRS pack-38).
- **DEFERRED:** L-06 (Research-CSV schema-stability) — schemas have been stable across 695 milestones; no active incident has surfaced. Will be scheduled when triggered by a real schema-change event.

## Forward lessons emitted

5 new lessons #10260–#10264 (see `chapter/04-lessons.md`):
- #10260 — counter-cadence milestone cadence sustainability (first counter-cadence at ~60-forward-milestone interval after v585 origin)
- #10261 — long-term roadmap closure in a single session is possible when the roadmap is well-scoped (5 of 6 items closed; one operator decision = `L-01` removal completed inline)
- #10262 — empirical-state verification finds stale CONCERNS findings (3 of 26 §-items were already-shipped; codebase mapping process should re-verify against current source)
- #10263 — formal-block markdown syntax beats LLM extraction for ledger automation (L-03 round-trip works with strict regex; no LLM-classification heuristics needed)
- #10264 — discipline-as-data manifest curation surfaces real gaps (31 UNCODIFIED lessons detected on first scan — proves the audit dimension was real, not just theoretical)

## Component map

| # | Component | Type | Files |
|---|---|---|---|
| 1 | `.gitignore` + `git-add-blocker.js` hygiene hardening (CONCERNS §2.3, §7.4) | feat(hooks) | 3 files |
| 2 | Observer agent retirement (L-01) | refactor | 6 files (1 delete + 5 source-of-truth) |
| 3 | STORY.md backfill + `tools/check-story-drift.mjs` | docs(release-notes) | 2 files |
| 4 | Pre-tag-gate consolidation (L-02) + 4 new gate steps | feat(pre-tag-gate) | 5 files |
| 5 | Citation-debt auto-mutation (L-03) | feat(citation-debt) | 4 files (syntax doc + scan extension + apply tool + T14 step 2.6) |
| 6 | Discipline-as-data (L-04) | feat(disciplines) | 4 files (manifest + renderer + CLAUDE.md + audit tool) |
| 7 | Vitest bench infrastructure (L-05) | feat(bench) | 6 files (config + harness + 2 suites + tooling + npm scripts) |
| 8 | Misc tooling (CONCERNS §22, §24.4, §21.2) | feat(tools) | 4 files (list-daemons, restore-from-live, render --diff, scaffolder-residue) |

## Verification

```bash
# All 7 new gates exit 0:
node tools/check-scaffolder-residue.mjs            # → 0
node tools/citation-debt/scan-retrospectives.mjs --since v1.49.652  # → 0
node tools/check-story-drift.mjs                   # → 0
node tools/render-claude-md.mjs --diff             # → 0 (in sync)
node tools/check-discipline-coverage.mjs           # → 0 (WARN-only)
node tools/bench/check.mjs                         # → 0 (baseline matches)
bash tools/pre-tag-gate.test.sh                    # → 19/19 passing
```

## Mission tracking

This milestone does NOT carry a `.planning/missions/v1-49-653-*/` package. Work was driven by:
1. Same-day codebase audit (`.planning/codebase/CONCERNS.md` 2026-05-15 refresh).
2. Long-term roadmap planning doc (`.planning/long-term-roadmap-2026-05-15.md`).
3. Three additional planning memos (`citation-debt-audit-2026-05-15.md`, `fa-652-11-drift-survey.md`, `todo-scaffold-audit-2026-05-15.md`, `concerns-addendum-2026-05-15.md`).

All planning artifacts are gitignored under `.planning/`. Future operators should consult them for context but should NOT expect them to be tracked in repo history.
