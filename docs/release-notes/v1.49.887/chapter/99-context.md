# v1.49.887 — Context

## Provenance

First chip of the v885 LoaderContext KNOWN_UNWIRED ledger. Operator at session start (2026-05-28 ~03:41 UTC) selected forward-path options 2 + 3 + 4 + 5 from the v884-v886 handoff — all four non-NASA paths — to be executed in a multi-ship session. v887 is the first ship of that sequence, executing option 2 ("first LoaderContext chip").

## Predecessor

- **v1.49.886** — Counter-cadence codify ship. Promoted #10450 (tools-fail-loudly) + #10451 (calibrate-axis read-side recipe). Closed the v884-v886 sub-campaign.
- **v1.49.885** — LoaderContext chip-down opener. Extended audit name-glob, KNOWN_UNWIRED initialized at 15 entries, stale-entry detectors added, cross-audit tool gained LoaderContext + Shape B alias-fix.
- **v1.49.884** — Bounded-learning verify-axis chip: `observation.retention_days` read-side wire.

## Disciplines this ship updates

- **None codified this ship.** The work applies existing established lessons.
- **`src/console/reader.ts`** — first LoaderContext-wired call site for the `*reader*` name-pattern band introduced at v885. Demonstrates the wire-shape catalog generalizes from Process/Egress to Loader cleanly.

## Cross-references to related disciplines

- **Architecture-retrofit patterns** (#10414, #10416, #10426, #10440, #10444, #10445, #10447, #10448) — applied (#10444 size-ascending, #10445 N=1 hoist-at-top, #10448 sub-variant 1).
- **Security chokepoints** (#10414, #10426, #10427, #10433, #10441, #10449) — extends the catalog by one chip-completed file on LoaderContext.
- **Failure-mode contracts** (#10427, #10437, #10442, #10446) — applied (#10442 re-throw denial outside swallow-catch).
- **KNOWN_UNWIRED ledger discipline** (#10432, #10434, #10443) — applied. Loader ratchet count 15 → 14.

## Forward path

- **v888: Bounded-learning read-side wire for `token_budget.max_percent`** — applies #10451 recipe a third time → promotes from 2-instance ESTABLISHED to 3-instance STABLE.
- **v889 + v890: More LoaderContext chips** — `src/intelligence/atlas-indexer/file-walker.ts` (120 LOC) then `src/eval/calibration-adjustment-store.ts` (129 LOC) — continuing size-ascending traversal per #10444.
- **v891: Substrate auto-emit for `observation.retention_days`** — closes the v884 deferred half; requires building a retention-sweep substrate consumer.

**Engine-state observations for next handoff:**

- NASA degree pressure-margin record extends to **105 consecutive ships** at 1.178.
- LoaderContext KNOWN_UNWIRED ledger: 14 entries remain after v887; first chip completed in hoist-at-top sub-variant.
- The v887 chip validates that LoaderContext behaves identically to Process+Egress at chip time — same wire shapes, same failure-mode contracts, same ledger discipline.
