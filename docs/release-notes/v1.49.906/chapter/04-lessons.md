# Lessons Emitted — v1.49.906

No new manifest-promoted lessons. v906 reinforces #10448, #10449, #10456.

## Reinforcement: #10449 sibling chokepoints stay separate (2nd dual-ctx instance)

**Status:** ALREADY ESTABLISHED.

**v906 instance:** `runEmulatedScan(config, ctx?: ProcessContext, loaderCtx?: LoaderContext)` carries both chokepoints via separate optional params. This is the 2nd file in src/ to carry both contexts (v903 keystore.ts was the 1st). The two-instance pattern starts to look formalizable — a 3rd instance might justify a stable convention note.

## Reinforcement: #10456 — 7th audit-record-count variant

**Status:** ALREADY ESTABLISHED.

**v906 instance:** Variable count by file-existence branch on `loadKnownGoodHashes` (1 vs 2 audits) combined with sibling-chokepoint independence on `runEmulatedScan` (LoaderContext + ProcessContext audits coexist on separate sinks).

Prior variants:
- v892 outer-loop (1 outer × 8 inner = 9 audits)
- v896 derived-method ripple
- v897 mixed read/write
- v900 module-function direct-call
- v902 class-multi-method consolidated-gate
- v904 class-instance parallel-method
- v905 composition (own + transitive)
- **v906 variable-by-branch + sibling-chokepoint coexistence**

The new shape: counts depend on branch, AND audit emission can split across sibling-chokepoint sinks.

## Reinforcement: #10448 sync multi-site on same path

**Status:** ALREADY ESTABLISHED at v903.

**v906 instance:** `loadKnownGoodHashes` gates existsSync + readFileSync on the same path. Distinct from v903's `resolveKeystoreBin` (different paths per site). The "multi-site" wire shape admits both "different paths per site" and "same path different ops" sub-cases.

## Carry-forward to v907+

1. **Dual-ctx convention (2-instance from v903 + v906).** Promotes if a 3rd file carries both ProcessContext + LoaderContext.
2. **Mixed sync+async two-site (1-instance from v905).** Needs 2 more.
3. **Class-instance multi-method read-side (1-instance from v904).** Needs 2 more.
4. **Class-multi-method consolidated-gate (1-instance from v902).** Needs 2 more.
5. **Sync multi-site same-path (1-instance from v906).** Needs 2 more.
