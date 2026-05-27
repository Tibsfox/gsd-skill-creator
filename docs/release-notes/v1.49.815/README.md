> Following v1.49.814 — _Codification Ship: Promote #10431 + #10432_, v1.49.815 opens the T2.3 wedge-closure ship from the v784 audit's Tier 2 backlog. Closes HIGH-01 PMTiles archive cache eviction race (185 ships overdue from v629) by replacing the 30-second grace-window setTimeout with refcounted dispose: the underlying `source.close()` defers until the entry's inflight `getZxy` count drains to zero. Eliminates the use-after-close race entirely under any in-flight duration.

# v1.49.815 — T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)

**Shipped:** 2026-05-27

T2.3 wedge-closure ship from the v784 audit's Tier 2 backlog (per `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` §4). Operator-selected from a recon-narrowed list of 3 actually-still-open #10415 deferred-maintenance candidates (most of the audit's named wedges had already closed; this is the largest remaining single wedge at 185 ships overdue).

The v629 gis-spatial-substrate REVIEW.md identified the archive-cache eviction race and shipped option (c) — raise `max` to 64 + 30-second grace-window setTimeout — as the **interim** correctness guarantee, with refcount-based close named in the code comment as the long-term plan. v815 lands the long-term plan.

## What shipped

- **MODIFIED** `src/atlas/spatial/pmtiles-reader.ts` — replaces `LRUCache<string, PMTiles>` with `LRUCache<string, RefcountedArchive>` where each entry tracks `inflight` reads + a `closeRequested` flag. `dispose` checks `inflight`: if zero, closes the source immediately; otherwise marks `closeRequested = true`. `fetchTileViaPMTiles` brackets `archive.getZxy(...)` with `entry.inflight++` / `entry.inflight--` in try/finally; the release-decrement that brings count to zero triggers any pending close. The 30s grace-window setTimeout (`ARCHIVE_CLOSE_GRACE_MS`) is removed entirely — refcount provides correctness independent of in-flight duration.
- **MODIFIED** `src/atlas/spatial/__tests__/pmtiles.test.ts` — adds 2 tests in a new `archiveCache refcounted dispose (HIGH-01 refcount close)` describe block: (1) immediate close on eviction when `inflight === 0`; (2) deferred close on eviction when `inflight > 0`, then close fires on the final release. Tests use `__resetArchiveCacheForTest({ max: 2 })` to make the eviction race observable with 3 real PMTiles fixtures.
- **MODIFIED** `src/atlas/spatial/UPSTREAM-WIRING.md` + `src/atlas/spatial/server-ipc-wiring.md` — refresh the stale `max 4` references (it's been 64 since v629) and document the refcounted dispose semantics.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh of `Latest shipped release` from v812 to v814 (drift was at 2/3 going into v815's bump — would have hit 3/3 BLOCK post-bump without the refresh).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| PMTiles refcounted dispose | +2 | immediate-close path + deferred-close-then-drain path |
| **Total added** | **+2** | 34,697 → 34,699 in `npm test` (root + space-between projects) |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 33 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — wedge-closure ship, not a new discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~6-8 (UNCHANGED).

## Audit-retrospective wedge ledger

| Wedge (per audit §4 T2.3) | Status at v814 | Status at v815 |
|---|---|---|
| HIGH-01 PMTiles refcounted close (since v629; 185 ships) | OPEN — interim 30s grace; refcount named in code | **CLOSED — refcount-based dispose replaces grace window** |
| Math-foundations integration tests (audit-flagged) | CLOSED (already; 33/33 pass) | unchanged |
| L-06 Research-CSV schema-stability (audit-flagged) | DEFERRED (no incident) | unchanged |
| v671 Gate 2 MUS/ELC card-template (audit-flagged) | CLOSED at v676 cc1 | unchanged |
| v671 Gate 3 sub-agent dispatch observability (audit-flagged) | DEFERRED (needs obs#3+) | unchanged |
| SCRIBE CAP-024/046/047/041 (audit-flagged) | OPEN as forward-looking deferrals | unchanged |

Recon found that of the audit's 5-6 named wedges, **only HIGH-01 genuinely qualified under #10415 today** — the other items either closed since the v784 audit or are deliberate defers. T2.3's "2-4 ships" sizing collapses to ~1-3 actionable ships at current state. Two live candidates surfaced from recent handoffs (c12-load-kb-context flake, FlagLookup extract) remain open for future ships.

## Why refcount, not the 30s grace

The v629 interim fix tolerated the race by buying 30 seconds of grace between dispose and actual close — enough for "typical" in-flight `getZxy` calls (single-tile fetch, ~ms-scale). The fix does NOT tolerate:

- Slow disk I/O (cold NFS, EBS gp2 burst depleted) where a single range read might exceed 30s
- Pmtiles@4's deferred root → leaf directory pattern where total `getZxy` latency is the sum of two sequential range reads
- Future server-side wiring that holds the archive ref across a longer operation

Refcount is bounded by the actual in-flight duration, not a fixed wall-clock. The fd survives every in-flight `getZxy` regardless of how long it takes. The 30s grace constant is removed.

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip — atlas spatial substrate is server-side observability, not security.
- Not a new substrate; refactors existing pmtiles-reader internals.
- Not a behavior change for callers — public API surface is byte-identical (only the internal cache-entry shape changes).

## Forward path

- **c12-load-kb-context flake** (~30-60 min) — 5-month flake re-flagged at v802 as "approaching threshold where deferral cost exceeds fix cost." Next T2.3 #10415 candidate.
- **FlagLookup discriminated union extract** (~30-40 min) — second-instance registry extract per #10426; 4 CLI commands share the shape.
- **Batch chip aminet family ProcessContext** (5 files) — apply v811 batch pattern to ProcessContext.
- **NASA 1.179 forward-cadence** — 33 consecutive at 1.178; most visible open item.
- **T1.3 Ship 2 = Option B** — ObservationBridge wire (next T1.3 phase).
