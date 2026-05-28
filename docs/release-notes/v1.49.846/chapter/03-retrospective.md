
# v1.49.846 — Retrospective

**Wall-clock:** ~45 min from session-start (operator authorization) to release-notes draft. Most of the time was on the flake investigation + fix (vi.mock layer + fire-and-forget refactor) after the initial awaited implementation. The actual wires were ~5 min each.

## What went as expected

- **Pattern symmetry held.** copper/activation.ts and orchestration/selector.ts had structurally-identical `emitPredictions` / `_emitPredictions` methods. The wire pattern (move maxScore out of `if (fallback)`, add the append call) copied cleanly between the two.
- **The handoff named the work exactly.** "copper/activation.ts `emitPredictions` and orchestration/selector.ts `_emitPredictions` need to call `appendPredictiveLowConfidenceEvent` when fallback fires." The scope was bounded and verifiable.
- **AskUser at the right moments was load-bearing twice.** (1) Auto-emit gating (always-fire vs fallback-gated vs explicit flag) — operator picked always-fire, which led to moving maxScore outside `if (fallback)`. (2) Event-kind default (`not_useful` vs `useful` vs configurable) — operator picked `not_useful` to mirror v845. Both decisions were architectural and would have been wrong if chosen unilaterally.
- **vi.mock isolated tests cleanly.** Mock surface is one line at module-load; mock-spy assertions worked first try; no test rewrites needed beyond the new auto-emit-from-substrate describe blocks.

## What I noticed

- **The initial implementation awaited the append.** That serialized the chain: append → fallback. Under integration-test suite load, the disk-write inflated the chain's wall-clock past the 10ms drain budget. The flake was deterministic-in-load but invisible-in-isolation (single-file test passed; full pre-tag-gate failed).
- **Pollution before discovery.** The first integration-test run wrote 2 events to the operator's real calibration file before I noticed and added vi.mock. Removed by `head -12` truncation before re-running the gate.
- **The fire-and-forget refactor is structural cleanup, not a fix.** Even without the flake, awaiting the append was wrong: it makes a load-bearing serialization out of an observability surface. The integration-test flake just exposed the latent bug.
- **The integration test's mock is unusual.** Most integration tests deliberately exercise the real chain end-to-end. Adding vi.mock to an integration test is a tension — but the alternative is either pollution OR adding test-environment detection to library code. The mock is the least-surface choice; the integration test still verifies the WIRE shape (copper → fallback → registry → engine), it just stubs the JSONL-write leaf.

## What surprised me

- **The wire's gating design was load-bearing.** I considered three options for auto-emit gating in the AskUser. The operator picked "always when low-confidence" — which forced restructuring the existing `if (fallback)` block to extract maxScore. The cleaner code shape is a side-benefit of the gating decision.
- **The CLI/auto-recorder duality is now firmly 2 instances.** v803 token-budget was the original (CLI shipped first, /sc:status auto-recorder added later). v845/v846 is the second (CLI shipped v845, substrate auto-emit shipped v846). The pattern is eligible for codification at the next codify ship as a #10428 refinement.
- **The integration test gave the right kind of feedback.** A unit test would have passed (since unit tests mock everything). An integration test caught the suite-level latency interaction. The flake's first appearance during pre-tag-gate (not during my targeted test run) reinforced the value of running the full gate before declaring done.

## Risk that didn't materialize

- **No build regression.** TypeScript caught nothing — the new code is structurally simple.
- **No production-traffic concern.** The auto-emit is fire-and-forget with an inner catch; worst case is a swallowed disk error and a missed event. The calibration loop is robust to missing events (samples are accumulators).
- **No knock-on test failures.** Pre-tag-gate's full vitest suite (1946 files, 35,277 assertions) ran green after the flake fix.
- **No CLAUDE.md regeneration needed.** No discipline-docs edits this ship.

## What surprised me about the flake fix

- **Refactoring to fire-and-forget didn't require changing the assertion shape.** vi.mock spy assertions check that the function WAS CALLED (not that the returned promise resolved). The synchronous call site populates `spy.mock.calls[]` immediately; the test's `await new Promise((resolve) => setImmediate(resolve))` was already enough drain.
- **The integration test's mock was the actually-fragile fix.** The unit-test mocks I added work because the test owns the module-load context. The integration-test mock works because it's at the import boundary (vi.mock hoists before imports). If anything imports `appendPredictiveLowConfidenceEvent` BEFORE the integration test file's module load, the mock wouldn't take effect. The current import graph is clean.

## Carried forward (post-v846)

NEW this ship (3):

- **CLI manual + substrate auto-emit duality** — **2 instances** (v803 + v845/v846). Eligible at next codify ship as #10428 refinement.
- **Production-caller scope-reduction via path-narrowing** — **2 instances** (v845 CLI + v846 substrate auto-emit). Both call the underlying path directly rather than instantiating the wrapper class. Eligible.
- **Fire-and-forget over awaited for observability writes** — 1 instance. When a disk-write side effect is added to an existing fire-and-forget chain, the new write MUST also be fire-and-forget; awaiting it serializes the chain and bloats latency. Refinement candidate for #10437 subscriber-gated observability pattern. Wait for 2nd instance.

Inherited from earlier ships (unchanged):

- DI-executor + tokenized-argv wire shape (3 instances; eligible).
- Re-throw ProcessContextDenied from CLI swallow-catch (2 instances; eligible).
- Verify axis (2 instances; canonical-doc home set v844; numbered-lesson promotion pending).
- Bidirectional enforcement completeness (1-2 instances; classification ambiguous).
- All other single-instance observations from v841–845 cluster.

Still DEFERRED:

- Verify axis numbered-lesson promotion (canonical-doc set v844; pending codify ship).
- Bidirectional enforcement completeness classification.
- Help-text expansion in `src/cli/help.ts` to surface predict-next.

## Process retrospective

- **Single-ship session shape was right for this scope.** The auto-emit-from-substrate work was deliberately scoped to one ship per the v845 handoff. The work is naturally bounded (2 call sites, identical pattern, ~5 LOC each) and didn't need a cluster.
- **The flake fix was load-bearing for cluster quality.** Catching it during pre-tag-gate (not after a shipped tag) means v846 lands clean. A flaky ship would have either tripped CI on dev later, or — worse — silently passed in CI but caused intermittent failures for next-session work.
- **Total ship wall-clock ~45 min for: 2 substrate wires + 8 new vitest assertions + 1 integration-test mock + flake fix + 5 release-notes files.** The flake investigation added ~10 min vs the "happy path" estimate of ~30 min from the v845 handoff; net under-budget.
- **Cumulative across the v841–846 sequence: 6 ships, ~152 min wall-clock, closing 4 v840-deferred items + 1 v837 forward-flag + 1 v845-deferred item.** The "work through the list" directive continues to produce coherent operational throughput.

## What the next ship gets

- **Substrate auto-emit fully wired.** The next NASA ship, the next codify ship, or any other ship now has a live auto-recorder accumulating evidence in `.planning/patterns/predictive-low-confidence-events.jsonl`. The calibration loop runs over real data.
- **Forward path unchanged.** NASA 1.179 remains the strong default. The next codify ship now has 4 eligible candidates (verify axis numbered lesson, DI-executor wire shape, CLI swallow-catch rethrow, and the new CLI/auto-recorder duality).
- **Help-text gap explicit.** `src/cli/help.ts` should mention `predict-next` (and possibly other recent commands). Quick follow-on ship; ~15-30 min.
