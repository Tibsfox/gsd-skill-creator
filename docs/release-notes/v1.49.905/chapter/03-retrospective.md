# Retrospective — v1.49.905

## What Worked

**Mixed sync+async ops on the same wire shape were trivial.** v903 was pure sync, v892 was pure async, v905 mixes both — and the LoaderContext interface admits both `'read-file'` ops without distinction. No interface change needed. The wire shape ("two-site hoisted-check") is a structural property; the sync/async dimension is orthogonal.

**Transitive gate composition is correct-by-construction.** `fetchTileViaPMTiles` gates its own `open()`, then calls `validatePMTilesMagic` which gates its own `readFileSync`. The audit emission of 2 per fetch call composes naturally — no special handling. This is the same pattern as v892's `scanForBundles` → `scanPriorityDirWithBundles` composition (which emits 9 audits per scanForBundles call).

**NodeFileSource didn't need a wire.** The cached `NodeFileSource` is instantiated inside `getArchive(path)` and called by pmtiles@4 internally. Gating at the orchestrator (`fetchTileViaPMTiles`) covers the disk touch without threading ctx into the Source class. Class-typed Source implementations whose lifetime spans many gated calls don't need their own ctx — the public entry covers them.

## What Could Have Been Better

**The audit-emission count of 2-per-fetch is slightly noisy.** Some forensic-audit consumers might prefer 1-per-fetch and treat the validate as an internal detail. But per #10448 discipline, external callers of `validatePMTilesMagic` (direct, not via `fetchTileViaPMTiles`) need their own audit, so we can't suppress the validate audit. The 2-per-fetch shape is the right design; the noise is acceptable.

## Lessons Learned

See [04-lessons.md](04-lessons.md). No new manifest-promoted lessons; v905 reinforces #10442, #10444, #10448 (with NEW mixed-sync-async-two-site sub-variant candidate), #10456 (with 6th variant — composition-driven count).
