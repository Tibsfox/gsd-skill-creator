# v1.49.896 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10448** (#10433 wire-shape catalog) — applied. Hoist-at-top sub-variant, class-stored form (single `private readonly ctx?` field consumed via `this.ctx` at the one fs-op method). Pairs with v890 as the second class-stored hoist-at-top instance — promotion-eligible at 3rd instance.
- **#10442** (re-throw `*ContextDenied` from catch blocks) — applied. `ensureAllowed` call hoisted OUTSIDE the `readAll()` try/catch that swallows ENOENT, so `LoaderContextDenied` propagates rather than being silently converted to an empty-array return. Tested explicitly: a restricted ctx + missing file still throws.
- **#10444** (size-ascending chip-pick) — applied. Direct `wc -l` on all 11 KNOWN_UNWIRED entries surfaced workflow-run-store.ts at 138 LOC — the smallest in the ledger, smaller than the v895 handoff's named candidate.
- **#10445** (spawn-site count N as primary wire-shape predictor) — applied. N=1 single readFile site in `readAll()`. Matches v887/v889/v890 single-site pattern.
- **#10427 / #10437** (failure-mode contracts) — applied. Read-side gating is load-bearing (denial must propagate); the swallowed ENOENT is the accessory error-tolerance, not the load-bearing surface.

## Promotion-eligible candidates (carry-forward — updated)

**Promoted to 2-instance this ship:**

1. **Class-stored hoist-at-top sub-variant of #10448** (v890 + v896 = 2 instances). Class with single fs-op method, `ctx` stored as `private readonly ctx?: LoaderContext` field via constructor, consumed via `this.ctx` at the fs-op method. Distinct ergonomic from module-function hoist-at-top (v887/v889) — promotion-eligible at 3rd instance.

**Unchanged 1-instance candidates (from v892/v895 carry-forward):**

2. **Two-site hoisted-check sub-variant of #10448** (1 instance v892). When a file exports multiple entry points that each touch fs and may be called directly, each entry gates independently.
3. **Audit-record-count test for two-site shapes** (1 instance v892) — *strengthened to 2-instance pattern this ship via derived-method ripple*. v892's test asserted 9 records under outer invocation (1 + 8). v896's test asserts 3 records under 3 derived-method invocations. Both are instances of "audit-record-count test as regression detector for fidelity-reducing refactors" — promotion-eligible at 3rd instance.
4. **3-ship-after-wire optional ship within #10428 budget** (1 instance v894).
5. **Default-kind selection discipline when CLI default doesn't exist** (1 instance v891).
6. **Read-side-only chokepoint at write-bearing classes** (1 instance v890; v896 is the second instance — `append()` is the write surface, `readAll()` is the read surface gated by LoaderContext, `append()` is intentionally not gated). Promotion-eligible at 3rd instance — likely v897+ when another store-class is chipped.
7. `opts.ctx` vs separate ctx parameter (1 instance v889).
8. `audit-log.test.ts` assertion-flip step (1 instance v888).
9. `module-singleton` wire shape (1 instance v881).
10. Audit-fidelity inline-literal extraction (1 instance v872).
11. Fake-fixture test pattern (3 instances).
12. `git stash` cross-branch hazard (1 instance v883 session).
13. Codify-ship duration scales with composition (5 data points).
14. Cross-audit tool sanity-fixture coverage (1 instance v885).

**NEW 1-instance candidates this ship:**

15. **Derived-method audit-record-count test** (1 instance v896). When a class's read-side gate is hoisted at one method (`readAll`) but called transitively by multiple public methods (`getRunEntries`, `getLatestRun`, `getCompletedSteps`), assert exactly N audit records under N derived-method calls. Regression detector for "did we silently cache the gated method's result?" refactors. Sibling of #6 (audit-record-count for two-site shapes).
16. **Handoff candidate-naming is informational, not authoritative** (1 instance v896). Handoff documents name candidate chip targets but operators should verify with live `wc -l` at chip-pick time. v896 caught a handoff drift (`scan-state-store.ts` 176 LOC named, but `workflow-run-store.ts` 138 LOC was actually smallest).

Net: +2 NEW 1-instance candidates, +1 PROMOTED to 2-instance. Total carry-forward: ~16 candidates (was ~13 going in this ship; net +3 absorbed nothing).
