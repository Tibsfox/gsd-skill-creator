# v1.49.892 — Fourth LoaderContext Chip: `dacp/bus/scanner.ts`

**Released:** 2026-05-28

## Why this ship

KNOWN_UNWIRED Loader ledger has 12 entries after v887/v889/v890. Per #10444 size-ascending discipline, the next-smallest is `src/dacp/bus/scanner.ts` at 174 LOC. The file exports TWO entry points (`scanForBundles` + `scanPriorityDirWithBundles`); the former calls the latter in a loop, but the latter is also exported and may be called directly. First chip in the campaign to surface the two-site hoisted-check sub-variant of #10448 — both entries gate independently.

## What's in this ship

- **`src/dacp/bus/scanner.ts`** UPDATED:
  - `ctx?: LoaderContext` added to `scanForBundles(config, targetAgent?, ctx?)`.
  - `ctx?: LoaderContext` added to `scanPriorityDirWithBundles(dirPath, priority, ctx?)`.
  - `ensureAllowed(ctx, 'dacp/bus/scanner', 'read-dir', config.busDir)` hoisted at top of `scanForBundles` before the priority loop.
  - `ensureAllowed(ctx, 'dacp/bus/scanner', 'read-dir', dirPath)` hoisted at top of `scanPriorityDirWithBundles` OUTSIDE the readdir try/catch (per #10442 — security denials must propagate).
  - `LOADER_SOURCE` constant for audit-record source field.
- **`src/dacp/bus/scanner.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.892)` describe block with 6 tests:
    - Counts the 9 audit records emitted under `scanForBundles` (1 outer + 8 priority subdirs).
    - Denial at `scanForBundles` outer gate.
    - Denial at `scanPriorityDirWithBundles` direct-caller gate.
    - Legacy permissive mode when `ctx` is undefined.
    - Prefix-pattern (`busDir + '/'`) admission.
    - Outer denial propagates BEFORE the priority loop runs (only 1 audit record).
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/dacp/bus/scanner.ts'` removed (12 → 11 entries).
  - Chip-down note added with v1.49.892 + sub-variant identifier.

## Wire shape

**Two-site hoisted-check** (#10448 sub-variant 2, FIRST instance in this campaign). Both exported entries take `ctx?: LoaderContext` and gate independently at the top of their bodies. When `scanForBundles` calls `scanPriorityDirWithBundles` in a loop, both gates fire (1 outer + 8 inner). When a caller invokes `scanPriorityDirWithBundles` directly, only the inner gate fires. No redundancy can be deduplicated without sacrificing the direct-caller admission.

**N=2 spawn sites.** Differs from v887/v889/v890 (each N=1). Per #10445, N drives wire shape; here N=2 forces two-site hoisted-check rather than single hoist-at-top.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- First two-site hoisted-check instance — promotion-eligible at 2nd instance.
- KNOWN_UNWIRED Loader 12 → 11.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED).
- Not a substrate auto-emit (v893 will be).
- Not a NASA degree advance (still 1.178; 110 consecutive ships at margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **110 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED — applies established patterns; no new lesson promotion).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader 12 → 11** (-1 via this chip).
Wired calibratable thresholds 6 of 7 (UNCHANGED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/dacp/bus/scanner.ts` (UPDATED)
- `src/dacp/bus/scanner.test.ts` (UPDATED — 6 new tests in `LoaderContext chokepoint integration (v1.49.892)` block)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 12 → 11 + chip-down note)
- `docs/release-notes/v1.49.892/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v892 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.891 → 1.49.892)
