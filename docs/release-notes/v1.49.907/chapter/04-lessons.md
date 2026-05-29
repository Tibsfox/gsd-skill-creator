# Lessons Emitted — v1.49.907

No new manifest-promoted lessons. v907 PROMOTES v902's 1-instance class-multi-method consolidated-gate sub-variant candidate to 2-instance.

## Promotion: class-multi-method consolidated-gate (1-instance → 2-instance)

**Status:** 1-instance (v902) → 2-instance (v907). Needs 1 more for ESTABLISHED at 3-instance.

**Sub-variant of #10448** — class-multi-method consolidated-gate.

**Defining property:** A class with M public read methods that chain into N private fs-op methods (M ≥ 1, N ≥ 1). Each public method hoists `ensureAllowed` on a class-scoped target (typically a wrapped directory). Private methods inherit the gate via transitive call. Write-side methods are intentionally out-of-scope per #10457.

**Discriminator from #10455 (single-method) and v904 (parallel-methods-on-independent-paths):**

| Sub-variant | Public method count | Per-method audit target | Notes |
|---|---|---|---|
| #10455 (ESTABLISHED v899) | 1 | At single fs-op site | v890, v896, v897 |
| v902 candidate | 1 public + N internal | Scope (wrapping dir) at public entry | INSTANCE 1 |
| v907 instance | M public + N internal | Scope (wrapping dir) at each public method | INSTANCE 2 (THIS SHIP) |
| v904 class-instance multi-method | M parallel public methods | Per-file (this.filePath) at each method | Independent candidate |

The discriminator from v904: v907's audit target is the WRAPPING SCOPE (a directory); v904's is the FILE PATH. v907 / v902 wrap a directory; v904 wraps a single file. The audit-granularity decision follows from what the class wraps.

**v907 instance:** `src/memory/file-store.ts` — `FileStore` wraps `this.memoryDir`. 5 public read methods (`list`, `count`, `has`, `get`, `query`). Each gates on memoryDir scope. Private methods (`listMdFiles`, `readRecord`, `findFileById`) inherit.

**Promotion path:** One more class-multi-method consolidated-gate instance for ESTABLISHED. v908 conversation-store.ts is a likely candidate — same memory-store family as file-store, similar structural shape.

## Reinforcement: #10455 idiom (class-stored ctx) at multi-method scale

**Status:** ALREADY ESTABLISHED at v899; reinforced at v902 + v904 + v907 multi-method scale.

**v907 instance:** `private readonly ctx?: LoaderContext` field, same hoist idiom across 5 public methods. The class-stored convention scales from N=1 (v890/v896/v897) to M=5 (v907) without modification.

## Reinforcement: #10456 — 8th audit-record-count variant (parallel-methods-on-same-scope)

**Status:** ALREADY ESTABLISHED.

**v907 instance:** 4 audits under {list + count + has + query} sequence — all 4 methods gate on `this.memoryDir`. The novelty: prior variants either had a single gate target (v900, v902) or parallel methods with INDEPENDENT targets (v904). v907 is the first parallel-methods-on-SAME-target case.

Prior variants catalog (8 now):
- v892 outer-loop (1 outer × 8 inner = 9 audits)
- v896 derived-method ripple
- v897 mixed read/write
- v900 module-function direct-call
- v902 class-multi-method consolidated-gate (1 public)
- v904 class-instance parallel-method (independent paths)
- v905 composition (own + transitive)
- v906 variable-by-branch + sibling-chokepoint coexistence
- **v907 class-multi-method consolidated-gate (M public on same scope)**

## Reinforcement: #10457 read-side-only at write-bearing class

**Status:** ALREADY ESTABLISHED.

**v907 instance:** `FileStore` has 5 public read methods + 2 write methods (`store`, `remove`) + 1 helper (`ensureDir`). Only the read methods gate; write methods are out-of-scope. `get()` is read-then-write — it gates the read part; the `store()` it calls internally is implicitly out-of-scope (no double gate, no double audit).

## Carry-forward to v908+

1. **Class-multi-method consolidated-gate (2-instance from v902 + v907).** v908 conversation-store.ts likely promotes to ESTABLISHED at 3-instance.
2. **Class-instance multi-method read-side (1-instance from v904).** Still needs 2 more.
3. **Mixed sync+async two-site (1-instance from v905).** Needs 2 more.
4. **Sync multi-site same-path (1-instance from v906).** Needs 2 more.
5. **Dual-ctx convention (2-instance from v903 + v906).** Promotes if v908 or v909 carries both contexts.
