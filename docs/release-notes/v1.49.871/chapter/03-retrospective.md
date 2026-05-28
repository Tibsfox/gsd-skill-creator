# v1.49.871 — Retrospective

**Wall-clock:** ~12-15 min from v870 ship close to release-notes draft complete. At the chip-ship mean now that test setup pattern is reusable from v870.

## What went as expected

- **Closure-capture pattern applied cleanly.** Refactoring the module-level `exec()` helper into a closure inside `contribute()` was straightforward (~15 LOC moved + ctx? added). The function's call sites were unchanged because the closure has the same signature as the previous free function.
- **#10427 re-throw discipline applied at 4 catches.** Same pattern as v870 (4-method re-throw). The test setup pattern was directly reusable.
- **Cross-audit gate ran automatically.** Pre-tag-gate step 18/18 fired without operator invocation. Process count dropped 5 → 4.
- **#10444 catalog band-prediction held.** v871 at 183 LOC is right at the small-to-mid boundary; the catalog predicts hoist-outside-Promise or closure-capture at this band. Closure-capture won because the file already had a free helper that could be captured rather than threaded.

## What surprised me (mildly)

- **Closure-capture vs internal-helper distinction sharpened.** v870 (internal-helper inside a class) and v871 (closure-capture in a free function) both use the same fundamental pattern: single ensureProcessAllowed at the helper site protects N callers. The distinction is *where* the helper lives — class method vs function-local closure vs module-level. #10444 catalog labels them as separate shapes but they're functionally identical from a security perspective. Below-threshold observation; carry forward.

## What went wrong

- Nothing significant this ship. ~5 min savings vs v870 because the test setup pattern transferred directly.

## Future-improvement candidates surfaced this ship

### Closure-capture vs internal-helper-method-vs-module are the same pattern

**Surface ship:** v1.49.871 (recon during wire authoring).

v870 used internal-helper-method (class private method `git()` wraps the exec). v871 used closure-capture (function-local closure captures `ctx` from outer scope). Both produce the same wire shape: single ensureProcessAllowed at a helper site, N call sites protected, ctx? threaded through a single entry point.

The #10444 catalog enumerates these as separate shapes (internal-helper, closure-capture, hoist-outside-Promise). From a security-discipline perspective they're variants of "one check protects N call sites via a shared helper" — the difference is just *where* the helper lives lexically (class method / function-local closure / module-level function).

Below-threshold (1 instance of explicit cross-pattern recognition). A 2nd chip that requires choosing between two of these variants would promote this to a refinement of #10444 — possibly suggesting the catalog could collapse these three shapes into "shared-helper hoist" with a sub-classification.

### Sync chain optimization opportunity

**Surface ship:** v1.49.871 (the post-ship sync chain ran ~6 commands in sequence; could parallelize some).

The post-ship sync chain (`refresh + publish + GH release + STATE.md + post-ship commit + dev push + main push`) runs ~6 sequential commands. Some could parallelize (publish + GH release are independent of each other once refresh completes). Below-threshold observation; the 30-second savings per ship aren't yet motivating a refactor.

## Verdict on scope

Chip ship matching the v858-v867 cluster mean envelope (~12-15 min). The closure-capture wire shape transferred cleanly from #10444's catalog without surprises. Track 4 progress: 2/6 chips closed. Pre-tag-gate step 18/18 catches stale entries automatically — no operator-invoked verification this ship.
