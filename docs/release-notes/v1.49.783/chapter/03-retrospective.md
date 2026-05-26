# v1.49.783 — Retrospective

## decisions

- **Tolerant generators over strict-frontmatter requirements.** Two paths existed for closing the C6 failure: (a) make generators tolerant of missing optional fields (skip-line, no `UNKNOWN`), or (b) require complete frontmatter and error out when fields are absent. Chose (a) because hand-authoring is the realistic pattern (operators write the human-readable body, then run the normalizer to canonicalize). A required-fields gate would push friction onto the wrong side of the trade-off — the body already carries the information; the normalizer should be able to back-fill or skip.

- **Line-walking helper over patched regex.** Three approaches considered for the `\Z` bug: (a) replace `\Z` with `$(?![\s\S])` (regex idiom for end-of-input), (b) split-by-heading-and-rejoin, (c) line-walking helper. Picked (c) — most readable, no regex pitfalls, easy to test the Z-in-prose regression directly. The cost is a function definition; the win is reading-clarity for the next operator who touches this file.

- **Blank line after the closing `---` for readability.** The previous normalizer collapsed any leading blank line in the body; hand-authors naturally add one for readability between frontmatter and body. The fix preserves the operator's intent by emitting `---\n\n${body}`. Required updating one fixture in `state-md-normalizer-prose.test.mjs` to match the new canonical form.

- **`predecessor.counter_cadence ?? false` retained.** Briefly tried making this field strictly optional (skip-line when absent) to match the broader tolerance principle, but it broke 1 existing prose-test fixture that didn't specify the field. The default-to-false behavior is correct: most milestones are not counter-cadence; the line carries load-bearing information; existing fixtures match. Kept the historical default.

- **One atomic commit for the full normalizer fix + 5 new tests.** Considered splitting into per-bug commits (Shipped emission, UNKNOWN tolerance, Z-strip, fixture-blank-line) but the changes are tightly coupled — together they close one test and one operator pain point. STRUCTURALLY UNIFORM → batched per v780+v781+v782 discipline.

## surprises

- **The C6 test failed for at least one milestone, possibly more.** Confirmed pre-existing at v781 ship tip `6337fad53`. The "STATE.md normalizer needs 2× --write" memory note in operator memory has been load-bearing since v637 (per the in-source comment at `state-md-normalizer.mjs` ~line 150). The normalizer has been broken in subtle ways for ~5 months. The fix is small; the deferred-maintenance debt was the actual cost.

- **STATE.md had drifted to include 5 stale top-level keys.** `shipped_at_tag`, `predecessor_tag`, `predecessor_nasa_degree`, `last_activity`, `path` — none in the schema, none used by tooling, all accumulated from hand-authoring across recent ships. Removed during the repopulation.

- **The full-suite test count went UP by ~572 after the fix.** Several `runIf(STATE_MD_AVAILABLE)` and similar guards in the integration tests were silently skipping when STATE.md was in a drifted state. With STATE.md now clean, those tests run. From 29,743 passing to 30,315 passing.

- **`.planning/STATE.md` is gitignored, so this ship leaves no commit for the STATE.md repopulation.** The working-tree state is the deliverable; the next operator's first session will see the clean STATE.md and not have to hand-author it.

## process

- **Wall-clock:** ~45 minutes end-to-end (investigation ~10m + generator fixes ~10m + stripSection helper ~5m + new T5 tests ~10m + STATE.md repopulation ~5m + ship ~15m). Under the handoff's ~30min estimate by ~15 minutes; over by ~15 minutes total — the investigation and STATE.md repopulation took marginally longer than expected.
- **Commits:** 1 pre-ship (fix + tests) + 1 ship + 1 post-ship RH.
- **Push events:** 4 (push dev + push tag + push main; post-ship push dev + push main).
- **TS test runs:** 4 (per-bug targeted vitest subsets + 1 full-suite + 1 typecheck).
- **Full-suite vitest:** 1 (30,315 pass / 0 fail / 39 skip / 7 todo). C6 failure CLOSED. 0 regressions.
- **`SC_SELF_MOD=1` or `SC_FORCE_ADD=1` overrides:** 0. No hook touches this ship.
- **Errors:** 1 minor — when restoring `predecessor.counter_cadence ?? false` defaulting, one prose-test fixture needed a blank-line adjustment. ~2 minutes lost.
