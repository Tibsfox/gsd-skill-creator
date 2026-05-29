# v1.49.890 — Context

## Provenance

Fourth ship of the v887-v891 multi-ship session executing options 2 + 3 + 4 + 5 from the v884-v886 handoff. v887 + v889 LoaderContext chips; v888 bounded-learning read-side wire; v890 third LoaderContext chip continuing the chain.

## Predecessor

- **v1.49.889** — Second LoaderContext chip: `atlas-indexer/file-walker.ts` (free function, N=1 hoist-at-top).
- **v1.49.888** — Bounded-learning read-side wire for `token_budget.max_percent`.
- **v1.49.887** — First LoaderContext chip: `console/reader.ts` (class method, N=1 hoist-at-top).

## Disciplines this ship updates

- **None codified this ship.** The work applies #10448 sub-variant 1 with a within-discipline refinement (read-side-only chip for write-bearing classes).
- **`src/eval/calibration-adjustment-store.ts`** — third LoaderContext-wired call site, first read-side-only chip in the campaign.

## Cross-references to related disciplines

- **Architecture-retrofit patterns** (#10444, #10445, #10447, #10448) — applied with read-side-only refinement.
- **Security chokepoints** (#10414, #10426, #10427, #10433, #10441, #10449) — extends by one chip on LoaderContext + first read-vs-write asymmetry surface in the LoaderContext rollout.
- **Failure-mode contracts** (#10427, #10442) — applied. The "save not gated" test is itself a load-bearing assertion preventing future scope creep into write-path gating.
- **KNOWN_UNWIRED ledger discipline** (#10432, #10434, #10443) — applied. Loader 13 → 12.

## Forward path

- **v891: Substrate auto-emit for `observation.retention_days`** — closes v884 deferred half (option 4 from v886 handoff). Requires building a retention-sweep substrate consumer that reads the threshold and auto-emits events.
- **v892+: Continue LoaderContext chip-down** — 12 entries remain. Likely targets per size-ascending: `dacp/bus/scanner.ts` 174 LOC, `discovery/scan-state-store.ts` 176 LOC, etc.

**Engine-state observations for next handoff:**

- NASA degree pressure-margin record extends to **108 consecutive ships** at 1.178.
- LoaderContext KNOWN_UNWIRED ledger: 12 entries remain after v890.
- Three consecutive chips have validated sub-variant 1 across three surface shapes: class method (v887), free function (v889), class with mixed read/write methods (v890). Pace stabilized at ~15 min/chip.
- New within-#10448 refinement: read-side-only chip for write-bearing classes. Promotion-eligible at 2nd instance.
