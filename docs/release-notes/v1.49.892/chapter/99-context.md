# v1.49.892 — Context

## Provenance

First ship of the v892-v895 multi-ship session executing the v887-v891 handoff's options 2 + 3 + 4 + 5 (operator repeated the terse "2 3 4 5" invocation from the previous session). Operator-selected non-NASA forward paths in a single session:

- **v892** (option 2): Fourth LoaderContext chip — `dacp/bus/scanner.ts` (THIS SHIP).
- **v893** (option 3): Substrate auto-emit — `token_budget.max_percent`.
- **v894** (option 4): Integration test — `observation.retention_days` calibration loop.
- **v895** (option 5): Counter-cadence codify ship.

## Predecessor

- **v1.49.891** — Substrate auto-emit: `observation.retention_days` (closing ship of v887-v891 session).
- **v1.49.890** — Third LoaderContext chip: `calibration-adjustment-store.ts`.
- **v1.49.889** — Second LoaderContext chip: `file-walker.ts`.
- **v1.49.888** — Bounded-learning read-side wire for `token_budget.max_percent`.
- **v1.49.887** — First LoaderContext chip: `console/reader.ts`.

## Disciplines this ship updates

- **None codified this ship.** Applies #10448 + #10442 + #10444 + #10445 cleanly.
- **`src/dacp/bus/scanner.ts`** — first instance of two-site hoisted-check sub-variant of #10448. Promotion-eligible at 2nd instance.

## Cross-references to related disciplines

- **Architecture-retrofit patterns** (#10444, #10445, #10447, #10448) — applied. Two-site hoisted-check sub-variant of #10448; N=2 spawn sites driving the wire shape per #10445.
- **Security chokepoints** (#10414, #10426, #10442) — applied. LoaderContext threading + `ensureAllowed` hoisted outside try/catch per #10442.
- **KNOWN_UNWIRED allowlists** (#10432, #10434) — applied. Chip-down note + LOC sort discipline.

## Forward path

**Continue v892-v895 session.** Next ships per the v891 handoff:

1. **v893 — Substrate auto-emit for `token_budget.max_percent`** — applies v891's substrate-wrapper pattern (which would promote to 2-instance ESTABLISHED).
2. **v894 — Integration test for `observation.retention_days`** — verify-axis trigger within 10-ship budget per #10428.
3. **v895 — Counter-cadence codify ship** — absorb 2-3 of the ~14 promotion-eligible candidates (likely close: #10448 two-site hoisted-check at 1→2-instance ESTABLISHED after potential v894 use; substrate wrapper at 1→2 after v893; #10451 STABLE promotion as already 3-instance).

**Engine-state observations:**

- NASA degree pressure-margin record extends to **110 consecutive ships** at 1.178 (a new high-water mark).
- LoaderContext KNOWN_UNWIRED ledger: 11 entries remain (was 15 at v885 opener; net -4 after v887/v889/v890/v892).
- Wired calibratable thresholds: 6 of 7 (UNCHANGED).
- ~14 promotion-eligible candidates carrying forward.

**Replication-ready pattern from this ship:**

Two-site hoisted-check is a clean N=2 application of #10448. When a file exports multiple entry points that each touch fs, gate each entry independently — no deduplication is safe because direct callers of any inner entry would bypass an outer-only gate. Audit-record-count test (asserting exactly N records under outer invocation) is the regression-detector for any future refactor that attempts to deduplicate.
