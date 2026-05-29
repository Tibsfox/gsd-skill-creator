# Lessons Emitted — v1.49.908

**v902's class-multi-method consolidated-gate sub-variant PROMOTES from 2-instance candidate to ESTABLISHED at 3-instance.** No new manifest-promoted lesson (this is a catalog-status change on the existing #10448 entry, not a new lesson). Other sub-variant candidates from prior ships remain 1-instance.

## PROMOTION: class-multi-method consolidated-gate (ESTABLISHED at 3-instance)

**Status:** 2-instance (v902 + v907) → 3-instance (v902 + v907 + v908) → **ESTABLISHED**.

**Sub-variant of #10448** — class-multi-method consolidated-gate. Now ESTABLISHED.

**Defining property:** A class wraps a directory (or namespace scope) with M public read methods (M ≥ 1) that chain into N private fs-op methods (N ≥ 1). Each public method hoists `ensureAllowed` on the class-wrapped scope. Private methods inherit the gate via transitive call. Write-side methods are intentionally out-of-scope per #10457.

**Three-instance evidence:**

| Instance | File | Public read methods | Wrapped scope | Mixed-mode methods |
|---|---|---|---|---|
| v902 | `orchestrator/state/state-reader.ts` | 1 (`read`) | `this.planningDir` | none |
| v907 | `memory/file-store.ts` | 5 (`list`, `count`, `has`, `get`, `query`) | `this.memoryDir` | `get()` (read-then-write internally) |
| v908 | `memory/conversation-store.ts` | 3 + 1 mixed-external | `this.storePath` | `ingestSessionLog(logPath)` — gates on EXTERNAL path |

The 3 instances cover M=1, M=5, M=3 — the sub-variant generalizes from "1 public + N internal" to "M public + N internal" with no structural change.

**Mixed-mode handling (v908 contribution):**
- Read-then-write internal: gate the read at the top of the public method; the internal write inherits the implicit "out-of-scope" status (v907 get() pattern).
- Read from EXTERNAL path: gate the EXTERNAL path, not the class scope (v908 ingestSessionLog pattern).

**Wire mechanics (now fully formalized):**
1. Add `ctx?: LoaderContext` as optional final constructor parameter.
2. Store as `private readonly ctx?: LoaderContext` (per #10455 idiom).
3. Add `LOADER_SOURCE = 'module/path/file'` constant.
4. At top of each public read method: `ensureAllowed(this.ctx, LOADER_SOURCE, <op>, <target>)`.
5. `<target>` is the class-wrapped scope for in-scope reads; the external path parameter for cross-scope reads.
6. `<op>` is `'read-dir'` for scope reads, `'read-file'` for path-targeted reads.
7. Write-side methods are NOT gated per #10457.

**Catalog implication:** The #10448 entry should now include this sub-variant as ESTABLISHED. Next codify ship (counter-cadence) can formalize this in the manifest.

## Reinforcement: #10456 — 9th audit-record-count variant

**Status:** ALREADY ESTABLISHED.

**v908 instance:** 3 audits under {search + listSessions + getStats}. Mixed-mode `ingestSessionLog` adds 1 audit when called (path-target, not scope-target). This is the first variant where the audit target VARIES between scope and external-path within the same class.

Prior variants:
- v892 outer-loop (1 outer × 8 inner)
- v896 derived-method ripple
- v897 mixed read/write
- v900 module-function direct-call
- v902 class-multi-method consolidated-gate (M=1)
- v904 class-instance parallel-method (independent paths)
- v905 composition
- v906 variable-by-branch + sibling-chokepoint
- v907 class-multi-method consolidated-gate (M=5)
- **v908 class-multi-method consolidated-gate (M=3+1 mixed) — variable audit target**

## Reinforcement: #10457 — read-side-only at write-bearing class

**Status:** ALREADY ESTABLISHED.

**v908 instance:** `ConversationStore` has 3 pure-read methods + 1 mixed-mode (read-then-write) + 2 pure-write + 1 helper. Only the read methods + the read-side of the mixed-mode method gate. Pure-write (ingestTurn, endSession) and write-init (init mkdirs) are out-of-scope.

## Carry-forward to v909+

1. **Class-multi-method consolidated-gate — now ESTABLISHED at 3-instance.** Counter-cadence codify ship can move this to the formal #10448 catalog entry.
2. **Class-instance multi-method read-side (1-instance from v904).** Still needs 2 more.
3. **Mixed sync+async two-site (1-instance from v905).** Needs 2 more.
4. **Sync multi-site same-path (1-instance from v906).** Needs 2 more.
5. **Dual-ctx convention (2-instance from v903 + v906).** Promotes if v909 carries both contexts.
6. **External-path-gated audit within consolidated-gate (1-instance from v908).** A sub-shape of the now-ESTABLISHED parent sub-variant; may not need its own promotion.
