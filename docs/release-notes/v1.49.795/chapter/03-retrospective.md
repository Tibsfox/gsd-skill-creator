# Retrospective — v1.49.795

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 8th consecutive application since v784 codification. Read `src/anytime-valid/` (all 3 files) + `src/orchestration/anytime-gate.ts` (existing wire template) + `.claude/commands/sc/digest.md` (digest semantics) + `.claude/commands/sc/suggest.md` (acceptance-signal semantics) + `.planning/skill-creator.json` (threshold inventory) BEFORE writing any bounded-learning code. Recon surfaced (a) the `calibrate`-command collision (existing command for skill activation thresholds), (b) the `src/bounded-learning/` namespace was NOT empty (CITATION.md + two-gate/ sub-namespace already present), (c) the load-bearing math choice between one-sided and two-sided e-processes. Each of these would have cost 5-30 min mid-build had they surfaced after code landed.
- **Lesson #10422 — Verdict-pattern surface separation.** Applied to NEW-module authoring: type definitions / observation mapper / calibration driver / threshold writer / index — five separate files in `src/bounded-learning/` with single-responsibility scoping. Future ships can extend any one in isolation.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Applied to the CLI: single top-level command (no new namespace), single dispatcher entry, single help row. No reuse of the orchestration namespace despite `anytime-gate.ts` living there — the bounded-learning concern is distinct enough to warrant its own module path.
- **Lesson #10424 (newly ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied — adoption-refresh will run as T14 step 11 AFTER bump-version. The new gate this ship inherits from v794 is now load-bearing.
- **v789/v792/v793-codified mocking-at-module-level pattern.** Adapted for CLI tests: `vi.mock('@clack/prompts')` + `vi.mock('picocolors')` + real bounded-learning primitive via temp-dir fixtures. 17 CLI tests pass first run.

## What Worked

- **Math check before commit caught the two-sided-e-process insensitivity.** First draft used a single two-sided e-process; the trip-point test in `calibration-loop.test.ts` would have failed silently (evidence trapped near 1 regardless of skew). Computing `cosh(λ) · exp(−λ²/2) ≤ 1` for `|x| = 1` mid-write surfaced the structural blocker. Switching to two one-sided e-processes at Bonferroni α/2 each is the textbook fix; trip-point at ~10 unanimous observations validates the math. Pattern: when working with bounded-domain martingales, run the trip-point math by hand BEFORE writing the test fixture.
- **Recon caught the existing `calibrate` command before naming the new one.** First instinct was to name the new CLI `calibration-check` (mirror the `*-check` verdict pattern). Recon found `src/cli/commands/calibrate.ts` already lives at the namespace tip (for skill activation threshold). Renamed to `bounded-learning` / `bl` — collision-free and self-descriptive.
- **Real-integration CLI test over mock-the-module.** The unit tests already exhaustively cover the primitive; the CLI tests use temp-dir fixtures + real bounded-learning to verify integration end-to-end. This catches arg-parsing bugs that pure mock-the-module tests would miss. 17/17 pass first run.
- **Concurrent-edit refusal in the writer.** If the operator manually edits `.planning/skill-creator.json` between recon and `--apply`, the writer refuses with a clear "Concurrent edit detected" message and the recommendation's expected `currentValue`. Pattern: any optimistic writer should compare on-disk-now vs read-then.
- **Atomic write via rename-from-tmpfile.** `applyRecommendation` writes to `<path>.tmp-<pid>-<timestamp>` then `rename()`s atomically. A crash mid-write leaves the original file intact. Standard pattern; first time used in this codebase outside of the existing release-history tools (per recon).
- **Recommendation includes `reason` string suitable for operator display.** The CLI's text-mode output renders the reason verbatim; JSON output exposes it as a structured field. No second post-processing layer needed to make the recommendation actionable.

## What Could Be Better

- **The `FlagLookup` discriminated union is now in 4 CLI commands** (koopman-check, coherent-check, hourglass-check, bounded-learning). The v793 retrospective flagged the extract-to-`src/cli/lib/flag-lookup.ts` opportunity; this ship adds a 4th copy without extracting. Cost-of-deferral is ~5 min per future CLI; the extract is ~15 min. Future ship should bundle the extract.
- **Single-step adjustment may be too conservative for high-evidence cases.** If 50 unanimous accepts trip rejection, the recommendation is still `currentValue − 1`. A more sophisticated step rule (e.g. step proportional to evidence margin) would close the loop faster. Out of scope for ship 1; revisit in ship 2-3 once real data accumulates.
- **No audit log of loop runs.** Every CLI invocation produces a recommendation, but there's no persistent record of `(timestamp, threshold, observations, decision, applied)`. After-the-fact accountability requires reading session retros or shell history. Ship 2 candidate: add `.planning/patterns/bounded-learning-log.jsonl` (append-only).
- **CLI doesn't surface alpha/lambda defaults in --help.** The defaults (α=0.05, λ=0.5) are documented in the source but not echoed in `--help` output. Minor surface gap.
- **Bonferroni correction is implicit, not documented in --help.** The CLI accepts `--alpha 0.05` but internally splits to α/2 per side. Operators reading `--help` would see "α=0.05" and not realize each side runs at 0.025. Add a one-liner: "α is split across two one-sided e-processes (Bonferroni)."

## Surprises

- **Pre-existing `src/bounded-learning/` namespace.** Recon assumed `src/bounded-learning/` was empty (T1.1 wedge described as "wire `sc:digest` acceptance signal into `src/anytime-valid/`"). It was not: `CITATION.md` + `two-gate/` sub-namespace + `__tests__/citation-pin.test.ts` already lived there. The pre-existing work appears to be a separate sub-project (JP-003 BLOCK Phase 830 per the citation-pin test). The new files coexist cleanly — top-level peers alongside the `two-gate/` subdir. Pattern lesson: never assume an empty namespace; `ls` first.
- **The two-sided e-process limitation is fundamental, not implementation-specific.** Initially assumed it could be fixed by tuning λ. The math (`tanh(λ) = λ` has only the trivial solution at λ=0) proves no λ rescues it. This is a basic-but-easy-to-miss fact about cosh-based martingales on bounded-domain observations; worth codifying for future calibration-loop authors.
- **`bounded-learning-empirical` adjacent module is `test-only`.** Adoption-scan surfaces a second module name (`bounded-learning-empirical`) with 0 real callers and 9 test importers. Potentially a future shelfware candidate, or future wire site for the calibration loop. Out of scope for v795; flag for adoption-scan watchlist.
- **Smoke test against real config produces a coherent zero-data response.** The CLI runs end-to-end against the real `.planning/skill-creator.json` (no suggestions.json present) and produces a clean `direction: hold` + `observations: 0` + `applied: noop` JSON output. The graceful-empty-data path was important to verify before declaring ship 1 done.

## Lessons applied at v1.49.795 (from v1.49.794 and earlier)

- **#10412** (recon-first) — applied. 8th consecutive application.
- **#10415** (deferred-maintenance) — N/A this ship (no escalated wedges in the path).
- **#10417** (test harness `spawnSync`) — applied prophylactically; CLI tests use in-process vi.spyOn, no subprocess shell.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied to module + CLI authoring.
- **#10424** (Adoption-refresh AFTER bump) — applied; gate inherited from v794.

## Lesson candidate emitted this ship

**#10425 candidate — Two-sided e-processes on bounded |x|=1 observations are insensitive to unanimous direction.**

- **Surface:** Authoring an anytime-valid calibration loop on binary or near-binary observations.
- **Evidence:** `cosh(λx) · exp(−λ²/2) ≤ 1` for `|x| = 1` and all `λ > 0`; maximum at `λ = 0` (trivial). No two-sided e-process on bounded binary observations can grow.
- **Mitigation:** Use two one-sided e-processes at Bonferroni α/2 each, one per direction. This is the textbook design for this regime.
- **Status:** Candidate (one instance — this ship). Promotion path: ESTABLISHED at the next codification ship, OR at the next bounded-learning ship that re-applies the pattern (would be a 2nd-instance forward-shadow). Codifies inside the Static-analysis tool authoring discipline OR a new Bounded-learning discipline if more lessons accumulate.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every new-module authoring.
- **#10425 candidate** (two-sided-on-binary insensitivity) — apply at every binary-observation calibration design.
- **FlagLookup extract** — non-lesson, just a refactor opportunity now at 4 copies.

## Verdict on T1.1 ship 1 scope

The "primitive + CLI + suggestions.json reader + threshold-update writer" scope (option 3 of the AskUserQuestion) landed in one ship at ~75 min wall-clock from start of recon to T14 ship sequence ready. That's the higher end of the estimate from the previous handoff (~60-90 min) — within window. Ship 1 produces a complete vertical: read → compute → write. Ship 2 has freedom to extend horizontally (more thresholds) or deepen vertically (audit log, watch mode, status integration). The architectural shape is in place.
