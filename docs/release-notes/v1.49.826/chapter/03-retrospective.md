# v1.49.826 — Retrospective

**Wall-clock:** ~30 min from chain-continuation to tag-push. Third (and final) ship of the v824-826 chain.

## Forensic finding: v823 handoff inaccuracy

The v823 handoff item #4 said T1.3 Option A "not yet shipped." That framing was incorrect — Option A's copper wire shipped at v1.49.810, 16 ships earlier (same day, 09:36 UTC per release-notes timestamp; chain timeline). The handoff author appears to have conflated two distinct concepts:

1. **The wire PATTERN** (onPredictions hook + emitPredictions fire-and-forget loop) — shipped at v810 in copper/activation.ts.
2. **The wire APPLICATIONS** (each NEW production caller of the pattern) — multiple ships' worth of work.

The recon doc `.planning/T1.3-RECON-2026-05-27.md` correctly flagged Option A's target as `src/chipset/copper/activation.ts` and stated Option A would close GAP-2 at minimum-credible. v810's release notes confirm that closure. The v823 handoff author then re-listed Option A as forward work — perhaps because they were thinking of "apply to a DIFFERENT call site" but didn't say so explicitly.

The fix in this ship: surface the inaccuracy in v826's README, and treat the operator's selection as the SPIRIT of item #4 — wire another production caller. The selector.ts pivot is consistent with the v823 handoff framing "Closes a different branch of the T1.3 GAP-2 substrate-to-consumer gap."

## What went as expected

- **The v810 wire pattern translated to selector.ts cleanly.** The wire shape (subscriber-gated hook + fire-and-forget invocation + swallowed errors) maps 1:1. selector.ts has a different shape (per-decision in a loop vs per-MOVE-instruction) but the wire is structurally identical. ~30 LOC delta matches the predicted size for "apply a known pattern in a new place."

- **#10426 second-instance threshold met cleanly.** The onPredictions pattern is now at 2 instances (v810 copper + v826 selector). Per #10426 (cross-class registry extraction at SECOND class instance), this is the codification threshold. Future codify ship can promote to a discipline doc.

- **Tests covered the wire structurally.** 3 new tests: hook fires per activated decision; subscriber-gated absence test; fire-and-forget error swallow. All pass; matches v810's test pattern exactly.

## What I noticed

- **The v823 handoff's "Closes a different branch" framing is the load-bearing phrase.** Without that framing, I might have stopped at "Option A already shipped, pick something else" and the operator would have lost a ship. The framing made it obvious that the SPIRIT — "wire another caller" — is what was meant.

- **Subscriber-gated default-off + flag-default-off is a 2-layer safety pattern.** Even with `onPredictions` set, the `predictNextSkills` returns empty unless the predictive-skill-loader's own flag is on. Two opt-ins required for actual prediction work. Mirrors the v810 ship's documented safety layers.

- **selector.ts is the right next caller.** It's the production skill SELECTOR (vs copper's MOVE-dispatch), called by `select()` exported function (used externally). Wiring here means a future production code path that uses select() can flip the hook on. Higher-impact than copper, which has zero production callers.

- **The handoff's predicted size (~30-45 min) held.** Actual: ~30 min. Recon (~5 min) + wire (~10 min) + tests (~10 min) + build/verify (~5 min). The cost prediction model for "apply a known wire pattern to a new caller" is calibrated.

## What surprised me

- **PipelineActivationDispatch has ZERO production callers.** Even though v810 wired the substrate-consumer pattern into copper/activation.ts, NO production code instantiates PipelineActivationDispatch. The pattern is wired but unused at runtime. selector.ts's `select()` is used; copper's is not. The chain's "is the substrate alive?" framing actually validates differently for different call sites — copper is alive in tests; selector is alive in production.

- **The wire pattern's wall-clock cost is sub-linear.** v810's first instance took ~45 min of recon + wire + tests. v826's second instance took ~30 min total. That's ~33% less for the second instance because the pattern is now load-bearing forward (recon is faster; the wire shape is mechanical).

## Risk that didn't materialize

- The selector's wire might have broken byte-identical flag-off paths (SC-FLAG-OFF contract from M6 sensoria). It didn't — `onPredictions` unset = no work runs, matching the v810 subscriber-gate pattern. The `flag-off-byte-identical.test.ts` tests in `src/orchestration/tool-attention/` continue to pass.

## Carried forward

- **onPredictions pattern at 2 instances** — eligible for next codify ship (#10426 threshold met). Candidate name: "Subscriber-gated observation hook pattern" or "onPredictions wire pattern."
- **v823 handoff inaccuracy** is now documented in v826's release notes; not a forward observation per se (it's a closed forensic finding).
- **Cross-rootdir wire pattern still at 1 instance** (v823 ObservationBridge). Wait for 2nd before codifying.
- **PipelineActivationDispatch zero-production-callers observation** (1 instance) — interesting but not a pattern yet.

## Chain retrospective (v824-826)

| Axis | Ship | Status |
|---|---|---|
| Calibrate (codify) | v824 | Promoted #10433 + #10434. Codify cadence reset. |
| Consume (chips) | v825 | git/core family fully closed (4 of 4 entries wired). KNOWN_UNWIRED Process 31 → 28. |
| Consume (wire) | v826 | onPredictions 2nd instance. T1.3 GAP-2 narrowed further. |

3-ship chain in ~85 min. All consume/calibrate-axis; no counter-cadence ticks (count UNCHANGED at 6); no NASA forward-cadence (now 44 consecutive at 1.178; pressure continues to build).

The chain validated #10433's prediction band (v825) and brought the onPredictions pattern to its 2nd instance (v826). Both are forward-tests of recently-codified or about-to-be-codified patterns. The discipline-as-data flywheel is producing observable signal.
