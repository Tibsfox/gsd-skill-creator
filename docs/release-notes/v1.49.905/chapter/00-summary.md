# v1.49.905 — Eleventh LoaderContext Chip: `atlas/spatial/pmtiles-reader.ts`

**Released:** 2026-05-29

## Why this ship

Continues the multi-chip LoaderContext campaign. Per #10444 size-ascending: `skill-event-store.ts` (222 LOC) chipped at v904; `pmtiles-reader.ts` (262 LOC) is the next unique-smallest entry. The file has two distinct exported fs-touching entry points — a sync magic-byte validator and an async tile fetcher — which makes it the natural site for a mixed sync+async two-site hoisted-check.

## What's in this ship

- **`src/atlas/spatial/pmtiles-reader.ts`** UPDATED:
  - `ctx?: LoaderContext` added as optional 2nd parameter on `validatePMTilesMagic(path, ctx?)`.
  - `ctx?: LoaderContext` added as optional 5th parameter on `fetchTileViaPMTiles(path, z, x, y, ctx?)`.
  - `ctx?: LoaderContext` added as optional 3rd parameter on `fetchTileForCoord(pmtilesPath, coord, ctx?)` — passes through to `fetchTileViaPMTiles`.
  - `LOADER_SOURCE = 'atlas/spatial/pmtiles-reader'` constant.
  - `validatePMTilesMagic` hoists `ensureAllowed(ctx, LOADER_SOURCE, 'read-file', path)` ABOVE the try/catch ENOENT swallow (per #10442) — gates the sync `readFileSync`.
  - `fetchTileViaPMTiles` hoists `ensureAllowed(ctx, LOADER_SOURCE, 'read-file', path)` at the top of the function — gates the async `open` performed by the cached `NodeFileSource` on first `getBytes` call. Then calls `validatePMTilesMagic(path, ctx)` which emits a second audit record.
  - `NodeFileSource` class unchanged — it's instantiated internally by `getArchive(path)` and called by pmtiles@4 library; the gate at the orchestrator entry covers its first-call disk touch.
- **`src/atlas/spatial/__tests__/pmtiles.test.ts`** UPDATED:
  - New `pmtiles-reader LoaderContext chokepoint integration (v1.49.905)` describe block with 5 tests:
    - `validatePMTilesMagic` emits exactly one audit record per call.
    - `validatePMTilesMagic` throws `LoaderContextDenied` ABOVE the try/catch ENOENT swallow (#10442 invariant).
    - `fetchTileViaPMTiles` emits 2 audits per call (own gate + transitive validatePMTilesMagic gate) — v892 two-site discipline.
    - `fetchTileForCoord` passes ctx through to `fetchTileViaPMTiles`.
    - Legacy permissive mode preserves prior behavior.
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/atlas/spatial/pmtiles-reader.ts'` removed (5 → 4 entries).
  - Chip-down note added with v1.49.905 + mixed-sync-async-two-site identifier.

## Wire shape

**Module-function two-site hoisted-check with MIXED sync+async ops.** NEW sub-variant of #10448. Two distinct exported entry points each gate independently:

| Site | Op type | LoaderOp tag | Gate location |
|---|---|---|---|
| `validatePMTilesMagic` | sync `readFileSync` | `read-file` | Top of function, above try/catch |
| `fetchTileViaPMTiles` | async `open` (via NodeFileSource) | `read-file` | Top of function, above all archive operations |

**Discriminator from prior two-site wires:**

| Ship | Wire shape | Op type | Notes |
|---|---|---|---|
| v892 dacp/bus/scanner.ts | async two-site | pure async (`readdir`, `stat`) | ESTABLISHED |
| v903 cli/commands/keystore.ts | sync two-site | pure sync (`existsSync`) | 1-instance candidate |
| **v905 atlas/spatial/pmtiles-reader.ts** | mixed sync+async two-site | sync (`readFileSync`) + async (`open`) | THIS SHIP (1-instance) |

The novelty: the two entry points use DIFFERENT op types. v892 was all async; v903 was all sync; v905 mixes. The wire shape is otherwise identical — both sites gate independently via `ensureAllowed`. The mixing is observational, not structural.

**Audit emission shape:**

- `validatePMTilesMagic(path, ctx)` → 1 audit per call.
- `fetchTileViaPMTiles(path, z, x, y, ctx)` → 2 audits per call (1 own + 1 transitive via `validatePMTilesMagic`).
- `fetchTileForCoord(pmtilesPath, coord, ctx)` → 2 audits per call (delegates to `fetchTileViaPMTiles`).

This is the 6th #10456 audit-record-count variant: fixed 2 audits per public call (v905 fetchTileViaPMTiles) on a wire where the count comes from internal call composition, not from the gate hoist alone.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- A NEW 1-instance sub-variant candidate for #10448: mixed sync+async two-site.
- A 6th #10456 audit-record-count variant data point.
- KNOWN_UNWIRED Loader 5 → 4.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED).
- Not a substrate auto-emit or new threshold wire.
- Not a NASA degree advance (still 1.178; 123 consecutive ships at margin record).

## Engine state

- NASA degree: **1.178** (123 consecutive ships).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 5 → 4** (-1).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).
