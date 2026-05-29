# v1.49.896 — Context

## Provenance

First ship of a new session resuming from the v895 handoff. Operator selected option 2 (Continue LoaderContext chip-down) from the four offered (NASA 1.179, LoaderContext chip, integration test for token_budget.max_percent, counter-cadence at v910). Single-ship session opens; subsequent options pending operator selection.

## Predecessor

- **v1.49.895** — Counter-cadence codify ship: promoted #10452 + #10453 + #10454.
- **v1.49.894** — Verify-axis integration test: `observation.retention_days` substrate→calibration end-to-end.
- **v1.49.893** — Substrate auto-emit: `token_budget.max_percent` ceiling check (zero UNWIRED reached).
- **v1.49.892** — Fourth LoaderContext chip: `dacp/bus/scanner.ts`.
- **v1.49.890** — Third LoaderContext chip: `calibration-adjustment-store.ts` (paired with this ship as 2-instance class-stored hoist-at-top).

## Disciplines this ship updates

- **None codified this ship.** Applies #10448 + #10442 + #10444 + #10445 + #10427/#10437 cleanly.
- **`src/skill-workflows/workflow-run-store.ts`** — second instance of class-stored hoist-at-top sub-variant of #10448. Pairs with v890; promotion-eligible at 3rd instance.

## Cross-references to related disciplines

- **Architecture-retrofit patterns** (#10444, #10445, #10447, #10448) — applied. Class-stored hoist-at-top per #10448; N=1 spawn site per #10445; size-ascending chip-pick per #10444.
- **Security chokepoints** (#10414, #10426, #10442) — applied. LoaderContext threading via constructor; `ensureAllowed` hoisted outside ENOENT-tolerating try/catch per #10442.
- **Failure-mode contracts** (#10427, #10437) — applied. Read-side gating is load-bearing (denial propagates), ENOENT swallow is accessory-tolerance.
- **KNOWN_UNWIRED allowlists** (#10432, #10434) — applied. Chip-down note + size-ordering discipline.

## Forward path

**Session continues — operator selects next ship.** Forward-path options from the v895 handoff remain largely viable:

1. **Continue LoaderContext chip-down at v897** — 10 entries remain in the KNOWN_UNWIRED ledger. Next size-ascending candidates (all 176-190 LOC):
   - `src/discovery/scan-state-store.ts` — 176 LOC (class-based; may be 3rd class-stored hoist-at-top instance → promote pattern).
   - `src/orchestrator/lifecycle/artifact-scanner.ts` — 176 LOC (likely module-function form; unknown N).
   - `src/orchestrator/state/state-reader.ts` — 190 LOC.
2. **NASA forward-cadence at 1.179** — pressure-margin record now at **114 consecutive ships** at 1.178 (+1 from session start).
3. **Integration test for `token_budget.max_percent`** — verify-axis trigger within #10428 budget (extends to v903). Mirrors v894 using #10453's canonical test shape.
4. **Counter-cadence codify ship at v910-ish** — absorb the ~16 promotion-eligible candidates. The class-stored hoist-at-top is now at 2 instances; one more chip in that shape would promote it.

**Engine-state observations:**

- NASA degree pressure-margin record extends to **114 consecutive ships** at 1.178 (a new high-water mark; +1 from v895).
- LoaderContext KNOWN_UNWIRED ledger: 10 entries remain (was 15 at v885 opener; net -5 after v887/v889/v890/v892/v896).
- Wired calibratable thresholds: 7 of 7; verify-axis 6 COVERED + 1 PENDING-TEST (`token_budget.max_percent` @ v893, 3 ships since wired, 7 ships of #10428 budget remaining).
- Lessons in manifest: 95 (UNCHANGED).
- Counter-cadence count: 8 (UNCHANGED).
- ~16 promotion-eligible candidates carrying forward (was ~13 going in; net +2 NEW, +1 PROMOTED to 2-instance, 0 absorbed).

**Replication-ready pattern from this ship:**

When a class-based store has exactly ONE fs-op method (read side), the cleanest LoaderContext wire is the class-stored hoist-at-top:

```typescript
private readonly ctx?: LoaderContext;

constructor(otherArgs..., ctx?: LoaderContext) {
  this.ctx = ctx;
}

async readSide(): Promise<...> {
  ensureAllowed(this.ctx, LOADER_SOURCE, 'read-file', this.filePath);
  // existing read logic (incl. try/catch that swallows ENOENT)
}
```

The `ctx` flows through the constructor and is consumed in the single method; no per-call threading. Write methods (e.g., `append`, `save`) are intentionally not gated — LoaderContext is a read-side chokepoint by design.

v890 (calibration-adjustment-store) + v896 (workflow-run-store) are the two instances. The third instance — likely `discovery/scan-state-store.ts` or another store-class at v897+ — would promote this to a documented sub-variant in the architecture-retrofit-patterns catalog.
