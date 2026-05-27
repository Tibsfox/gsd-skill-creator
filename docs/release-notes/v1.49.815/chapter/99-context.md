# v1.49.815 — Context

## Provenance

- **Source:** v784 audit (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`) §4 Tier 2 backlog, item T2.3 "Closure of escalated wedges (2-4 ships)."
- **Trigger:** Operator selected "begin tier 2" at session start; picked T2.3 over T2.1 (v1.50 decision) and T2.2 (discipline-coverage gate flip). Recon collapsed T2.3's "2-4 ships" sizing to ~1-3 actionable candidates; HIGH-01 selected as the largest single wedge.
- **Predecessor ship:** v1.49.814 (Codification Ship: Promote #10431 + #10432); shipped 2026-05-27 ~08:30 UTC. v810-814 chain closed at predecessor.
- **Session boundary:** Single-ship session-mode (not chained). Session-retro mission name: `v815-t2.3-high-01-pmtiles-refcount-close`.

## Why HIGH-01 specifically

Recon found that of the audit's 5-6 T2.3-named wedges:

| Wedge | Recon finding |
|---|---|
| Math-foundations integration tests | CLOSED already; 33/33 pass. Self-resolved sometime v784-v815. |
| L-06 Research-CSV schema-stability | DEFERRED indefinitely per v653 retro: "schemas stable across 695 milestones; no incident in flight." |
| v671 Gate 2 MUS/ELC card-template length | CLOSED at v676 cc1. |
| v671 Gate 3 sub-agent dispatch observability | DEFERRED pending obs#3+ accumulation; not yet justified. |
| HIGH-01 PMTiles refcount close | **OPEN. 185 ships old. Interim 30s grace at v629. Long-term refcount named in code comment.** |
| SCRIBE CAP-024/046/047/041 | OPEN but forward-looking deferrals (Tauri-native, chip-as-document silicon, Lean formal verification, viewer-embed), not stale wedges. |

HIGH-01 is the only audit-named wedge that genuinely qualifies under #10415 today. Recon-narrowing surfaced 2 additional T2.3-style candidates not on the audit list:

| Candidate | Status | Estimated cost |
|---|---|---|
| c12-load-kb-context flake | 5-month flake; re-flagged at v802 as "approaching deferral-cost threshold" | ~30-60 min |
| FlagLookup discriminated union extract | 30+ ships old (deferred at v796); #10426 second-instance candidate | ~30-40 min |

These remain live for next-session pickup.

## Why refcount, not the 30s grace

The v629 REVIEW.md `.planning/missions/gis-spatial-substrate/REVIEW.md:74-90` explicitly named refcount as the **proper fix** with options (a) refcount in-flight reads, (b) per-`getBytes` clone source (stateless but slower), (c) raise `max` + 30s grace (interim). v629 shipped (c). The code comment in `src/atlas/spatial/pmtiles-reader.ts:112-113` (post-v629) said: "Refcount-based close is the long-term plan; the grace window is the interim correctness guarantee."

The 30s grace bounds the race tolerance by wall-clock; the refcount bounds it by the actual in-flight `getZxy` duration. Refcount is correct independent of:
- Slow disk I/O (cold NFS, EBS gp2 burst depleted)
- Pmtiles@4's deferred root → leaf directory pattern (two sequential range reads inside one `getZxy`)
- Future server-side wiring that holds the archive ref across a longer operation

The refcount eliminates the race entirely; the 30s grace merely makes it improbable under typical load.

## Refcount level: cache entry, not NodeFileSource

Initial sketch placed refcount on `NodeFileSource` (per-`getBytes` increment). Rejected on reading the pmtiles@4 directory-traversal pattern: a single `archive.getZxy(z, x, y)` may issue 2-3 separate `source.getBytes(offset, length)` calls (root dir → leaf dir → tile data). Per-`getBytes` refcount drops to 0 between calls, opening a dispose window mid-`getZxy`. The correct level is per-`getZxy`, which is one layer up — at the cache entry. `fetchTileViaPMTiles` brackets the entire `getZxy` with acquire/release in try/finally. The refcount spans the whole user-visible operation.

## Test design: hooks + small max + 3 real fixtures

The eviction-race condition requires N+1 distinct archives where N is the cache's `max`. With `max: 64`, this is 65+ files — slow and noisy for a unit test. Added `__resetArchiveCacheForTest({ max })` test-only hook that swaps the LRU's `max` via a lazy-singleton (`archiveCacheInstance()`) so each test can configure the cache size before priming. Test uses `max: 2` + 3 real PMTiles fixtures built via `buildSymbolTilePyramid`. Direct mutation of `entry.inflight` (via `__getArchiveEntryForTest(path)`) simulates "in-flight" without needing a delay-injectable source. Spy on `NodeFileSource.prototype.close` makes the close call observable directly.

Two tests in a new describe block:
1. `closes the source immediately on eviction when inflight is 0` — happy path
2. `defers the source close on eviction when inflight > 0, then closes on release` — race path

Both assert against `closeSpy.mock.instances[0].filePath` to confirm the right source closed, not just that *some* close fired.

## Engine state crossover

NASA degree sustains at **1.178** for the 33rd consecutive ship. Counter-cadence count UNCHANGED at 6 (consume-axis wedge closure; not counter-cadence per #10430 tri-cycle).

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** this ship is consume-axis (close a substrate wedge that's been open across multiple ships).
- **Codify:** next codify ship expected v824-826 per #10428's ~7-10-ship spacing. v814 just promoted 2 lessons (manifest 22). No codify-axis investment this ship.
- **Calibrate:** wired and active (5 of 6 thresholds calibratable). No calibrate-axis investment.
- **Observe:** the stale wiring-doc refresh (max 4 → max 64 + refcount note) is observability-side cleanup; the test hooks are explicit observability surface for the refcount property.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.810-814-t1-3-chips-counter-cadence-codify-chain-shipped.md` for:
- The v810-814 chain summary (5 ships in ~175 min)
- The "Highest-ROI next ship candidates" table that included T2.3 wedge-closure as one of the 6 alternative paths
- The pre-existing untracked working-tree noise carried forward across this chain (and now this ship): `dashboard/index.html` (M), `.learn-staging/`, `dashboard/adoption.html`, `graphify-out/`

## Wedge ledger status post-v815

The audit's named T2.3 wedges resolve as follows post-v815:

| Wedge | Status |
|---|---|
| HIGH-01 PMTiles refcounted close | **CLOSED v815** |
| Math-foundations integration tests | CLOSED (already) |
| L-06 Research-CSV schema-stability | DEFERRED |
| v671 Gate 2 | CLOSED v676 cc1 |
| v671 Gate 3 | DEFERRED |
| SCRIBE CAP-024/046/047/041 | OPEN (forward-looking, not stale) |

Recon-surfaced additional T2.3-style candidates (not in original audit):

| Candidate | Status post-v815 |
|---|---|
| c12-load-kb-context flake | OPEN (5+ months) |
| FlagLookup discriminated union extract | OPEN (30+ ships) |

T2.3 is functionally exhausted of audit-named wedges. Future T2.3-style closures use the recon-surfaced backlog or new wedges as they accumulate (per #10415).
