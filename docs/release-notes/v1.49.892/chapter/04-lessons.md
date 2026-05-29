# v1.49.892 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10448** (#10433 wire-shape catalog) — applied. Two-site hoisted-check sub-variant: first instance in this campaign. Promotion-eligible at 2nd instance.
- **#10442** (re-throw `*ContextDenied` from catch blocks) — applied. `ensureAllowed` calls hoisted OUTSIDE the readdir try/catch in `scanPriorityDirWithBundles` so `LoaderContextDenied` propagates rather than being swallowed by the silent-return pattern.
- **#10444** (size-ascending chip-pick) — applied. Next-smallest entry per the KNOWN_UNWIRED ledger LOC sort: scanner.ts at 174 LOC, smallest after the v890 chip dropped calibration-adjustment-store from the list.
- **#10445** (spawn-site count N as primary wire-shape predictor) — applied. N=2 forces two-site hoisted-check; LOC was the coarse sort, N was the actual shape selector.

## Promotion-eligible candidates (carry-forward)

1. **Two-site hoisted-check sub-variant of #10448** (1 instance v892). When a file exports multiple entry points that each touch fs and may be called directly, each entry gates independently.
2. **Audit-record-count test for two-site shapes** (1 instance v892). When the wire shape produces N audit records per outer invocation, assert exactly N.
3. **Substrate wrapper pattern for calibratable threshold + existing substrate** (1 instance v891). Thin `runX` function bridging operator config to existing substrate + auto-emit.
4. **Fire-and-forget test-side wait via `setTimeout(50ms)`** (1 instance v891). When asserting on fire-and-forget I/O, use real timeout not setImmediate.
5. **Default-kind selection discipline when CLI default doesn't exist** (1 instance v891). For calibratable thresholds whose CLI requires --kind (no default), substrate auto-emit picks the conservative bias.
6. Read-side-only chokepoint at write-bearing classes (1 instance v890).
7. `opts.ctx` vs separate ctx parameter (1 instance v889).
8. `audit-log.test.ts` assertion-flip step (1 instance v888).
9. `module-singleton` wire shape (1 instance v881).
10. Audit-fidelity inline-literal extraction (1 instance v872).
11. Fake-fixture test pattern (3 instances).
12. `git stash` cross-branch hazard (1 instance v883 session).
13. Codify-ship duration scales with composition (5 data points).
14. Cross-audit tool sanity-fixture coverage (1 instance v885).
