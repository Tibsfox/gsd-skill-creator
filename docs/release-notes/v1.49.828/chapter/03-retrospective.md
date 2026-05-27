# v1.49.828 — Retrospective

**Wall-clock:** ~20 min from recon-start to tag-push. Third consecutive batch-chip ship; fastest in the chain.

## What went as expected

- **All 3 files have homogeneous spawn-with-helper shape.** available.ts has `probeCommand` (2 callsites). netlistsvg-driver has `spawnNetlistsvg` (1 callsite). yosys-driver has `spawnYosys` (1 callsite). All three follow the same pattern.
- **All 3 require the #10427 hoist.** Each helper's Promise constructor has a `try { spawn(...) } catch { reject(NetlistRenderError) }` or `catch { resolve(false) }`. The reject DOES propagate (NetlistRenderError is thrown), but ProcessContextDenied would be wrapped, losing the original error class. Hoisting the check OUT of the try keeps ProcessContextDenied as-is.
- **The `'spawn'` op-tag works at family scale.** First batch where all 3 files use spawn rather than execFile/exec. The chokepoint API accepted the new op-tag without any audit-test changes.
- **Wall-clock fastest of the chain.** ~20 min vs v827's ~30 min and v825's ~30 min. The third application of the batch-chip pattern within one chain produces measurable speedup — discovery cost continues to decline.

## What I noticed

- **All 3 files cluster at ~10 LOC.** The simplicity comes from: (1) single internal helper per file, (2) at most 2 callsites per file, (3) hoisted check is one line. The #10433 prediction band's low end (~14 LOC) was anchored on files with more callsites; 1-callsite-with-helper files land at ~8-12 LOC.

- **NetlistRenderError wrapping was a near-miss.** If I'd put the check INSIDE the Promise's try, ProcessContextDenied would have been caught and wrapped into a NetlistRenderError with `stage='netlistsvg'` and `spawnError=...`. The chokepoint denial would still propagate as a thrown error, but the error class would be wrong. #10427's "hoist outside swallowing try/catch" was the right call.

- **available.ts uses Promise.all over 2 probes.** When hoisting the check inside `probeCommand`, the check fires synchronously when the function is called. `Promise.all([probeCommand(yosysBin, ...), probeCommand(netlistsvgBin, ...)])` — both probes are called synchronously, but the check fires for each. If yosys is denied but netlistsvg is allowed, the first check throws and the second never fires. That's correct behavior: a denial denies the whole batch.

- **isAvailable has a CACHED return path.** If `CACHED` is set, isAvailable returns it without calling probeCommand. That means subsequent calls don't trigger the check. Is this a security issue? Probably not — the cache stores the boolean result, not commands. Re-probing happens only after `_resetCache()`. Acceptable.

## What surprised me

- **The #10433 LOC band held for spawn-based files at the low end.** The band was calibrated on execFile-based files (v820 + v825 + v827 extractor). spawn-based files at 1 callsite land slightly lower (~10 vs ~12). Small but observable.

- **No new lesson candidates surfaced.** This is the third batch-chip in the chain; the pattern is now extremely mechanical. The #10433 LOC band may merit a refinement table (1-callsite → ~10 LOC; 5-10 → ~14-18; 10-15 → ~18-22; 15+ → ~22-26), but that's the same observation already carried forward from v825 ("LOC-band-by-callsite-count refinement"). Now at 3 ships of evidence — eligible for codification at next codify ship.

## Risk that didn't materialize

- The audit-test might have flagged the 3 files as unwired after removal from KNOWN_UNWIRED if the check pattern didn't match. It didn't — the chokepoint API accepts the `'spawn'` op-tag, and the audit-test greps for `ensureProcessAllowed(` calls regardless of op-tag.

## Carried forward

- The scribe/netlist-renderer family is fully closed.
- LOC-band-by-callsite-count refinement for #10433: now at 3 ships of evidence (v825 batch, v827 dogfood batch, v828 scribe batch). Move to "ready for next codify ship".
- DI-executor + hoisted-check refinement of #10433: still at 1 ship of evidence (v827). Wait for 2nd.
- Next batch candidate: dogfood was 3, scribe was 3, terminal is 2 (cli/commands/terminal + terminal/launcher + terminal/session — actually 3, check again), mesh is 2 (mesh-worktree + proxy-committer), intel/analyzer is 2 (findings/stalled + git). Multiple 2-3-file batches still available.

## Forward-test of existing lessons

| Lesson | Status | Evidence |
|---|---|---|
| #10433 internal-helper | CALIBRATED low-end | 3 spawn-based files at ~10 LOC; band low end is ~8-12 |
| #10427 failure-mode | LOAD-BEARING | All 3 hoists driven by #10427; preserves ProcessContextDenied error class |
| #10432 KNOWN_UNWIRED ledger | REAFFIRMED (5th instance) | 25 → 22; block-comment consolidation applied |
| #10416 lightest wire | RESPECTED | No cross-rootdir threading; legacy-permissive when ctx undefined |

## Cadence observation

3 consecutive consume-axis ships (v825 + v827 + v828) at ~25-30 min wall-clock each. Codify-axis cadence floor at 7-10 ships; last codify was v824 (4 ships ago — within range for forward-cadence). The 3-batch run validates #10433 + #10427 jointly without producing new lesson candidates. The pattern is now mature.
