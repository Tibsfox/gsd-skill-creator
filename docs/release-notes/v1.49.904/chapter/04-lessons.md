# Lessons Emitted — v1.49.904

No new manifest-promoted lessons. v904 reinforces existing disciplines and adds a 1-instance #10448 sub-variant candidate.

## NEW 1-instance candidate: class-instance multi-method read-side (sub-variant of #10448)

**Status:** 1-instance candidate.

**Defining property:** A class with N≥2 parallel public read-side methods (each with its own fs-op) on the same instance state. Each read method gates independently via `ensureAllowed` at its top, all sharing class-stored `private readonly ctx?: LoaderContext`. Write-side methods on the same class are intentionally out-of-scope per #10457.

**Discriminator from prior class wires:**

| Sub-variant | Read-method count | Gate location | Notes |
|---|---|---|---|
| #10455 (ESTABLISHED v899) | 1 | At the single read-side method | v890, v896, v897 |
| v902 class-multi-method consolidated-gate | 1 public + N internal | At the public orchestrator | 1-instance candidate |
| v904 class-instance multi-method | N≥2 parallel public | At each read-side method | This ship (1-instance) |

The discriminator from v902 hinges on class structure: v902 has a SINGLE public entry that orchestrates internals; v904 has N parallel public methods each touching disk. The wire shape differs because the public surface differs.

**v904 instance:** `src/events/skill-event-store.ts` — `SkillEventStore` class with `readAll` + `consume` + `markExpired` (3 read-side methods) + `getPending` (transitive read via `readAll`) + `emit` (write-side, out-of-scope). 3 independent hoists on `this.filePath`.

**Promotion path:** Two more class-instance multi-method read-side wires. Likely candidates from current KNOWN_UNWIRED Loader ledger: `memory/file-store.ts` (516 LOC), `memory/conversation-store.ts` (531 LOC) — pending inspection.

## Reinforcement: #10455 extended to N>1

**Status:** ALREADY ESTABLISHED (at v899 via v890+v896+v897 three-instance evidence).

**v904 instance:** Same class-stored `private readonly ctx?: LoaderContext` instance field, same `ensureAllowed(this.ctx, LOADER_SOURCE, op, target)` hoist-at-top idiom — applied to 3 read methods instead of 1. The wire MECHANICS are identical to #10455; only the COUNT differs. This suggests #10455's catalog entry should be relaxed from "N=1" to "N≥1" — the wire mechanics scale unchanged.

## Reinforcement: #10456 — 5th audit-record-count variant

**Status:** ALREADY ESTABLISHED (at v899 via v892+v896+v897 three-instance evidence).

**v904 instance:** Test asserts exactly 4 audit records under {readAll + getPending + consume + markExpired} sequence. The `getPending` call counts as 1 via the transitive `readAll`. Distinct from prior variants:

- v892 two-site outer-loop (1 outer + 8 inner = 9 audits)
- v896 derived-method ripple (3 audits under 3 derived-method calls)
- v897 mixed read/write derived methods (2 audits under 2 derived methods)
- v900 module-function direct-call (N audits per N invocations)
- v902 class-multi-method consolidated-gate (N audits per N public read())
- **v904 class-instance parallel-method (4 audits under {readAll + getPending + consume + markExpired})**

The new shape: parallel public methods, each contributing 1 audit per call, plus a transitive method that piggybacks on a sibling.

## Reinforcement: #10457 — read-side-only at write-bearing class (multi-method scale)

**Status:** ALREADY ESTABLISHED.

**v904 instance:** `SkillEventStore` has 3 read-side methods AND 2 write-bearing methods (`emit` pure-write; `consume`+`markExpired` read-then-write). The LoaderContext gate fires on all read paths (4 audits per sequence as above); pure-write `emit` emits 0 audits; mixed-mode `consume`+`markExpired` emit 1 audit each (read-side only — writeFile out-of-scope).

This is the multi-method scale instance of #10457. Prior instances were N=1 read-side at write-bearing class (v890, v896, v897); v904 is N=3 read-side at write-bearing class (1 pure-write + 2 read-then-write + 3 pure-read = 6 method shape).

## Carry-forward to v905+

1. **Class-instance multi-method read-side (1-instance from v904).** Promotion if `memory/file-store.ts` or `memory/conversation-store.ts` selects this shape.
2. **Class-multi-method consolidated-gate (1-instance from v902).** Promotion if a future chip class has a single public orchestrator over N internal fs-ops.
3. **Sync two-site hoisted-check (1-instance from v903).** Promotion if another sync-fs-op two-site chip appears.
4. **#10455's catalog entry could relax from N=1 to N≥1.** v904 is evidence that the wire mechanics extend; if 2 more N>1 instances follow, this could become a formal lesson update.
