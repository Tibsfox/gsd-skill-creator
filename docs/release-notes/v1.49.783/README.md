# v1.49.783 — STATE.md Normalizer Fix (Deferred-Maintenance Wedge)

**Released:** 2026-05-26
**Type:** forward-cadence deferred-maintenance milestone (NOT a NASA degree advance, NOT counter-cadence)
**Predecessor:** v1.49.782 — Tier E Architecture: LoaderContext Security Chokepoint
**Engine state:** UNCHANGED (NASA degree sustains at 1.177)
**Wedge:** Path B (~30min wedge) from the v782 handoff — close the long-standing C6 STATE.md normalizer test failure

## Summary

A targeted deferred-maintenance ship closing the load-bearing STATE.md normalizer pain point flagged in the v781 and v782 handoffs. The C6 invariant test at `tests/integration/v1-49-635-meta-test.test.ts:146` had been failing for at least one milestone (confirmed pre-existing at v781 ship tip `6337fad53`). Operators were hand-authoring `.planning/STATE.md` at every ship and noting "STATE.md normalizer needs 2× --write" in memory.

This ship rewrites the broken pieces of `tools/state-md-normalizer.mjs` and updates the on-disk STATE.md to be normalizer-clean. The test now passes; `--check` is now a reliable no-op on a freshly-authored STATE.md; future ships can let the normalizer do its job instead of hand-authoring.

| Commit | SHA | Subject |
|---|---|---|
| 1 | TO-FILL | fix(state-md-normalizer): tolerate missing optional fields + emit Shipped line |
| 2 | TO-FILL | chore(release): v1.49.783 STATE.md normalizer fix |
| 3 | TO-FILL | chore(post-ship): RH refresh after v1.49.783 |

## What was broken

Three bugs combined to produce guaranteed drift on hand-authored STATE.md:

1. **Generator emitted `UNKNOWN` placeholders for missing optional fields.** `generateCurrentPosition` printed `Opened: UNKNOWN` when `opened_on` was absent. `generateEngineStateBaseline` printed `sha: UNKNOWN` when `predecessor.shipped_at_sha` was absent. Any hand-authored STATE.md that wrote the dates in the body (the natural thing to do) but didn't populate the frontmatter would always drift.

2. **No `Shipped:` line in `generateCurrentPosition`.** Operators wrote `Shipped: YYYY-MM-DD` in the body when the milestone was shipped; the generator had no code path for it, so re-running `--write` would strip the line.

3. **Strip regex used `\Z` — a literal `Z`.** JS regex has no `\Z` end-of-string anchor. The pattern `^## Current Position[\s\S]*?(?=^##|\Z)/m` was parsed as "end at the next `^##` heading OR a literal `Z` character." When section prose contained a `Z` (e.g. ISO-8601 timestamps), strip terminated early and the rebuild duplicated the section.

## The fix

`tools/state-md-normalizer.mjs`:

- `generateCurrentPosition` now skips lines for absent fields (no `UNKNOWN` placeholder) and emits a `Shipped: ${shipped_at}` line when `status === 'shipped'` and `shipped_at` is set.
- `generateEngineStateBaseline` builds the Predecessor line dynamically from whichever of `{shipped_at_tag, shipped_at_sha}` are present, so partial-detail frontmatter round-trips without `UNKNOWN`. `predecessor.counter_cadence` retains its historical default-to-`false` behavior so existing fixtures stay aligned.
- The `\Z` regex strip is replaced with a `stripSection(body, headingPrefix)` helper that walks lines until the next H2 heading or end-of-input. Robust to any character in section prose.
- The normalized output now has a blank line between the closing `---` and the body for readability (matches what hand-authors naturally write).

`tools/__tests__/state-md-normalizer.test.mjs` — 5 new T5 tests covering: `Shipped:` emission, `Opened:` skip when `opened_on` is absent, sha-omission when `predecessor.shipped_at_sha` is absent, Z-in-body strip safety, and full hand-authored round-trip cleanness.

`tools/__tests__/state-md-normalizer-prose.test.mjs` — fixture adjusted for the new blank-line-after-`---` format.

`.planning/STATE.md` — repopulated for v782 ship state with `opened_on`, `shipped_at`, and `predecessor.shipped_at_sha` in the frontmatter; stale top-level keys (`shipped_at_tag`, `predecessor_tag`, `predecessor_nasa_degree`, `last_activity`, `path`) removed. `--check` is now a clean no-op. (STATE.md is gitignored, so this change lives in the working tree only.)

## Test counts

- **Normalizer + prose + ship-updater test files:** 55/55 passing (14 existing normalizer + 5 new T5 + 13 prose + 23 ship-updater).
- **Full vitest suite:** 30,315 passing (up from 29,743 passing with 1 failing at v782 ship). 0 regressions; the +572 delta is mostly from skip-guard flips when STATE.md became normalizer-clean (several `runIf(STATE_MD_AVAILABLE)` tests now run).
- **Pre-tag-gate:** TO-FILL after gate run.

## What this ship is

- A focused deferred-maintenance wedge — one fix, one new test class, one operator-quality-of-life win.
- A demonstration of the "gate, not vigilance" discipline from the counter-cadence operative-discipline doc: the offending rule ("remember to hand-author STATE.md, or run --write twice, or accept that --check will lie") is now a working gate ("`--check` tells the truth on a freshly-authored STATE.md").

## What this ship is not

- Not a NASA degree advance. Engine state unchanged at 1.177.
- Not a counter-cadence ship. Counter-cadence count stays at 5 (v585, v776, v777, v778, v779).
- Not an architecture refactor. No new files, no new public types, no API surface change beyond the internal generator code paths.

## Next session pickup

The handoff queue from v782:

- **Path D — codify lesson candidates into CLAUDE.md disciplines.** 3 v781 + 3 v782 = 6 lesson candidates queued. ~45min ship.
- **Path A — NASA 1.178 forward-cadence.** INTERSTELLAR-BOUNDARY axis obs#2 from IBEX, Wind, Voyager interstellar, Pioneer interstellar, Cassini INCA, FAST, or DE-1.
- **Path C — risk-tier re-sweep at ~v789.** Deferred per cadence.

Operator picks per-ship.
