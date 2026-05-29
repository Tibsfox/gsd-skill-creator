# v1.49.888 — Context

## Provenance

Second ship of the v887-v891 multi-ship session executing the v884-v886 handoff's options 2 + 3 + 4 + 5. v887 shipped option 2 (first LoaderContext chip); v888 ships option 3 (bounded-learning read-side wire for the remaining UNWIRED `token_budget.max_percent`).

## Predecessor

- **v1.49.887** — First LoaderContext chip: `src/console/reader.ts` (109 LOC). N=1 hoist-at-top wire from the v868-v882 catalog reused on the third chokepoint cluster. KNOWN_UNWIRED Loader 15 → 14.
- **v1.49.886** — Counter-cadence codify ship. Promoted #10450 (tools-fail-loudly) + #10451 (calibrate-axis read-side recipe).
- **v1.49.885** — LoaderContext chip-down opener. Extended audit + KNOWN_UNWIRED initialization.
- **v1.49.884** — Bounded-learning verify-axis chip: `observation.retention_days` read-side wire (second instance of the #10451 recipe before it was codified).

## Disciplines this ship updates

- **None codified this ship.** The work applies #10451 a third time without modifying the discipline doc.
- **`src/bounded-learning/token-budget-max-events.ts`** — third instance of the per-threshold events module pattern. Sibling files (predictive, observation-retention) provided cleanly reusable templates.
- **`src/bounded-learning/observation-sources.ts`** — last UNWIRED threshold class flipped to wired. The "Unwired classes return empty" docstring branch now has no entries.

## Cross-references to related disciplines

- **Bounded-learning calibration** (#10425, #10451) — applied. #10451's 7-step recipe applied verbatim; promotes from 2-instance ESTABLISHED to 3-instance STABLE.
- **Meta-cadence** (#10428, #10438, #10439) — applied. #10439 CLI-manual + substrate-auto-emit duality observed (substrate half deferred for `token_budget.max_percent` per staging discipline).
- **Failure-mode contracts** (#10427) — applied. `appendTokenBudgetMaxEvent` best-effort silent.

## Forward path

- **v889 + v890: Two more LoaderContext chips** (`file-walker.ts` 120 LOC, `calibration-adjustment-store.ts` 129 LOC). Continue the size-ascending traversal.
- **v891: Substrate auto-emit for `observation.retention_days`** — closes the v884 deferred half (option 4 from the v886 handoff). Requires building a retention-sweep substrate consumer.

**Engine-state observations for next handoff:**

- NASA degree pressure-margin record extends to **106 consecutive ships** at 1.178.
- Wired calibratable thresholds: 6 of 7 (only `observation.retention_days` substrate auto-emit remains as the "non-wired" entry per the registry's truth).
- `token_budget.max_percent` substrate auto-emit is also still pending — would close the full calibrate axis when both substrate halves ship.
- #10451 evidence now at 3 instances (v837 predictive + v884 observation-retention + v888 max). The recipe held without modification across all three; consider closing the recipe as STABLE in a future codify ship.
