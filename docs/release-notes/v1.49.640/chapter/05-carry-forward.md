# 05 — Carry-forward: v1.49.640 Housekeeping Cluster #7 → Cluster #8

This chapter inventories all carry-forwards from v1.49.640 to v1.49.641 (Cluster #8).

## Summary

**3 carry-forward items** routed from v1.49.640 to Cluster #8:

| ID | Type | Source | Priority |
|---|---|---|---|
| CF-10 | Forward-cadence engine | Routes forward from CF-8 (v1.49.640 W0 deferred) | LOW (decision-deferred) |
| CF-11 | Operational debt | Phase-2 cartridge shape families (multi-cluster abstract; continued from CF-9) | LOW (continued) |
| CF-12 | Forward-improvement tooling | NEW from v1.49.640 retrospective findings (closure-verify-cf.mjs + hidden-transitive guard automation) | LOW (discretionary) |

This is the **same carry-forward count** as v1.49.640 inherited (3 items). v1.49.640 closed CF-7 (HIGH) and the cluster's new outputs surface new forward-improvement candidates (CF-12), so net forward-routing count stays stable.

## CF-10: Forward-cadence engine resumption (decision-deferred from CF-8)

**Type:** Engine forward-cadence routing decision (LOW priority, decision-deferred)

**Origin:** v1.49.640 W0 CF-8 routing decision routed via option (b) "Continue counter-cadence". The forward-cadence resumption candidate (STS-7 Sally Ride / Challenger NASA degree at v1.49.641+) is unchanged; the decision is simply forward-routed.

**Decision-deferred:** v1.49.641 mission-package authoring time decides:

- **(a) Resume forward-cadence at v1.49.641** — STS-7 Sally Ride / Challenger NASA degree (the previously-CF-8 candidate)
- **(b) Continue counter-cadence** — Cluster #9 would be the 9th counter-cadence cleanup
- **(c) Hybrid** — small forward content alongside any operational debt cleanup

**Recommendation for Cluster #8:** Depends on Cluster #9 (sic) carry-forward count. If Cluster #8 closes its CFs cleanly + has spare bandwidth, option (a) becomes attractive. If Cluster #8 surfaces new HIGH-priority CFs (the security audit chain history suggests this is possible), option (b) safer.

**Project-context inputs (carried unchanged from CF-8):**
- STS-7 Sally Ride is the next NASA degree candidate per project-context memory
- 360-degree Seattle engine state at degree 57 (separate engine)
- SPS #105 + TRS pack-30 are the per-engine ranks

**Apply-to-self check (Lesson #10199):** at Cluster #8 W0, NO probe is needed for CF-10 because it's a forward-cadence routing decision, not a failure-state CF. The Bayesian discipline applies in reverse: absence of new evidence supporting forward-cadence resumption means the default `b` continues.

**Expected Cluster #8 work:** 5-15 min routing decision; no implementation work in CF-10 itself unless option (a) chosen.

## CF-11: Phase-2 cartridge shape families (continued)

**Type:** Abstract operational debt (multi-cluster carry-forward; continues from CF-9)

**Origin:** v1.49.636 C2 cartridge finalization shipped 41/48 chipsets migrated; 7 unfit chipsets across 4 shape families remain. Continued through v1.49.637 / .638 / .639 / .640 carry-forward chapters.

**Shape families per `.planning/cartridge-migration-phase2.md`:**

- A: chipset:-wrapped (4 chipsets: agc-educational, aminet-archive, minecraft-knowledge-world, unison-translation)
- B: sectioned orchestration (1 chipset: gastown-orchestration)
- C: positional staff (1 chipset: examples/chipsets/chipset/ Den v1.28)
- D: stub redirect (1 chipset: math-coprocessor stub)

**Status:** unchanged across v1.49.636-640. v1.49.640 W0 verified via content-snapshot probe (`.planning/c0-cf9-cartridge-status-record.md`).

**Cluster #8 routing:** continue carry-forward unless operator decides Phase-2 cartridge work is timely. No work expected.

**Re-evaluation criterion** (per Lesson #10199 §1.4 re-framing review): CF-11 has now been routed 5 clusters without closure (.636→.637→.638→.639→.640→**.641**). At Cluster #8 W0, formally check: "Could the framing be wrong?" — is "Phase-2 cartridge work" the right framing, or has the codebase moved past the need for the original migration shape?

## CF-12: Forward-improvement tooling (NEW from v1.49.640)

**Type:** Discretionary forward-improvement (LOW priority; not blocking)

**Origin:** v1.49.640 retrospective surfaced 3 tooling improvement candidates per the closure-verification gate experience and the C1 hidden-transitive recovery cycles:

1. **`scripts/closure-verify-cf.mjs` automation tool** (per `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.7) — reads a `.planning/c0-cf{N}-record.md` template and runs the embedded probe automatically. Reduces W0 probe work from manual command-running to a single `node scripts/closure-verify-cf.mjs CF-7` invocation. Output: probe record file pre-populated for operator review.

2. **Hidden-transitive guard automation** (per `docs/test-discipline/cf-closure-verification-templates.md` §"Hidden-transitive guard") — pre-flight check that grep's src/ for any imports satisfied by a soon-to-be-removed dep's subtree. Would have caught fast-xml-parser + yaml at W0 instead of at vitest verify time. Could be integrated into the closure-verify tool above as a built-in step for path-d routes.

3. **Vitest reporter improvement for background runs** — investigate JSON-line reporter that emits per-test results as they complete, replacing the `| tail -10` buffering pattern that hid in-progress state during v1.49.640 C1 vitest cycles.

**Recommendation for Cluster #8:** all 3 are discretionary. None blocks Cluster #8 work. Consider scoping all 3 into a dedicated Cluster #8 component IF Cluster #8's primary CF surface is small (like v1.49.640 was). OR split: tackle #1 + #2 in Cluster #8 (they're related); defer #3 to a future cluster.

**Apply-to-self check (Lesson #10199):** before authoring a Cluster #8 component spec for CF-12, run a probe: do the 3 forward-improvements still make sense? Has the workflow evolved? The closure-verification gate applies to FORWARD-improvement CFs too.

## Carry-forward priority routing

For Cluster #8 mission-package authoring:

- **PRIORITY 1 (decide):** CF-10 — forward-cadence engine resumption decision (5-15 min routing decision; no implementation unless option a)
- **PRIORITY 2 (continue, optional work):** CF-11 — Phase-2 cartridge shape families (consider re-framing review per Lesson #10199 §1.4 after 5 cluster cycles of carry)
- **PRIORITY 3 (discretionary):** CF-12 — forward-improvement tooling (closure-verify tool + hidden-transitive guard + vitest reporter; scope as Cluster #8 surface permits)

## Closure-verification gate proposal for Cluster #8 W0

Per `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.3 (the gate this cluster codified), Cluster #8 W0 SHOULD:

| CF | Probe | Pass-through outcome | Fail-through outcome |
|---|---|---|---|
| CF-10 | (no probe; operator AskUserQuestion at W0 close) | option (b) chosen → CF-10 carry continues | option (a) chosen → forward-cadence resume scope |
| CF-11 | `wc -l + content snapshot diff of .planning/cartridge-migration-phase2.md` | unchanged → carry forward to Cluster #9 | changed → surface to operator |
| CF-11 (re-framing review) | "Could the Phase-2 cartridge framing be wrong after 5 cluster cycles?" | framing remains valid → continue carry | framing wrong → operator decides re-scope or retire |
| CF-12 | Re-evaluate whether the 3 tooling improvements still make sense | yes → proceed with chosen scope | obsolete → retire CF-12 |

## Forward-note RECOMMENDATION (per Lesson #10196 discipline)

**RECOMMENDATION:** v1.49.641 mission-package authoring should:

1. Run the closure-verification gate at W0 (mechanical apply-to-self of Lesson #10199's now-codified discipline)
2. Apply the re-framing review to CF-11 (5-cluster carry-forward → time to consider hypothesis-rejection)
3. Decide CF-10 forward-cadence routing AFTER CF-11 re-framing review (so engine state advance + cluster-scope decisions are coordinated)
4. Update `.planning/STATE.md` to reflect v1.49.640 ship + v1.49.641 open

**RE-EVALUATION CRITERION:** if Cluster #8 closes ANY of CF-10 / CF-11 / CF-12, the 9-cluster chain trajectory looks healthy. If Cluster #8 carries all 3 forward unchanged, consider whether the counter-cadence chain has reached the point of diminishing returns; raise this at Cluster #8 retro.

**DECISION-TREE CUMULATIVE STATE:** 8 consecutive counter-cadence cleanups in the chain. CF-7 closure at v1.49.640 validates the closure-verification gate. CF-11 has been carried 5 cycles without closure (matches v1.49.634 CF-1 chain at the time of its retirement). Cluster #8 may be the right time to apply the re-framing review formally.
