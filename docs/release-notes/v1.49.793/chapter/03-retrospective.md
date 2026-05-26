# Retrospective — v1.49.793

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** Applied — 6th consecutive application since v784 codification. Read both modules' index.ts + types.ts + key function signatures + an existing test fixture (`integerCategory()` from `discrete-bundles-integration.test.ts`) before writing any CLI code. Surfaced: `emitFinding(indices, holes, threshold)` signature (NOT `(dag, options)` — saved one runtime error), `Category<O>` shape from test fixtures (replicated in `integerCategory()` helper).
- **Lesson #10422 — Verdict-pattern surface separation.** Applied: 3 surface classes touched independently — CLI surface (2 commands + 2 tests + dispatcher + help), decision surface (SHELFWARE-VERDICTS.md +2 rows), project-state surface (PROJECT.md). Source modules at `src/coherent-functors/` and `src/hourglass-persistence/` are byte-untouched.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Applied: both verdicts are top-level CLI commands (no namespace overhead, no in-loop wires), each importing the module's public API. The lightest possible WIRE that flips `status: living`.
- **Lesson #10424 candidate — Adoption-refresh AFTER bump.** Applied — did NOT trip the v791 anti-pattern. Three sequential applications now (v792, v793, v793-coverage). Still candidate; the prose-in-handoff signaling continues to hold but the deterministic-gate migration remains the right forward improvement.
- **v792-codified mocking-at-module-level pattern.** Applied to both new test files. Avoids any fixture-bundle setup; mocks `vi.spyOn(console, 'log')` to capture output. 17 + 20 tests = 37 total; all pass on first run.

## What Worked

- **Building 2 CLIs in parallel was less than 2x the cost of building 1.** v792 koopman-check took ~25 min; v793 coherent-check + hourglass-check took ~30 min total (~15 each). Pattern reuse compounds: the second CLI was a near-mechanical port of the first with module-specific function names and a different default-fixture. The 30/50 estimate from the AskUserQuestion was a slight under-estimate of the parallelization savings.
- **`integerCategory()` helper from test fixtures was a direct lift.** No design work needed — read the test fixture, replicated the shape inline. Saved 10-15 min vs designing a CLI-specific Category implementation.
- **Three canonical fixtures for hourglass-check is more useful than one.** `--shape hourglass` gives the textbook waist case; `--shape chain` gives the no-waist control; `--shape empty` exercises the degenerate-graph branch. Operators get a 3-point comparison without needing to wire in arbitrary DAGs.
- **First-try test pass on both modules.** 17/17 + 20/20 = 37/37 PASS first run. Mocking-at-module-level + the v789/v792 template eliminated the iteration cycle. v792 needed one fix (FlagLookup discriminated union); v793 reused that FlagLookup pattern from the start.
- **Recon caught the `emitFinding(indices, holes, threshold)` signature.** First CLI draft called `emitFinding(dag, {waistThreshold: threshold})` (guessing from the v789 pattern); ~30s of grep on `^export function emitFinding` surfaced the real signature `(indices, holes, threshold)`. Saved a runtime error at test time. Recon-first paid off again.
- **Cluster closure produces clean state.** After v793, the Math Foundations Refresh open-candidate roster is gone. The SHELFWARE-VERDICTS.md verdict table is the single source of truth for the cluster's 6 modules. No "remaining work" carries forward into v794+ for this cluster — the engine has cleared.
- **Adoption-baseline diff produces 2 lines for the first time.** v789 = 1 line, v792 = 1 line, v793 = 2 lines (both `coherent-functors` + `hourglass-persistence`). The refresh tool handled multi-module diffs cleanly without iteration.

## What Could Be Better

- **No shared FlagLookup utility yet.** The pattern is now duplicated across `koopman-check.ts`, `coherent-check.ts`, `hourglass-check.ts` (3 copies). Next CLI command (or next ship that wants to refactor) should extract to `src/cli/lib/flag-lookup.ts`. Cost-of-deferral is low (~5 min per future CLI) but accumulating.
- **Three canonical fixtures live inline in `hourglass-check.ts`.** Each is ~15 lines. If a future ship wants to expose more shapes (Y-graph, K_3, etc.) the inline list will get unwieldy. Could extract to `src/hourglass-persistence/__fixtures__/canonical-dags.ts` — out of scope for a verdict ship.
- **The `coherent-check` `integerCategory()` helper duplicates test-fixture code.** Same shape exists in 2 test files. Could extract to `src/coherent-functors/__fixtures__/categories.ts` — out of scope for a verdict ship.
- **Help text doesn't echo defaults in the report itself.** Same minor gap noted in v792 — operators see `--state-dim 8` in `--help` but the text-mode output doesn't re-state which value was used unless `--json` is requested.
- **No timestamp in the verdict ledger.** SHELFWARE-VERDICTS.md rows have `Ship` column (v789, v791, etc.) but no calendar date. The release-notes carry the date; cross-referencing requires a second lookup. Could add an `Emitted` column — out of scope.

## Surprises

- **Cluster closed in 6 ships across 4 calendar days.** v789 (2026-05-26 first WIRE) → v793 (2026-05-26 cluster close) all shipped same calendar day during the AUDIT-2026-05-26 Tier 1 push. The verdict-pattern lifecycle scales fast when the pattern is codified.
- **Final distribution: 4 WIRED + 2 ALLOWLISTED + 0 RETIRED.** The 0-RETIRED count is itself signal: every flagged module turned out to be intentional substrate, just at different points in the substrate-to-application gradient. WIRE candidates had natural advisory-only public APIs; ALLOWLIST candidates had operator-filtered surfaces (SoPS) or substrate-doc backing (wasserstein-hebbian). RETIRE never materialized as the correct answer for any of them. May indicate the v569 Math Foundations Refresh was well-scoped — no actual code waste, just substrate built ahead of its wire sites.
- **Parallel-CLI builds compound pattern-reuse.** v793's two CLIs took ~30 min total (~15 each); v792's solo CLI took ~25 min. The marginal cost of the SECOND CLI in the same ship was effectively ~5 min over the first CLI's cost. Suggests parallel verdict ships scale well — 4-5 simultaneous WIRES per ship would be feasible if a future cluster has that many candidates with matching shapes.
- **`hourglass-check`'s `--shape empty` fixture works.** Degenerate graphs (0 vertices, 0 edges) flow through the entire pipeline (`detectHoles` returns `[]`, `computeContractionIndices` returns `[]`, `aggregateContractionIndex` returns 1, `emitFinding` returns `type: healthy`). Useful smoke check that the module handles empty inputs without crashing. No additional test needed beyond the existing `--shape empty` argument-handling test.

## Lessons applied at v1.49.793 (from v1.49.792 and earlier)

- **#10412** (recon-first) — applied. 6th consecutive application.
- **#10417-#10421** (Static-analysis tool authoring) — N/A this ship.
- **#10422** (Verdict-pattern surface separation) — applied: 3 surface classes touched independently.
- **#10423** (Lightest wire that satisfies the verdict) — applied: 2 top-level CLI commands (no namespace overhead).
- **#10424 candidate** (adoption-refresh-after-bump) — applied: did NOT trip the anti-pattern (3rd sequential clean application).

## Lesson candidate emitted this ship

None. All disciplines applied cleanly; no new pitfalls surfaced.

## Open lessons watchlist (apply at next opportunity)

- **#10422–#10423** (Shelfware verdict patterns) — apply at the next shelfware verdict ship (out of scope for the next several ships now that the v572 cluster is closed; will re-engage if/when a new shelfware cluster surfaces).
- **#10412** (recon-first) — apply at every session start with a handoff document.
- **#10424 candidate** (adoption-refresh-after-bump) — still candidate; ripe for promotion-to-ESTABLISHED at next codification ship.
