# Retrospective — v1.49.898

## What Worked

**Test caught an order-of-events bug at first run.** Initial accumulation assertion was `expect(values).toEqual([1, 1, 1, -1, -1])` — index-by-index match. The test failed: actual was `[1, 1, 1, 1, -1]`. Investigation revealed that `runTokenBudgetCeilingCheck` is synchronous but fires off an async `appendFile` Promise (per #10437 fire-and-forget). Five back-to-back synchronous calls spawn five Promise chains that complete in undefined order at the filesystem layer. The test asserted a behavior the substrate doesn't guarantee. The fix shifted the assertion to count-based: 3 of +1, 2 of -1, net=+1. The fail-then-fix exposed a documentable property of fire-and-forget substrates that wasn't obvious from reading the code: **synchronous substrates spawning fire-and-forget Promises do not preserve call order at the filesystem**. Captured as a 1-instance candidate.

**v894 pattern reused at near-zero adaptation cost.** The structural skeleton (beforeEach/afterEach with mkdtempSync, waitForAutoEmit via 50ms setTimeout, threshold-by-name lookup pattern, missing-file + malformed-line tolerance assertions) carried over from v894 byte-equivalently. The adaptation surface was only the substrate-specific concerns: outcome-driven kind (v898) vs default-fixed kind (v894); sync substrate vs async substrate. ~30 minutes from skeleton to passing tests vs estimated ~60 minutes if authoring from scratch.

**Outcome-driven substrate adds two test categories not in v894.** Beyond the standard substrate→calibration end-to-end shape, v898 needed boundary equality (usagePercent === max_percent → blocked) and defaultKind override path. The first is a property of the strict-less-than semantics that v894 doesn't have (the v891 substrate doesn't have an inequality at all — kind is fixed by the operator at call time). The second is a path operators take when they want to record a specific polarity regardless of outcome. Both categories surfaced naturally from reading the v893 source; not present in v894's template. The codify ship will need to note these as outcome-driven-substrate-specific test categories.

**Third instance closes the substrate→calibration end-to-end pattern.** v856 predictive-low-confidence + v894 observation-retention + v898 token-budget-max-percent = 3 instances. All three share:
- temp dir setup
- substrate-side write call
- 50ms fire-and-forget wait (#10454)
- calibration-loop read call
- polarity assertion (single-event + multi-event with net-polarity check)
- missing-file tolerance
- malformed-line tolerance

But each adds substrate-specific subtleties: v856 (predictive inverse polarity), v894 (default-fixed kind + override), v898 (outcome-driven kind + boundary equality + autoEmit suppression). The pattern is the common shape; the variations are documentable in the codify ship.

## What Could Be Better

**Substrate-spawn-order non-determinism is a footgun.** The initial test failure happened because the test author (me) didn't realize the sync substrate would still spawn async writes. Reading `runTokenBudgetCeilingCheck` line-by-line shows it: a synchronous function that schedules `.catch(()=>{})` on a Promise. The behavior is correct-by-design per #10437 (fire-and-forget, observability-only). But the failure mode is silent at unit-test scale (each call ends before the next begins so order matches) and only emerges at integration-test scale (multiple back-to-back calls share an event loop tick). Future codify ship should document this as a sub-pattern of #10454: "synchronous substrate spawning fire-and-forget Promises requires order-independent assertions."

**v898 ships within budget but well before the 10-ship trigger.** Budget allowed shipping anywhere from v893+1 through v903. Operator chose v898 (5 ships in) rather than waiting until v903. This is a discretionary choice — earlier vs later within budget — but no analysis happened around the choice. Future counter-cadence ships might benefit from a recorded heuristic: "ship verify-axis closing-moves when an opening exists (e.g., between forward-cadence ships) rather than waiting until the canonical 10-ship trigger." A 1-instance candidate in v898 (same heuristic as v894's 3-ships-after-wire).

**No corresponding production caller wired into the actual token-budget enforcement path.** v893 added `runTokenBudgetCeilingCheck` as a callable function, but no production code path (e.g., skill-loader pre-check, package-load gate) calls it yet. The substrate exists; the consumer doesn't. This is a known gap per the v893 retro and is not in scope for v898 (verify-axis is about proving the wire works, not adding new wires). Future ship should connect the dots — likely as part of the consumer-axis budget per #10428.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail)
