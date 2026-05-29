# v1.49.907 — Thirteenth LoaderContext Chip: `memory/file-store.ts`

**Released:** 2026-05-29

## Why this ship

Continues the multi-chip LoaderContext campaign. Per #10444 size-ascending: with the four sub-300-LOC entries chipped (v903-v906), `memory/file-store.ts` (516 LOC) is now the unique-smallest entry. The file is a `MemoryStore`-implementing class with multiple public read methods chaining into private fs-op methods — the same structural shape as v902's `ProjectStateReader`. This makes v907 the second instance of v902's class-multi-method consolidated-gate sub-variant.

## What's in this ship

- **`src/memory/file-store.ts`** UPDATED:
  - `ctx?: LoaderContext` added as optional 2nd constructor parameter on `FileStore(memoryDir, ctx?)`. Stored as `private readonly ctx?: LoaderContext` (per #10455 idiom).
  - `LOADER_SOURCE = 'memory/file-store'` constant.
  - 5 public read methods each hoist `ensureAllowed(this.ctx, LOADER_SOURCE, 'read-dir', this.memoryDir)` at top:
    - `get(id)` — gates above `findFileById` + `readRecord` + transitive `store()` (which is write-side, out-of-scope).
    - `query(q)` — gates above `readAllRecords`.
    - `has(id)` — gates above `findFileById`.
    - `count()` — gates above `listMdFiles`.
    - `list()` — gates above `readAllRecords`.
  - Write-side methods (`store`, `remove`) and helper `ensureDir` NOT gated — out-of-scope per #10457.
- **`src/memory/__tests__/memory-service.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.907)` describe block with 6 tests:
    - `list` emits 1 audit per call (scope-gated on memoryDir).
    - `count` emits 1 audit per call.
    - Throws `LoaderContextDenied` when ctx rejects memoryDir on `list`.
    - `store` does NOT gate (write-side, 0 audits per #10457).
    - 8th #10456 variant: 4 audits under {list + count + has + query} = exact N read-side count.
    - Legacy permissive mode preserves prior behavior.
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/memory/file-store.ts'` removed (3 → 2 entries).
  - v907 chip-down note documents 2nd-instance promotion of v902 sub-variant.

## Wire shape

**Class-multi-method consolidated-gate — SECOND INSTANCE of v902 sub-variant.** v902's `ProjectStateReader.read()` was the first instance (1 public entry orchestrating N private fs ops). v907's `FileStore` is the second (5 public read methods each orchestrating private fs ops). Both share:

- Class-stored `private readonly ctx?: LoaderContext` (per #10455 idiom).
- Public method hoists `ensureAllowed` on the wrapping scope (planningDir / memoryDir).
- Private fs ops inherit the gate via transitive call.
- Write-side methods explicitly out-of-scope per #10457.

**Discriminator from v902:** v902 had 1 public method; v907 has 5. The wire SHAPE is the same — gate-at-public-method-on-scope; only the COUNT of public methods differs. This suggests the sub-variant generalizes from "1 public + N internal" to "M public + N internal" with no structural change.

**Promotion status:** With 2 instances (v902 + v907), the sub-variant candidate moves from 1-instance to 2-instance. One more instance (v908 conversation-store.ts is a likely candidate — same memory-store family as file-store) would promote to ESTABLISHED at 3-instance per the standard discipline.

**Audit emission shape (8th #10456 variant):** 1 audit per public read-method call. {list + count + has + query} = 4 audits exact. Distinct from v904's 4-audit variant: v904's count came from 4 PARALLEL methods on independent fs ops; v907's count comes from 4 PARALLEL methods on the SAME scope (memoryDir).

## What this ship is

- A forward-cadence security-chokepoint chip per #10432.
- **The 2nd instance of v902's class-multi-method consolidated-gate sub-variant — PROMOTES the candidate toward 3-instance.**
- An 8th #10456 audit-record-count variant (parallel methods on same scope).
- A reinforcement of #10455 idiom (class-stored ctx) at multi-method scale.
- KNOWN_UNWIRED Loader 3 → 2.

## Engine state

- NASA degree: **1.178** (125 consecutive ships).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 3 → 2** (-1).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).
