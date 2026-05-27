# v1.49.815 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~6-8 tentative observations (UNCHANGED from v814).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `src/atlas/spatial/pmtiles-reader.ts` (201 lines) + `__tests__/pmtiles.test.ts` (258 lines) + `.planning/missions/gis-spatial-substrate/REVIEW.md:52-90` (the original HIGH-01 finding + named refcount fix) + `docs/release-notes/v1.49.629/README.md` (interim fix retrospective) + checked every importer (only the test file) BEFORE writing the refactor. Recon also collapsed the audit's "2-4 ships" T2.3 sizing to ~1-3 actionable by checking each named wedge's current state (math-foundations CLOSED, L-06 deferred-indefinitely, Gate 2 closed v676, Gate 3 needs more obs, SCRIBE caps forward-looking). |
| #10414 | Chokepoint retrofit, optional ctx? pattern | The test-only hooks (`__resetArchiveCacheForTest({ max? })`, `__getArchiveEntryForTest(path)`) follow the optional-`?:` shape — production callers don't see them; tests opt in. Same shape as the v782 LoaderContext + v806 EgressContext/ProcessContext chokepoint chips. |
| #10415 | Deferred-maintenance escalation | THE central application. HIGH-01 had lingered 185 ships (v629 → v815) with a named long-term fix sitting in the code as a forward note. Recon revealed it was the largest still-actionable wedge from the audit's T2.3 list. Closure: ~75-90 min. Confirms #10415's case-study shape — the original author writing "X is the long-term plan; this is the interim" is exactly the signal that #10415 escalates. |
| #10416 | Tolerant-generator / lightest wire | Resisted: refactoring `NodeFileSource` to hold the refcount itself (wrong layer — refcount must span the multi-`getBytes` `getZxy` operation); adding a generic `RefcountedLRU` abstraction (1 instance, premature); building `getArchiveStats()` ops surface (no consumer); exposing `closeRequested` in `pmtilesCacheStats()` return type (no consumer); migrating all 3 audit-named live wedges in one ship (each is independent; chain-mode optional). Chose: refcount at the cache-entry level + 2 tests + 2 stale-doc refreshes. |
| #10417 | Static-analysis tool authoring | N/A directly — refactor of existing module, not a new tool. But the lazy-singleton + test-hook pattern (`archiveCacheInstance()` + `__resetArchiveCacheForTest`) mirrors the test-harness shape of v793 `tools/` static analyzers. |
| #10422 | Verdict-pattern surface separation | Test-only hooks (observability surface) cleanly separated from production behavior (decision surface). The `__` prefix marks them; no production code paths through them. |
| #10426 | Cross-class registry extraction at 2nd instance | N/A — single module, single class. The refcount is a pattern with potential to generalize (a generic `RefcountedLRU<K, V>` could host this + future similar caches), but per #10416 the second instance isn't here yet. Deferred. |
| #10427 | Failure-mode contracts | `void entry.source.close()` is fire-and-forget; `NodeFileSource.close` swallows close errors (`try { ... } catch { /* swallow close errors */ }`). The failure mode IS forensic/best-effort: a close failure (e.g., already-closed fd from a previous race lost) has no consumer that would act on it. Documented in the file-level docstring. The matched contract is: close failures are silent because they're not load-bearing. |

## Tentative observations carried forward (~6-8 — UNCHANGED from v814)

No promotions this ship. The v810-814 chain's codification ship at v814 already promoted the 2 candidates that met the bar (#10431 + #10432). The remaining tentative observations remain below threshold (1-2 instances each).

## New observations flagged this ship (not promoted; not in count)

**Audit findings have a half-life; verify before acting.** Recon found 4 of 6 audit-named T2.3 wedges had self-closed or were deliberate defers in the 31 days since the v784 audit. Acting on the audit's wedge list at face value would have spent time on already-closed work. Pairs well with #10412 (recon-first) and #10422 (verdict-pattern surface separation) — the "audit list" is observability; the "wedge state today" is decision-surface, and they must be re-verified per ship. Tentative; not a candidate yet (1 instance, but a strong one).

**Original-author forward-flagging is the highest-signal trigger for #10415.** The v629 author wrote in the code: "Refcount-based close is the long-term plan; the grace window is the interim correctness guarantee." That single sentence survived 186 ships and was the recon-found anchor for v815's closure. Pattern: when the original author flags a known-incomplete fix as known-incomplete, the deferred-maintenance ledger is implicit in the code itself, not just in handoffs. Tentative; not a candidate yet (1 case study so far, but generalizable).

**Refcount belongs at the operation boundary, not the syscall boundary.** Initial sketch put refcount on `NodeFileSource` (per-`getBytes`); correct level is per-`getZxy` (the cache entry). Generalization: for any "in-flight protection" refcount, the right level is the boundary of the user-visible operation, not the boundary of the underlying primitive. Pairs with #10427 (failure-mode contracts at the surface boundary, not the primitive boundary). Tentative; not a candidate yet (1 instance).

**Lazy-singleton + test-hook pattern for module-level state.** `archiveCacheInstance()` recreates the LRU on first use + `__resetArchiveCacheForTest({ max })` clears the singleton + swaps the config. This pattern (lazy + reset + override) generalizes to any module-level singleton that needs test-time reconfiguration. Tools/ static analyzers already use a similar shape. Tentative; potentially a 2-instance promotion candidate at the next codify ship if the tools/ side is counted.

## Cross-references

- #10412 + #10415 → recon-first is the natural prerequisite to deferred-maintenance closure; verify the wedge is still a wedge before sizing the ship
- #10415 + #10416 → close the wedge at minimum credible threshold; resist the temptation to over-fix while you're in the area (the FlagLookup extract and c12 flake stay in their own ships)
- #10422 + #10427 → test-only hooks are the cleanest verdict-pattern application: production decision surface unchanged, observability surface explicit and isolated

## What this ship illustrates about T2.3 closure cadence

The audit's T2.3 sizing was based on a 2026-05-26 snapshot; the world moved on. Recon-first turned what looked like a 2-4 ship multi-wedge sweep into a 1-ship clean closure of the largest single wedge. The remaining T2.3 actionable candidates (c12 flake, FlagLookup extract) are independent, ship-shaped wedges that can be chained or interleaved with other Tier work at operator discretion.

The audit's named wedges that self-closed (math-foundations integration tests, v676 Gate 2 closure, v806 loader-context docstring) suggest the operational hygiene is healthier than the audit's pessimistic framing — the project does close wedges even between formal audit cycles. The audit's value is in surfacing the biggest *remaining* item (HIGH-01); v815 lands that.
