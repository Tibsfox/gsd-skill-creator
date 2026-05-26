# Retrospective — v1.49.792

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** Applied. Read `src/koopman-memory/index.ts` + `koopman-operator.ts` + `invariants.ts` + `settings.ts` + `types.ts` + existing `src/cli/commands/dacp-drift-check.ts` + `src/cli/dispatch.ts` before writing any new code. Surfaced: (1) koopman-memory has the same architectural shape as semantic-channel (HARD-preservation gate + `import type`-only adapter + advisory-only invariants), making the v789 dacp-drift-check files a near-direct template; (2) no existing `memory` CLI namespace, so the lightest wire is a top-level command not a subcommand; (3) `--state-dim` defaulting to `DEFAULT_STATE_DIM` gives a zero-arg smoke check while keeping flag granularity. ~5 min recon → ~25 min build.
- **Lesson #10417 — Test harnesses use `spawnSync`, not `execSync`.** Applied prophylactically — the new `koopman-check.test.ts` is a vitest unit test (no subprocess shell at all), but the mock-at-module-level pattern still avoids the WARN-on-exit-0 trap by construction.
- **Lesson #10422 — Verdict-pattern surface separation.** Applied: this ship touches `src/cli/commands/koopman-check.{ts,test.ts}` + `src/cli/dispatch.ts` + `src/cli/help.ts` (the wire surface), `docs/SHELFWARE-VERDICTS.md` (the decision ledger), and `.planning/PROJECT.md` (the project-state surface). The source module at `src/koopman-memory/` is byte-untouched. Each surface evolves independently.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Applied — the WIRE is a single top-level CLI command. Considered + rejected: a `memory` namespace dispatcher (would have added ~30 lines for dispatcher + subcommand routing for no immediate value — promotable to namespace later if more koopman-related subcommands appear).
- **Lesson #10424 candidate (from v791) — Adoption-refresh AFTER bump.** Applied: did NOT run `adoption-report:refresh` before bumping to v792 this time. The discipline carried forward correctly across one ship interval. Forward signal: prose-in-handoff signaling can hold for short intervals but is fragile across multiple ships; codifying the constraint into a gate is still the right answer.

## What Worked

- **The dacp-drift-check.{ts,test.ts} pair was an almost-direct template.** Both modules share the architectural pattern (HARD-preservation gate + advisory-only invariants + `import type`-only adapter). The CLI command file's structure (help → helpers → entry-point → three output tiers) ported essentially unchanged. The test file's mock-at-module-level pattern ported unchanged. The dispatcher integration ported unchanged (top-level entry instead of subcommand routing).
- **First-try-after-one-fix test pass.** 21/22 passed on first run; one TS-correct-but-test-expects-different edge case (the "flag with no value at end of args" path silently fell back to default). Fixed with a cleaner `FlagLookup` discriminated union (`{present: false}` vs `{present: true, value: string|null}`) that lets the command distinguish "flag absent" from "flag present without value." 22/22 pass on second run. Net iteration cost: ~3 min.
- **Adoption-scan flip verified immediately.** Running `node tools/adoption-scan.mjs --json` after the wire showed `koopman-memory: status=living, realCallerCount=1, cliImporters=['src/cli/commands/koopman-check.ts']` — exactly the expected outcome.
- **The discriminated-union FlagLookup pattern is cleaner than the v789 `string | null` approach.** v789's `getFlagValue` returns `string | null`, where `null` conflates "flag absent" and "flag present at end with no value." v792's version distinguishes them, which produces clearer error messages (`'<missing>'` vs the raw value). Worth migrating dacp-drift-check at a future ship if it ever needs the distinction.
- **No `--bundle`-equivalent required argument.** v789's `dacp-drift-check` required `--bundle <path>` to run; v792's `koopman-check` has a sensible zero-arg default (identity operator at `DEFAULT_STATE_DIM`). The zero-arg path is a useful smoke check for operators wondering "does this module work at all?" — lower friction than v789's required-flag posture.

## What Could Be Better

- **The `FlagLookup` discriminated union should be a shared utility.** The pattern is duplicated now (one inline copy in `koopman-check.ts`). Future CLI commands will want it. A `src/cli/lib/flag-lookup.ts` (or extension to existing `src/cli/lib/args.ts` if it exists) would prevent N future copies. Deferred — out of scope for a verdict ship.
- **Test count grew but coverage scope didn't.** 22 tests of which 8 are argument-handling (3 testing different invalid `--state-dim` values: `abc`, `0`, `-3`). The N×N coverage of "invalid value patterns × per-flag" matrices is fine but probably over-tested for an advisory-only CLI. Pattern observation: verdict-ship CLI tests are leaning toward 20-25 tests/file; might be worth establishing a target ceiling.
- **Help text doesn't mention `--state-dim` default.** The `--help` output lists `--state-dim <N>` with parenthetical default; the per-output-tier reports don't echo back which value was used unless `--json` is requested. Minor — operators can re-run with `--json` if they care.

## Surprises

- **The "lightest wire" turned out to be lighter than v789's.** v789 needed a `dacp` namespace dispatcher edit (one more file touched) because `drift-check` was a subcommand. v792's top-level command needed only `src/cli/dispatch.ts` (one entry) + `src/cli/help.ts` (one line). Smaller blast radius for the SAME verdict outcome (`status: living`). Suggests that for greenfield wires (no parent namespace exists), top-level commands are strictly cheaper than creating a new namespace just to hold one subcommand.
- **`koopman-memory` has NO companion substrate doc** (unlike `wasserstein-hebbian` which has `docs/substrate-references/wasserstein-hebbian.md`). The module's own JSDoc carries the substrate-level documentation inline. Either pattern is fine; the asymmetry between sibling Math Foundations Refresh modules (some have separate substrate docs, some don't) is the operator's choice and the verdict-pattern handles both.
- **Wall-clock came in slightly over v789's.** v789 was ~23 min; v792 was ~25 min including the FlagLookup re-iteration. The marginal cost of "second instance of a pattern" is real but small (~10%) — the v789 template provided the structural answer; v792's marginal work was the test-failure-fix loop + the natural extra recon on a different module.

## Lessons applied at v1.49.792 (from v1.49.791 and earlier)

- **#10412** (recon-first) — applied. 5th consecutive application since v784 codification.
- **#10417-#10421** (Static-analysis tool authoring) — N/A this ship; not a static-analysis tool authoring ship.
- **#10422** (Verdict-pattern surface separation) — applied: 3 surfaces touched independently.
- **#10423** (Lightest wire that satisfies the verdict) — applied: top-level CLI command (no namespace overhead).
- **#10424 candidate** (adoption-refresh-after-bump) — applied: did not trip the v791 anti-pattern.

## Lesson candidate emitted this ship

None. All disciplines applied cleanly; no new pitfalls surfaced.

## Open lessons watchlist (apply at next opportunity)

- **#10422–#10423** (Shelfware verdict patterns) — apply at the next verdict ship.
- **#10412** (recon-first) — apply at every session start with a handoff document.
- **#10424 candidate** (adoption-refresh-after-bump) — still candidate; awaits second instance OR a migration to a deterministic gate.
