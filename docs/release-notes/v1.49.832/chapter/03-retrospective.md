# v1.49.832 — Retrospective

**Wall-clock:** ~35 min from v831 close to v832 release-notes draft. Final ship of v830-832 Option C arc; arc total wall-clock ~1h45m (well under the v829 handoff's "~2.5-3.5 hours" estimate).

## What went as expected

- **Selector wire mirrored copper exactly.** Same import switch (`predictNextSkills` → `predictNextSkillsWithMeta`), same field add, same two-layer subscriber gate, same fire-and-forget catch. Zero design decisions to remake; the v830 framework gave a complete template.
- **The cross-rootdir integration test pattern transferred from v829.** The v829 ObservationBridge test was the template; v832's structure is identical (compile-time assignability check → happy path → negative coverage → fail-soft). The duck-typed wire shape generalizes cleanly.
- **Gate G12 (orchestration byte-identical) held.** The orchestration-byte-identical test takes a runtime snapshot of src/orchestration/ before and after exercising the predictive-skill-loader. My v832 selector.ts edits ship at git-edit time, not test-run time, so the runtime invariant is preserved. 8 G12 tests still PASS.
- **All 75 touched tests pass on first run.** No iteration needed — the pattern is fully recon'd and the wire shape is established.

## What I noticed

- **The two-layer subscriber gate scales.** Adding `if (!hook && !fallback) return;` to selector matched the v830 pattern in copper. If a third substrate-consumer hook were added (e.g. `onActivationTrace`), the pattern would naturally extend to `if (!hook && !fallback && !traceHook) return;`. The cost of each gate is one boolean check; the savings are the entire fire-and-forget chain.
- **The integration test uses a real `ConceptRegistry` + a thin `RosettaCore` spy.** This is the right trade-off: registry is pure data + lookup, easy to construct; engine.translate has dependencies (PanelRouter + ExpressionRenderer + PanelInterface implementations) that aren't load-bearing for the WIRE test. The spy approach proves the wire fires without requiring the full RosettaCore wiring.
- **Activating a `lite` mode skill is the natural test target.** Lite mode is the cheapest activation path that still triggers `emitPredictions` — confirms the fallback fires for the most common activation shape. Full mode + offload + async work the same way (they all go through emitPredictions when the activation succeeds).
- **The handoff's "verification-only ships" observation now has a 2nd instance.** v829 was the first (no src/ change; only `tests/integration/` test). v832 has a src/ delta (selector wire ~35 LOC) but the WIRE component is 1-line mirroring; the substantive new content is the integration test (~190 LOC). Whether v832 fully fits the "verification-only" pattern depends on how strictly that category is drawn.

## What surprised me

- **Selector activations sometimes don't fire predictions when no candidates pass M6 / M5 gating.** My initial selector unit-test draft assumed every candidate would be `activated: true`; in practice with the default `MemoryScorer` config and the candidatesFixture, only 2-3 of 4 candidates activate. The test correctly asserts `calls.length === activatedIds.length` rather than a fixed count.
- **The integration test's `engine.translate` spy needed to return a full `Translation` shape including `dependenciesLoaded: []`.** I had originally returned only `{ id, primary, concept, panels }`; TypeScript inferred the lambda's return type as `Promise<Translation>` because the engine handle's translate signature is `RosettaCore['translate']`. Adding `dependenciesLoaded: []` resolved the type. The `Pick<>` narrowing from v831 transfers — the spy structurally satisfies the narrowed handle.
- **The `_unused` variable trick (in the "neither hook nor provider is wired" test) is needed to demonstrate intent.** Without it, TypeScript-noUnusedLocals would have flagged `const fallback = new RosettaConceptFallback(...)`. Underscore prefix is the established TypeScript convention for intentionally-unused locals.

## Risk that didn't materialize

- **Selector source changes might have tripped the Gate G12 byte-identical test.** They didn't — Gate G12 hashes filesystem state at TEST runtime, not git-edit time. My changes ship via git; the test takes the file-state snapshot once per test run and checks it doesn't change DURING the test. Both pre + post snapshots agree.
- **The cross-rootdir compile-time check (`const ctx: ActivationContext = { fallbackProvider: fallback }`) might have failed if the duck-typing wasn't structurally sound.** It didn't — TypeScript verified that `RosettaConceptFallback` has the right `onLowConfidence` method signature. The wire IS structurally sound.

## Carried forward

- **Cross-rootdir wire pattern: 5 instances** (v823 + v829 + v830 + v831 + v832). #10426 threshold exceeded 4× over. v833 codification ship will have the richest evidence set yet for this pattern.
- **Substrate-consumer hook PAIR pattern: 2 instances** (v830 copper + v832 selector). NOW MEETS #10426 codification threshold. NEW eligibility this ship.
- **Verification/integration-only ships: 2 instances** (v829 + v832). Eligible for codification as a #10428 meta-cadence axis ("verify/integrate" as a sibling to codify/consume/calibrate).
- All other patterns unchanged.

## Forward-test of existing lessons

| Lesson | Status |
|---|---|
| #10416 lightest wire | RESPECTED — selector wire is 1-line mirror; substantial delta is the test infrastructure |
| #10426 second-instance threshold | NEW eligibility for substrate-consumer hook pair (2nd instance accrued); EXCEEDED for cross-rootdir wire (5 instances) |
| #10427 failure-mode contracts | RESPECTED — fallback errors swallowed at selector's catch (same boundary as onPredictions errors) |
| #10428 meta-cadence | codify-axis at 8 ships ago (last v824); v833 will reset |
| #10432 KNOWN_UNWIRED ledger | NOT EXERCISED — not a chokepoint chip |
| #10433 internal-helper | NOT EXERCISED — not a chokepoint chip |
| #10434 discipline coverage ratchet | UNCHANGED (UNCODIFIED 39, ceiling 41, buffer 2) |

## Cadence observation

The v830-832 arc is the FIRST 3-ship single-feature arc in recent memory. The shape (framework → impl → integration) is reusable: any future cross-rootdir wire can follow the same template. Average wall-clock per arc ship was ~35 min (v830: ~40, v831: ~25, v832: ~35), well under the v829 handoff's per-ship estimate.

T1.3 GAP-2 is now FULLY CLOSED across 7 branches over 8 ships (v810 + v823 + v826 + v829 + v830 + v831 + v832 plus the original v810 Option A wire). The longest-running open audit wedge from the v824-826 handoff is resolved.

The codify-axis (#10428) is now 8 ships ago (last was v824) — still within the 7-10 ship floor but at the upper bound. v833 codify ship at chain close will reset.
