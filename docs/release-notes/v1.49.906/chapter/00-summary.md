# v1.49.906 — Twelfth LoaderContext Chip: `aminet/emulated-scanner.ts`

**Released:** 2026-05-29

## Why this ship

Continues the multi-chip LoaderContext campaign. Per #10444 size-ascending: with `pmtiles-reader.ts` (262 LOC) chipped at v905, `emulated-scanner.ts` (287 LOC) is the next unique-smallest entry. The file already carries a `ProcessContext` (v861); this chip adds `LoaderContext` for the existsSync + readFileSync surfaces, demonstrating sibling-chokepoint coexistence on a 2-function module.

## What's in this ship

- **`src/aminet/emulated-scanner.ts`** UPDATED:
  - `ctx?: LoaderContext` added as optional 2nd parameter on `loadKnownGoodHashes(filePath, ctx?)`.
  - `loaderCtx?: LoaderContext` added as optional 3rd parameter on `runEmulatedScan(config, ctx?, loaderCtx?)` — separate from the existing `ctx?: ProcessContext` per #10449.
  - `LOADER_SOURCE = 'aminet/emulated-scanner'` constant (mirrors existing `PROCESS_SOURCE`).
  - **Site 1**: `loadKnownGoodHashes` gates existsSync at top with `'exists-check'` op.
  - **Site 2**: `loadKnownGoodHashes` gates readFileSync after the existsSync early-return guard, with `'read-file'` op.
  - **Site 3**: `runEmulatedScan` gates fsUaePath existsSync at top with `'exists-check'` op — separately from the ProcessContext gate that follows for execFile spawn.
- **`src/aminet/emulated-scanner.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.906)` describe block with 5 tests:
    - `loadKnownGoodHashes` emits 1 audit when file missing (site-1 only, early return).
    - `loadKnownGoodHashes` emits 2 audits when file exists (sites 1 + 2).
    - `loadKnownGoodHashes` throws `LoaderContextDenied` on site-1 when ctx rejects path.
    - `runEmulatedScan` emits 1 LoaderContext audit on fsUaePath existsSync (site 3) when fsUaePath is missing; spawn never happens.
    - Legacy permissive mode preserves prior behavior.
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/aminet/emulated-scanner.ts'` removed (4 → 3 entries).

## Wire shape

**Module-function multi-site mixed-chokepoint.** 3 sync sites across 2 module functions. Two distinct properties combine:

1. **Multi-site on same path** (sites 1 + 2 in `loadKnownGoodHashes`): existsSync followed by readFileSync, both on `filePath`. Both gated to preserve audit-count signal (1 = missing, 2 = read).
2. **Sibling chokepoint coexistence** (`runEmulatedScan`): ProcessContext (v861) + LoaderContext (v906) thread independently. Per #10449, no aggregation — each ctx is a separate optional param.

**Audit emission shape (7th #10456 variant):**

- `loadKnownGoodHashes(missingFile, ctx)` → 1 audit.
- `loadKnownGoodHashes(existingFile, ctx)` → 2 audits.
- `runEmulatedScan(missingFsUae, ctx, loaderCtx)` → 1 LoaderContext audit + 0 ProcessContext (spawn never reached).
- `runEmulatedScan(presentFsUae, ctx, loaderCtx)` → 1 LoaderContext audit + 1 ProcessContext (spawn fires).

Variable-count by branch behavior, with sibling-chokepoint audit channels also coexisting. Distinct from v903's variable-count keystore.ts (single chokepoint).

## What this ship is

- A forward-cadence security-chokepoint chip per #10432.
- A 7th #10456 audit-record-count variant data point.
- A reinforcement of #10449 (sibling chokepoints stay separate) at a second-instance file — `keystore.ts` v903 was the first.
- KNOWN_UNWIRED Loader 4 → 3.

## Engine state

- NASA degree: **1.178** (124 consecutive ships).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 4 → 3** (-1).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).
