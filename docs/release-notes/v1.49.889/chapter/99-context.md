# v1.49.889 — Context

## Provenance

Third ship of the v887-v891 multi-ship session executing options 2 + 3 + 4 + 5 from the v884-v886 handoff. v887 first LoaderContext chip; v888 bounded-learning read-side wire; v889 second LoaderContext chip continuing the chain.

## Predecessor

- **v1.49.888** — Bounded-learning read-side wire for `token_budget.max_percent` (third instance of #10451 recipe).
- **v1.49.887** — First LoaderContext chip: `src/console/reader.ts` (109 LOC, N=1 hoist-at-top).
- **v1.49.886** — Counter-cadence codify ship (promoted #10450 + #10451).

## Disciplines this ship updates

- **None codified this ship.** The work applies existing established lessons.
- **`src/intelligence/atlas-indexer/file-walker.ts`** — second LoaderContext-wired call site for the `*walker*` name-pattern band introduced at v885. Same wire shape as v887's `*reader*` chip, confirming sub-variant 1 (hoist-at-top) generalizes across surface shapes.

## Cross-references to related disciplines

- **Architecture-retrofit patterns** (#10444, #10445, #10447, #10448) — applied.
- **Security chokepoints** (#10414, #10426, #10427, #10433, #10441, #10449) — extends by one chip on LoaderContext.
- **Failure-mode contracts** (#10442) — applied. Denial-before-realpath ordering validated by explicit test.
- **KNOWN_UNWIRED ledger discipline** (#10432, #10434, #10443) — applied. Loader 14 → 13.

## Forward path

- **v890: Third LoaderContext chip** — `src/eval/calibration-adjustment-store.ts` (129 LOC).
- **v891: Substrate auto-emit for `observation.retention_days`** — closes v884 deferred half.

**Engine-state observations for next handoff:**

- NASA degree pressure-margin record extends to **107 consecutive ships** at 1.178.
- LoaderContext KNOWN_UNWIRED ledger: 13 entries remain.
- Two consecutive chips have validated sub-variant 1 (hoist-at-top) on distinct surface shapes (class method, free function). Both took ~15min from edit to ship.
