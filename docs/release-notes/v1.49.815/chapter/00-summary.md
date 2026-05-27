# v1.49.815 — T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)

**Released:** 2026-05-27
**Type:** T2.3 wedge-closure ship (#10415 deferred-maintenance discipline application)
**Predecessor:** v1.49.814 — Codification Ship: Promote #10431 + #10432
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** Close HIGH-01 PMTiles archive cache eviction race (open since v629; 185 ships overdue). Replace 30-second grace-window setTimeout with refcounted dispose: `source.close()` defers until the entry's inflight `getZxy` count drains to zero.

## Summary

First T2.3 wedge-closure ship from the v784 audit's Tier 2 backlog. The audit listed ~5-6 wedges under T2.3 (math-foundations integration tests, L-06 Research-CSV, v671 Gate 2/3, HIGH-01 PMTiles, SCRIBE caps 024/046/047/041); recon found that of those, only HIGH-01 genuinely qualified under #10415 today. The rest either closed since the audit (v676 cc1 closed Gate 2; v806 closed loader-context docstring wedge; math-foundations tests now pass 33/33) or are deliberate defers (L-06 "no incident"; Gate 3 "needs obs#3+ before tooling justified"; SCRIBE caps are forward-looking, not stale wedges).

The HIGH-01 closure is the biggest, oldest single wedge (185 ships from v629). The v629 REVIEW.md explicitly named refcount as the **proper fix** and the 30s grace window as the **interim correctness guarantee**. v815 lands the proper fix.

## What changed

`src/atlas/spatial/pmtiles-reader.ts`:

- `archiveCache` value type: `PMTiles` → `RefcountedArchive` (`{ archive, source, inflight, closeRequested }`)
- Cache instantiation: top-level constant → lazy singleton via `archiveCacheInstance()` so the test hook can swap `max`
- `dispose` callback: `setTimeout(() => void src.close(), 30_000)` → refcount-aware (close immediately if `inflight === 0`; else mark `closeRequested = true`)
- `fetchTileViaPMTiles`: brackets `archive.getZxy(...)` with `entry.inflight++` / `entry.inflight--` in try/finally; the decrement that brings count to zero AND finds `closeRequested === true` triggers the pending close
- `ARCHIVE_CLOSE_GRACE_MS = 30_000` constant removed (no longer needed)
- New test-only exports: `__resetArchiveCacheForTest({ max? })` (swaps the LRU `max`) + `__getArchiveEntryForTest(path)` (peeks at the entry's `inflight` / `closeRequested` fields)
- Updated docstrings: file-level "Concurrency invariants" + `NodeFileSource` + `RefcountedArchive` types all reflect refcount semantics

`src/atlas/spatial/__tests__/pmtiles.test.ts`:

- New describe block `archiveCache refcounted dispose (HIGH-01 refcount close)` with 2 tests:
  - `closes the source immediately on eviction when inflight is 0` — happy path; eviction of an idle entry closes its source on the next microtask
  - `defers the source close on eviction when inflight > 0, then closes on release` — race path; eviction marks `closeRequested`, fd survives, then the simulated release closes it

`src/atlas/spatial/UPSTREAM-WIRING.md` + `server-ipc-wiring.md`:

- Refresh stale `max 4` (was correct only pre-v629) → `max 64` + refcounted dispose note

`.planning/PROJECT.md`:

- Pre-bump update of `Latest shipped release` line from v812 to v814 (would have hit drift=3/3 BLOCK at the next pre-tag-gate without this refresh)

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/atlas/spatial/pmtiles-reader.ts` | MODIFIED | ~30 LOC delta: type change + refcount logic + test hooks. 247 → 261 lines total. |
| `src/atlas/spatial/__tests__/pmtiles.test.ts` | MODIFIED | +2 tests + 2 imports. 16 → 18 tests in file (216 → 216 for full atlas suite — only this file changed). |
| `src/atlas/spatial/UPSTREAM-WIRING.md` | MODIFIED | 1-line refresh. |
| `src/atlas/spatial/server-ipc-wiring.md` | MODIFIED | 1-line refresh. |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump latest-shipped refresh. |
| `docs/release-notes/v1.49.815/` | NEW | 5 files: README + 4 chapter files. |

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `pmtiles-reader.ts` (201 lines) + `pmtiles.test.ts` (258 lines) + `.planning/missions/gis-spatial-substrate/REVIEW.md:52-90` (the original HIGH-01 finding with the named refcount fix) + v629 retrospective + checked every importer (only the test file) BEFORE writing the refactor. Recon found: (a) only one production importer, refactor is safe; (b) two wiring docs reference stale `max 4`; (c) the original REVIEW.md already specified refcount as the proper fix — no design space to re-litigate. |
| #10414 | Chokepoint retrofit, optional ctx? pattern | `__resetArchiveCacheForTest({ max? })` is the test-only hook with the same optional-`?` shape as the chokepoint chip pattern — no caller churn for production. |
| #10415 | Deferred-maintenance escalation | THE central application. HIGH-01 had lingered 185 ships with a named long-term fix sitting in the code as a forward note. Closure cost: ~75-90 min including release notes. The deferral cost was unbounded fragility under arbitrarily-long in-flight reads. |
| #10416 | Tolerant-generator / lightest wire | Resisted: refactoring `NodeFileSource` itself to track refcount (the refcount belongs at the cache-entry level since `getZxy` makes multiple `source.getBytes` calls across a single operation); adding `getArchiveStats()` to expose `inflight` to ops dashboards (no concrete consumer yet); building a generic `RefcountedLRU` abstraction (1 instance, premature). Chose: minimal cache-entry refcount + 2 tests + 2 doc refreshes. |
| #10417 | Static-analysis tool authoring | Doesn't apply directly here, but the test-hook pattern (`__resetArchiveCacheForTest`) follows the same lazy-singleton + override-via-options shape used in tools/ static analyzers. |
| #10422 | Verdict-pattern surface separation | Test-only hooks (`__resetArchiveCacheForTest`, `__getArchiveEntryForTest`) are observability surface — separate from the production close-decision surface (the cache dispose callback). |
| #10426 | Cross-class registry extraction at 2nd instance | N/A — single class, single use site. |
| #10427 | Failure-mode contracts | The `void entry.source.close()` calls in dispose and in `fetchTileViaPMTiles` finally are FIRE-AND-FORGET — the close itself swallows errors (`NodeFileSource.close` has `try { ... } catch { /* swallow close errors */ }`). Documented in the file-level docstring. The failure-mode contract is: close failures (e.g., already-closed fd) are silent because they're forensic, not load-bearing. |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip (atlas spatial is observability, not security).
- Not a substrate addition (refactors existing internals; public API unchanged).
- Not a behavior change visible to callers (`fetchTileViaPMTiles` / `fetchTileForCoord` semantics identical).
- Not a closure of the entire T2.3 backlog — 2 other live candidates remain (c12 flake, FlagLookup extract).

## Verification

- `npx tsc --noEmit` → clean.
- `npm run build` → PASS.
- `npx vitest run src/atlas/spatial/__tests__/pmtiles.test.ts` → 18 PASS / 0 fail (was 16; +2 new tests).
- `npx vitest run src/atlas/` → 216 PASS / 0 fail (all atlas tests).
- Full root + space-between suite: 34,697 → 34,699 PASS / 0 fail / 39 skipped / 7 todo.
- `bash tools/pre-tag-gate.sh` → see step 1 below.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 33 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

This is a forward consume-axis ship (audit-driven wedge closure); does not tick counter-cadence per #10430's tri-cycle.

## Forward path

Two more T2.3 #10415 candidates remain live from recon:
1. **c12-load-kb-context flake** (~30-60 min) — 5-month flake re-flagged at v802. The next T2.3 candidate that #10415 might justify spending a ship on.
2. **FlagLookup discriminated union extract** (~30-40 min) — second-instance registry extract per #10426 across 4 CLI commands.

Non-T2.3 paths:
3. **Batch chip aminet family ProcessContext** (5 files) — apply v811 batch pattern.
4. **NASA 1.179 forward-cadence** — 33 consecutive at 1.178.
5. **T1.3 Ship 2 = Option B** — ObservationBridge wire.
