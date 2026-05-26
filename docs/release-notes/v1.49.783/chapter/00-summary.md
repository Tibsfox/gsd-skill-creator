> Following v1.49.782 — _Tier E Architecture: LoaderContext Security Chokepoint_, v1.49.783 ships as STATE.md Normalizer Fix (deferred-maintenance wedge).

# v1.49.783 — STATE.md Normalizer Fix

**Shipped:** 2026-05-26

A targeted ~30min deferred-maintenance wedge closing the long-standing C6 STATE.md normalizer test failure at `tests/integration/v1-49-635-meta-test.test.ts:146` (pre-existing at v781 ship tip `6337fad53`). Three bugs combined to make hand-authored STATE.md guaranteed-drifty:

1. **Generator emitted `UNKNOWN` placeholders for missing optional fields.** `Opened: UNKNOWN`, `sha: UNKNOWN` — any STATE.md with the dates in the body but missing the frontmatter fields would always drift.
2. **No `Shipped:` line in `generateCurrentPosition`.** Operators wrote `Shipped: YYYY-MM-DD` in the body; re-running `--write` stripped it.
3. **`\Z` regex strip is literal `Z`.** JS regex has no `\Z` anchor. The pattern terminated section-strip early when prose contained a Z (e.g. ISO-8601 timestamps).

The fix: tolerant generators that skip missing-field lines, a `stripSection(body, headingPrefix)` line-walker replacing the broken regex, a blank line between the closing `---` and the body for readability, and 5 new T5 unit tests covering the behaviors. `.planning/STATE.md` is now `--check`-clean and idempotent under `--write`.

Engine state unchanged (NASA 1.177); counter-cadence count unchanged at 5. Forward-cadence deferred-maintenance ship. Embodies the "gate, not vigilance" discipline — the offending rule ("hand-author STATE.md or run --write twice") is now a working gate.
