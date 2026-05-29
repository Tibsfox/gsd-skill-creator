# v1.49.888 — Retrospective

## What worked

**Recipe is reusable.** Applying #10451's 7-step recipe to `token_budget.max_percent` was a near-mechanical translation of the v884 ship: copy the events module, swap the kinds + polarity prose, update the dispatcher branch and exports, add the CLI recorder, write the tests. No design decisions needed beyond polarity confirmation (matches warn-events sibling). Third application validates the recipe as STABLE.

**Separate JSONL per threshold member is correct.** Both `warn_at_percent` and `max_percent` live under the `token_budget.*` class but capture distinct operator outcomes — a `responsive` warn ≠ an `under_budget` ceiling-hit. Storing in separate JSONLs preserves the polarity + decision boundaries cleanly. Mirrors the v884 decision to keep observation-retention separate from sibling observation.* thresholds.

**Polarity alignment from prose is enough.** No new polarity ambiguity: matches the warn-events sibling and observation-retention. The #10451 polarity convention ("raise reduces fire-frequency → +1 favors lower") applied directly. Compare to v884's same-polarity check + v837's inverted-polarity ship — third instance confirms polarity diagnosis is a 30-second decision when documentation is in place.

## What didn't work

**One downstream test required a flip not covered by the recipe.** `src/bounded-learning/__tests__/audit-log.test.ts` had a frozen assertion "token_budget.max_percent unwired". The recipe's step 6 mentions dispatcher tests but doesn't explicitly call out other test files that assert on the wired/unwired flag. Caught by the full sweep on first run; one-line fix. Worth adding to the recipe's "look for assertions to flip" guidance.

## Verdict on scope

Third application of #10451 — full 7-step recipe + 1 downstream assertion flip. ~25min wall-clock. The recipe held without modification; only the polarity prose and CLI flag set differed. This validates #10451 at 3-instance STABLE evidence.

## Promotion-eligible candidates accumulated this ship

1. **`audit-log.test.ts` assertion-flip step (refinement to #10451).** When applying the read-side wire recipe, the dispatcher's wired-flag flip propagates to ANY test that asserts on `observationSource.wired` for that threshold — including audit-log tests in unrelated test files. The recipe's step 6 ("dispatcher tests with wired-flag flip") should explicitly call out: grep for `'<threshold>'.*\bwired\b` across all `__tests__/` directories. 1 instance v888 (audit-log.test.ts); promotion-eligible if a future read-side wire also surfaces this gap.

## Forward path

- **v889: Second LoaderContext chip** — `src/intelligence/atlas-indexer/file-walker.ts` (120 LOC). Continues the LoaderContext chip-down chain.
- **v890: Third LoaderContext chip** — `src/eval/calibration-adjustment-store.ts` (129 LOC).
- **v891: Substrate auto-emit for `observation.retention_days`** — closes v884 deferred half; requires building a retention-sweep substrate consumer.
- **v892+: Continue Loader chip-down + open substrate auto-emit for `token_budget.max_percent`** — the next forward path after this session's 5-ship sub-campaign.
