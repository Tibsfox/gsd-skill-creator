# v1.49.848 — Retrospective

**Wall-clock:** ~25 min from session pickup (v847 handoff read + operator scope decision) to ship close. Within the v847-handoff-estimated 15-30 min envelope. First ship of a 9-ship campaign, so the per-ship overhead (handoff read, scope decision) is amortized; the next 8 ships will run faster.

## What went as expected

- **The handoff identified the gap with one example.** `predict-next` was named as the explicit callout. The recon broadened the scope from "1 command" to "20 commands" at session start by diffing dispatch.ts's `aliases` registrations against the help.ts text.
- **The Edit was a single block-replace of the `Commands:` block.** Topical groupings placed each new entry near related commands. No long-form sections needed; the help structure already has a "Commands" master list with one-liners and topical long-form sections after for select commands.
- **Build clean.** No test asserts help substring content (verified via grep across `src/`, `tests/`). Pure-output module; build verifies compilation.
- **Pre-tag-gate clean.** All 17 checks PASS; STORY.md drift (step 12) and PROJECT.md drift (step 17) are the expected pre-T14 warnings resolved by T14 step 2.5 + manual edit respectively.

## What I noticed

- **The gap was bigger than the handoff suggested.** `predict-next` was one of 20 missing commands. The handoff said "predict-next + other recent commands" but didn't quantify; the actual scope was 20 not 1-2. A diff-script check at the start of every help-text ship would surface the true scope without manual audit. Below-threshold observation (1 instance): consider a `tools/check-help-coverage.mjs` script that warns when `dispatch.ts` aliases lack help.ts lines.
- **Topical placement is opinionated and reviewable.** Each new entry was placed near related commands rather than appended to the end of the Commands list. The bet: discoverability benefits from grouping; mechanical reviewability suffers (the diff is harder to verify in a column-aligned text block than a clean append). The grouping won on operator UX; the diff stays reviewable because the chunk is bounded.
- **Some commands have very long descriptions even at one line.** `dacp, dp` is 80+ chars wide; `koopman-check, kc` similar. The new entries follow this style — terse but not artificially compressed. The Commands block is for discoverability, not for documentation; the long-form sections after are for that.

## What surprised me

- **The dispatch.ts handlers themselves carry usable description text in docstrings.** `predict-next.ts`, `tractability/cli.ts`, `output-structure/cli.ts`, etc. all have JSDoc headers with subcommand lists and feature-gate notes. The one-liners pulled from these docstrings produced more accurate descriptions than guessing from the alias name. Codify-candidate (below threshold, 1 instance): when writing help one-liners for missing commands, the source-of-truth is the command file's docstring, not the dispatch.ts registration line.
- **Some commands wrap subsystems with extensive subcommand surfaces.** `cartridge` has 7+ subcommands; `chip` has 4; `keystore` has 4; `coprocessor` has 4; `eval` has 1 with multiple options. The one-line entries hint at this with parenthetical subcommand lists (`Manage skill cartridges (load, validate, scaffold, eval, dedup, fork)`).
- **Help-coverage as a quality metric.** The 62/84 → 82/84 ratio is a measurable quantity. A future ship could add this as a discipline-coverage-style metric, with a ceiling-tracking pattern. Below-threshold observation (1 instance): help-coverage ratio as a tracked metric, analogous to UNCODIFIED count.

## Risk that didn't materialize

- **No render-claude-md drift.** This ship doesn't touch CLAUDE.md or disciplines.json; no regenerate needed.
- **No test regression.** Pure-output edit; tests pass as v847 close baseline.
- **No build regression.** TypeScript compiles cleanly; `npm run build` clean.
- **No T14 hiccup expected.** Single source file changed; the standard T14 sequence applies cleanly.

## Carried forward (post-v848)

NEW this ship: 2 below-threshold observations.

- **Help-coverage drift as a tracked metric** — 1 instance. The 62/84 → 82/84 ratio could be a CI-gateable quality signal. Possible future tool: `tools/check-help-coverage.mjs` that warns when `dispatch.ts` aliases lack help.ts lines. Wait for 2nd instance (likely another help-text drift detection) to disambiguate from coincidence.
- **Command docstrings as one-liner source-of-truth** — 1 instance. When writing help text for a registered command, read the implementation file's JSDoc header, not the dispatch.ts registration. Produces more accurate descriptions. Wait for 2nd instance.

Inherited from v847 close (all 5 codify-eligible candidates promoted at v847; UNCHANGED below-threshold observations carry forward):

- Full-backlog-clear codify ship pattern (v847, 1 instance)
- Fire-and-forget over awaited for observability writes (v846, 1 instance)
- Canonical-doc-decision ship pattern (v844, 1 instance)
- Verify-axis self-applicability (v843 mesh family forward-flag) — verify-overdue at ~v853
- Recent-vs-baseline-recent comparison pattern (v841, 1 instance)
- Drift-check noise as scoring-system feedback loop (v841, 1 instance)
- Codify-ship-as-recon-consolidator pattern (v840, 1 instance)
- Deferral-by-classification-ambiguity (v840, 1 instance)
- Auto-run-on-import as bootstrap-time tax (v836, 1 instance)
- Polarity convention for inverted-mechanic thresholds (v837, 1 instance)
- Bidirectional enforcement completeness (v838 + v836, 1-2 instances; ambiguous; DEFERRED v840 — UNCHANGED v848)

## Eligible for next codify ship: 0

The v847 ship cleared the eligible backlog. Post-v848 below-threshold observations are all 1-instance candidates awaiting 2nd-instance confirmation.
