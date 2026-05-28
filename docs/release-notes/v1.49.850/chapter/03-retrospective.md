# v1.49.850 — Retrospective

**Wall-clock:** ~12 min from v849 ship close to v850 ship close. Below v849's ~20 min — the v849 template applied byte-equivalent (modulo wire placement variant).

## What went as expected

- **Chip template accelerated execution further.** v848 (help expansion, novel) → ~25 min; v849 (first chip) → ~20 min; v850 (second chip, template ready) → ~12 min. The cost reduction matches the discipline-as-data maturity pattern noted at v847.
- **DI-overrides test infrastructure made the new tests trivial.** Existing test file uses `detectExtension({cliAvailable, ...})` pattern, no `vi.mock('child_process')` needed. The new ProcessContext tests slot in cleanly with override-skip + denial-propagation cases.
- **Hoist-inside-branch placement is canonical.** The wire shape variant (hoist inside the no-override branch) preserved the early-return semantics for override callers — no spurious audit records on override paths. The "hoist as close to the spawn as possible" guideline (rather than always-at-top) handles this correctly.

## What I noticed

- **The chip pattern is now ~12 min wall-clock floor.** With v849 establishing the test pattern + audit-test KNOWN_UNWIRED comment shape, the per-chip cost is dominated by release-notes-prose, not by source-edit. Could potentially be reduced further with a `tools/scaffold-chip-release-notes.mjs` script — below-threshold observation.
- **Two distinct wire-shape variants now exist in the chip campaign:**
  - v849 `changelog-watch`: hoist at top of function (single code path)
  - v850 `extension-detector`: hoist inside no-override branch (DI-override early-return)
  Both follow Lesson #10427's hoisted-check rule; the placement varies with the function's control flow. Pattern is the same; placement is contextual.
- **The `await expect(...).rejects.toThrow(...)` pattern is the async-deny test idiom.** Different from v849's sync `expect(() => ...).toThrow(...)` because `detectExtension` is async. Worth noting for future async-surface chips.

## What surprised me

- **The pre-tag-gate's PROJECT.md drift gate just triggered for the first time this campaign.** v848 passed the drift check (3-patch tolerance: v844→v847 = 3); v849 FAILED (v844→v848 = 4). The hand-edit of PROJECT.md to v848 brought drift to 1 (v848→v849); next ships will sit at 2-3 then trigger again. The 3-patch tolerance is a useful catch — forced me to update PROJECT.md mid-campaign rather than at the end.

## Risk that didn't materialize

- **No audit-test regression.** File removed from KNOWN_UNWIRED; audit-test still 2051 PASS.
- **No backward-compat break.** `ctx?: ProcessContext` is the SECOND positional parameter (after existing `overrides?`); call sites passing no args or `(overrides)` continue to work.
- **No async-throw test trip.** The `await expect(...).rejects.toThrow(...)` idiom worked first try.

## Carried forward (post-v850)

NEW this ship: 1 below-threshold observation.

- **`tools/scaffold-chip-release-notes.mjs`** — 1 instance. The ~12 min chip-ship wall-clock floor is dominated by release-notes-prose. A scaffolding script could template the 5-file structure with parameterized fields (file path, LOC, hoist-placement variant, test-pattern type). Wait for 2nd instance.

Below-threshold observations from prior ships UNCHANGED. The v849 `defaultProcessContext(sink) signature gotcha` observation REINFORCED in spirit (the v850 `await expect(...).rejects.toThrow(...)` async-throw pattern was the analogous "right idiom" gotcha worth noting once but not codifying yet).

## Eligible for next codify ship: 0
