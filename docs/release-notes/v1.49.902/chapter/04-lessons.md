# Lessons Emitted — v1.49.902

No new manifest-promoted lessons this ship. v902 introduces a 1-instance sub-variant candidate for #10448 (class-multi-method consolidated public-entry gate) and reinforces #10442, #10444, #10456 at ESTABLISHED. The codify-axis backlog from v901 carries forward with one new 1-instance candidate added.

## NEW 1-instance candidate: class-multi-method consolidated public-entry gate (sub-variant of #10448)

**Status:** 1-instance candidate; needs 2 more class-multi-method LoaderContext (or ProcessContext / EgressContext) wires with consolidated-gate shape to promote to the #10448 catalog.

**Defining property:** A class wraps a directory (or namespace), has multiple internal fs-op surfaces all scoped under that directory, and exposes a single public entry point that orchestrates them. The chokepoint gate is hoisted at the public-method entry on the wrapped scope, and all internal fs ops inherit the gate through transitive call.

**Discriminator from #10455 (class-stored hoist-at-top):**

| Sub-variant | N (fs-op methods) | Where gate sits | Audit per public call |
|---|---|---|---|
| #10455 (ESTABLISHED v899) | 1 | At the single fs-op method itself | 1 |
| v902 candidate | N > 1 | At the public-method entry (above all private fs-op methods) | 1 |

The 1-audit-per-public-call shape is shared. The difference is whether the gate lives at the fs-op site (when there's only one) or at the public-API entry (when private internals fan out).

**v902 instance:** `src/orchestrator/state/state-reader.ts` — `ProjectStateReader` class wraps `planningDir`, has 3 internal fs-op surfaces (`access` in `directoryExists`, 4× `readFileSafe` inline in `read()`, `readdir` in `resolvePhaseDirectories`), single public `read()` entry. Gate hoisted at top of `read()` on `this.planningDir` scope.

**Promotion path:** Two more class-multi-method LoaderContext (or sibling) chips with consolidated-gate selection. Likely candidates from current KNOWN_UNWIRED ledger: `memory/conversation-store.ts` (531 LOC), `memory/file-store.ts` (516 LOC), `intelligence/kb/store.ts` (1399 LOC), `events/skill-event-store.ts` (222 LOC) — pending inspection.

**Alternative wire shape NOT picked at v902:** multi-site gate (one `ensureAllowed` per fs-op method, 6 audits per `read()` call). This is a legitimate variant when per-disk-op audit fidelity is required; v902's pick of consolidated-gate is a design-locked decision, not a discovered truth. A future class chip with downstream forensic-audit consumers could pick multi-site and still be correct.

## Reinforcement: #10442 hoist gates ABOVE swallow-catches

**Status:** ALREADY ESTABLISHED.

**v902 instance:** `directoryExists` private method has its own `try { await access(dirPath) } catch { return false }` swallow. The `ensureAllowed` hoist in `read()` sits ABOVE the `directoryExists` call, so `LoaderContextDenied` propagates instead of being absorbed and returning `uninitializedState()`. Exercised explicitly by the "denial propagates ABOVE directoryExists ENOENT swallow" test.

## Reinforcement: #10456 audit-record-count assertion (5th distinct variant)

**Status:** ALREADY ESTABLISHED (codified at v899 with 3-variant evidence; reinforced v900 with 4th variant).

**5th variant evidence:**

- **v1.49.902** — `state-reader.test.ts` audit-record-count test: assert K records under K public `read()` invocations on a class with multi-method internals (consolidated gate emits 1 audit per public call regardless of internal fan-out).

**Why this is reinforcement, not promotion:** The #10456 template enumerates the test pattern (exact-N assertion, not at-least-1). The 5th variant is the class-multi-method consolidated-gate test shape — distinct from v892 two-site outer-loop, v896 derived-method ripple, v897 mixed read/write derived methods, and v900 module-function direct-call. The variant catalog grows; the test pattern stays the same.

## Reinforcement: #10444 size-ascending chip-pick

**Status:** ALREADY ESTABLISHED (codified at v883 with 9-instance evidence by v900).

**v902 instance:** Live `wc -l` at chip-pick: `keystore.ts` (179 LOC) < `state-reader.ts` (190 LOC). Picked the non-smallest (`state-reader.ts`) with an inline-documented override reason: `keystore.ts` LoaderContext-wire is a deferred separate concern (sync `existsSync` wire shape, distinct from current async wires) per v900 carry-forward. Override discipline: size-ascending is the default; explicit-skip reasons must be inline-documented when overridden.

## Carry-forward observation: keystore.ts sync-existsSync wire shape (next chip candidate)

**Why deferred to v903+:** `keystore.ts` is the smallest remaining KNOWN_UNWIRED entry (179 LOC) and is already ProcessContext-wired at v861. The LoaderContext-wire would target 2 sync `existsSync` sites at `keystore.ts:62` + `keystore.ts:76`, both inside the `resolveKeystoreBin` function. This is a NEW sync wire shape — all prior LoaderContext wires use async (`readdir`, `readFile`, `access`). The two `existsSync` calls are inside the same function (`resolveKeystoreBin`), so the wire would likely be a hoist-at-top with one gate before either branch — closer to v900's module-function hoist-at-top than v902's class-multi-method consolidated-gate. Promotion potential: if v903+ chips keystore.ts as a sync-existsSync hoist-at-top, that's 1-instance of a new sub-sub-variant (sync vs async base hoist-at-top distinction).

## Carry-forward observation: vitest count delta

**Why flag this:** v900 cited 35,519 passing tests. v901 was doc-only (no test surface change). v902 added 5 tests, so the expected post-v902 count is ~35,524. Actual post-v902 count: 35,005 (zero failures, but -509 vs the v900 cited number). The discrepancy may be (a) flake skipping, (b) imprecise v900/v901 numbers, or (c) test files quietly excluded. Cross-check at v903: if v903 (no new tests) reports a count near 35,005 the delta is a counting methodology shift, not a regression. If a new mechanism is masking tests, surface it.

## Cross-references

- #10442 (Failure-mode contracts — Hoist gates ABOVE swallow-catches)
- #10444 (Size-ascending chip-pick reveals wire-shape diversity) — v902 reinforces with explicit-override discipline
- #10445 (Spawn-site count N as primary wire-shape predictor)
- #10448 (Shared-helper hoist sub-variant catalog) — v902 surfaces 1-instance class-multi-method consolidated-gate candidate
- #10455 (Class-stored hoist-at-top for N=1 case) — v902 is the N>1 sibling candidate
- #10456 (Audit-record-count assertion) — v902 is 5th variant evidence
- #10432 (KNOWN_UNWIRED allowlists as migration-debt ledger)
- v1.49.890 / v1.49.896 / v1.49.897 — prior class-stored hoist-at-top instances (#10455 evidence)
- v1.49.887 / v1.49.889 / v1.49.900 — prior LoaderContext module-function hoist-at-top instances (#10448 base)
- v1.49.899 — codify ship that ESTABLISHED #10455 / #10456 / #10457 + extended #10453 to ESTABLISHED
- v1.49.900 — predecessor chip with explicit carry-forward note naming v902's wire-shape candidates
