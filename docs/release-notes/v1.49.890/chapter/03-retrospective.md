# v1.49.890 — Retrospective

## What worked

**Reading the chokepoint contract before wiring was load-bearing.** The LoaderContext docstring explicitly says "Every loader that **reads** bytes from the filesystem accepts an optional LoaderContext." That sentence answered the read-vs-write question without scope expansion — gate `load()`, leave `save()` alone, add a docstring note, write a test that asserts the save path is unaudited. ~3 min of contract-reading saved ~30 min of scope-expansion debate.

**Explicit "NOT gated" test was valuable.** The test `'save() is not gated by LoaderContext (read-side chokepoint by design)'` asserts the write path runs even with a deny-everything ctx. Without this test, a future operator might "fix" the asymmetry by gating save() with op `'read-file'` — semantically muddled. The test pins the design intent.

**Hoist-at-method-top is the right granularity here.** The class has TWO distinct surface methods (`load`, `save`) with DIFFERENT semantic categories (read, write). N=1 PER METHOD that needs gating. Sub-variant 1 (hoist-at-top of the gated method) applies cleanly.

## What didn't work

**The audit-test silently accepts read-only chips.** The audit just checks "imports node:fs MUST call ensureAllowed at least once". It doesn't check that all fs operations are gated — a partial wire (only load, not save) is indistinguishable from a full wire at the audit level. This is correct behavior given the chokepoint's read-only intent, but worth noting: the audit doesn't enforce that ALL fs operations are gated, just that SOME ensureAllowed call exists.

## Verdict on scope

Third consecutive chip in ~15 min. The campaign's pace is converging on a steady 15-20 min/chip for the small-LOC class. v890 added one structural observation (read-vs-write asymmetry surfaces at write-bearing classes) without expanding scope.

## Promotion-eligible candidates accumulated this ship

1. **Read-side-only chokepoint discipline at write-bearing classes** (1 instance v890). When wiring a class with BOTH read and write fs ops, gate the read paths only; leave write paths unaudited with a docstring note + an explicit "save not gated" test. Sub-refinement of #10448 / LoaderContext design intent. Promotion-eligible if a 2nd instance lands (likely on `memory/conversation-store.ts` 531 LOC or `memory/file-store.ts` 516 LOC — both will need similar treatment).
2. **LoaderOp could grow `'write-file'`** — alternative path if a future ship decides write paths SHOULD be audited. Out of scope for v890; this is a forward-watch.

## Forward path

- **v891: Substrate auto-emit for `observation.retention_days`** — closes v884 deferred half (option 4 from v886 handoff). Requires building a retention-sweep substrate consumer.
- **v892+: Continue Loader chip-down** — next smallest entry is `src/intelligence/atlas-indexer/file-walker.ts` was 120 LOC (already chipped at v889). Next: dacp/bus/scanner.ts 174 LOC, then discovery/scan-state-store.ts 176 LOC, etc.
