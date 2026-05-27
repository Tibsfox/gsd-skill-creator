# v1.49.815 — Retrospective

**Wall-clock:** ~75-90 min from session-start to tag-push. Single-ship session-mode (not chained); first T2.3 wedge-closure from the v784 audit's Tier 2 backlog.

## What worked

**Recon collapsed the audit's "2-4 ships" sizing to ~1-3.** The audit listed 5-6 wedges under T2.3. Spending ~10 min checking each against current state found that of those, only HIGH-01 still qualifies under #10415: math-foundations integration tests pass 33/33 (CLOSED somewhere v784-v814, the audit's "~1-line fix" item self-resolved), L-06 is a deliberate defer per `docs/release-notes/v1.49.653/chapter/03-retrospective.md` ("schemas stable across 695 milestones; no incident in flight"), v671 Gate 2 closed at v676 cc1, v671 Gate 3 is deliberately pending obs#3+, SCRIBE caps 024/046/047/041 are forward-looking deferrals not stale wedges. Recon saved a multi-ship plan that would have spent time on already-closed work.

**The original REVIEW.md already specified the proper fix.** `.planning/missions/gis-spatial-substrate/REVIEW.md:74-90` explicitly named "(a) refcount: track in-flight reads against each archive and defer `dispose` until the count reaches zero" as the proper fix, with options (b) per-getBytes clone-source and (c) grace window. v629 shipped (c) as interim and noted refcount as the long-term plan. v815 just lands what v629 named. Zero design re-litigation needed.

**Refcount lives at the cache-entry level, not the NodeFileSource level.** Initial sketch was to add `inflightCount` + `closeRequested` to `NodeFileSource` itself. Rejected: `archive.getZxy()` makes multiple `source.getBytes()` calls under the hood (root dir → leaf dir → tile data per the pmtiles@4 deferred-directory pattern). Per-`getBytes` refcount would drop to 0 between calls, opening a dispose-fires-here window mid-`getZxy`. The refcount has to span the **whole** `getZxy` operation, which is one level up — at the cache-entry level. `fetchTileViaPMTiles` brackets `getZxy` with acquire/release in try/finally. This is a generalization of "the refcount unit is the operation, not the syscall."

**Only one production importer.** `grep -rn "from.*pmtiles-reader" src/ desktop/ src-tauri/` returned only the test file itself; the only production consumers (`fetchTileViaPMTiles`, `fetchTileForCoord`) are called from `src/atlas/spatial/server-ipc.ts` and the public API surface is unchanged. The cache-entry type change (`PMTiles` → `RefcountedArchive`) is internal-only. Refactor is safe.

**Test hook design avoided full-file-system pressure.** With `max: 64` baked in, exercising the eviction race in a unit test would have required 65+ small PMTiles fixtures — slow + noisy. Added `__resetArchiveCacheForTest({ max })` as a test-only hook that swaps the LRU's `max`. Lazy-singleton pattern (`archiveCacheInstance()`) lets the hook recreate the cache between tests. Test uses `max: 2` + 3 real fixtures = clean and fast.

**Spy-on-prototype-close + `__getArchiveEntryForTest` made the property directly observable.** Real `archive.getZxy()` calls complete in milliseconds — the deferred-close window would have been invisible to a black-box test. The test hooks expose the `inflight` / `closeRequested` fields so the test can simulate "in-flight" by direct mutation, then assert the spy fired (or didn't) in the expected order. Two crisp tests: immediate-close happy path, deferred-close race path.

**Stale-doc cleanup as side-discovery.** While searching for production importers, found two wiring docs (`UPSTREAM-WIRING.md`, `server-ipc-wiring.md`) still saying `max 4` — stale since v629. Folded the refresh into this ship (1-line edit each, ~30 seconds total). Cross-class cleanup for free.

## What surprised

**The math-foundations integration tests had self-closed.** The audit at v784 said "Two pre-existing `src/mathematical-foundations/__tests__/integration.test.ts` failures persist through ≥8 ships with a ~1-line fix." Today: 33/33 pass, 1 skipped. Closed somewhere between v784 and v815 without an explicit ship targeting it. A reminder that audit findings have a half-life; verify-then-act, not act-on-stale-snapshot.

**v676 cc1 already applied #10415 to Gate 2.** Checking `docs/release-notes/v1.49.676/README.md` for "Gate 2" found "Closes Gate 2 deferred candidate from v671." The pattern of converting deferred-debt to a deterministic gate was already in the workflow before #10415 was formally promoted. The discipline existed informally; promotion at v784 was codification-of-existing-practice, not introduction-of-new-practice.

**The v629 REVIEW.md is excellent forward-prep.** Reading it after recon, the original review-and-fix author named refcount as the proper fix, named the interim grace window as interim, AND wrote the named-as-such in the code comment that survived v629→v815 (186 ships). The deferred-maintenance escalation pattern works partly because the *original* author flagged the deferral as deferral, not as solved. #10415's case study is exactly this: when the original author writes "refcount-based close is the long-term plan; the grace window is the interim correctness guarantee" — believe it; come back; do the refcount when budget allows.

## What to watch

- **Concurrent close vs new-archive race.** If archive A is evicted with `inflight > 0` (closeRequested=true) AND a new `fetchTileViaPMTiles(pathA)` arrives between dispose and the final release, `getArchive(pathA)` will return a cache miss (A is no longer in the LRU) and create a NEW archive entry with a NEW NodeFileSource. The old entry's source closes on its own schedule when its inflight drains; the new entry is independent. Two file handles exist briefly. This is fine — fd cost is small, behavior is correct. Tests don't exercise this race but the logic flow is straightforward.

- **No production caller depends on the deferred-close semantics yet.** The current production server (Tauri IPC + Atlas dashboard) doesn't hold archive refs across long operations. The HIGH-01 race shape requires concurrent first-callers on N+1 distinct archives, which only manifests under multi-tenant load (`pmtiles_name` is a client-supplied query parameter per the v629 REVIEW). The refcount fix is preventive correctness; the production observable behavior is unchanged for current callers.

- **Pmtiles@4's directory-cache lifetime.** Each `PMTiles` instance holds an internal directory cache (root + leaf dirs). When the cache evicts a `RefcountedArchive` and a new fetch creates a fresh `PMTiles` for the same path, the new instance does its own root-dir fetch — small but not free. If eviction is frequent under load, this could be a watchable cost. Not measurable in current tests (LRU at 64 is plenty). Future observability could expose a per-path "archive recreates" counter via `pmtilesCacheStats()`; deferred per #10416.

## Verdict on scope

HIGH-01 closed at the smallest viable shape: refcount on the cache entry + 2 tests + 2 stale-doc refreshes + 1 pre-bump PROJECT.md update + 5 release-notes files. Resisted: refactoring NodeFileSource (wrong layer for refcount), adding a generic RefcountedLRU abstraction (1 instance), adding `getArchiveStats()` to expose `inflight` to ops dashboards (no consumer yet), wiring an eviction-rate metric (deferred), expanding test coverage to the concurrent-create-while-closing scenario (deferred — invariants are clear by inspection). Closed the audit's largest single T2.3 wedge.

After v815, T2.3 backlog stands at 2 of N actionable candidates: c12-load-kb-context flake (~30-60 min) + FlagLookup discriminated union extract (~30-40 min). Operator-discretion whether to chain these next or pivot to other Tier 2 items (T2.1 v1.50 decision, T2.2 discipline-coverage gate flip) or Tier 4 NASA forward-cadence.
