# v1.49.950 — Summary

## The ship

Item 3 (final) of the post-v1.49.947 "1 2 3" batch: make `skill-creator cadence` a true gate by machine-tracking the SECOND conjunct of every overdue trigger ("`>=10` ships since the axis last advanced"), which v1.49.947 deliberately left operator-tracked.

## What shipped

- **`cadence_advances` frontmatter convention** — a release-notes README declares which axes its ship advanced (e.g. `cadence_advances: [consume]`). The most recent ship tagging an axis anchors its ships-since count.
- **`readAxisAdvances(releaseNotesDir)`** — semver-sorts `vX.Y.Z` dirs, reads the markers, returns per-axis `{ lastVersion, shipsSince }`. Untagged axis -> absent (unknown).
- **`overdue` status + `shipsSinceUpgrade`** — a first-conjunct `candidate` with `>=CADENCE_SHIPS_SINCE_CONJUNCT` (10) ships since its anchor becomes `overdue`. Unknown or `<10` -> stays `candidate`. `not-overdue`/`manual` never upgrade.
- **`--check` is a true gate** — fires (exit 1) only on `overdue`; `candidate` is advisory (exit 0). Deliberate shift from v1.49.947 (which fired on any candidate).
- **`shipsSince` / `lastAdvanceVersion` in `data`, `[OVERDUE]` tag, `overdueCount` in JSON.**
- **Seeds** — the two genuine consume ships v1.49.944 + v1.49.946 are tagged `[consume]` (honoring #10461: a producer for the new reader). v950 self-tags nothing (it advances none of the four axes).
- **`docs/meta-cadence-discipline.md`** — "Honest limit" rewritten as "Second conjunct (machine-tracked at v1.49.950)".

## Honest live behavior

- consume: anchored at v1.49.946, ships-since shown — but first conjunct unmet (0 unwired) -> `not-overdue`.
- verify: `candidate` (3 suggestions.* uncovered) with ships-since UNKNOWN (no verify advance tagged) -> stays candidate; the detail says how to enable detection.
- Nothing is `overdue`; `--check` exits 0. The gate is wired and fires the moment a tagged axis's first conjunct is met with `>=10` ships since.

## Verification

- tsc clean; `cadence.test.ts` 35/35 (23 prior + 12 new). Affected scope (cli + bounded-learning) 916/916.
- Mutation-proven: `>=10` -> `>10` keeps `shipsSince=10` at `candidate`, failing the overdue test.
- Focused adversarial review (see 03/99).

## Engine state

NASA 1.178 (unchanged), counter-cadence **24** (unchanged — a `feat`), manifest **151** (unchanged — completes the meta-cadence tool; applies #10428 / #10461 / #10427; promotes no lesson).
