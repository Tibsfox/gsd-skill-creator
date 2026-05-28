> Following v1.49.845 — _Production caller of predict path: predict-next CLI command_, v1.49.846 is the **auto-recorder half** of the v803 manual+auto duality pattern. Wires `appendPredictiveLowConfidenceEvent` into both `src/chipset/copper/activation.ts` (`emitPredictions`) and `src/orchestration/selector.ts` (`_emitPredictions`) so the JSONL accumulates calibration evidence automatically whenever a low-confidence prediction triggers during normal operation — independent of fallback wiring. Completes the v837 substrate gap that v845's CLI half partially closed.

# v1.49.846 — Auto-emit-from-substrate: predict-low-confidence Event JSONL Wired into Both Production emit-prediction Call Sites

**Shipped:** 2026-05-28

Pairs with v1.49.845 to complete the v803 CLI-manual + substrate-auto duality pattern for the `predictive.low_confidence_threshold` calibratable threshold. v845 was the CLI half (operator runs `skill-creator predict-next ...`). v846 is the substrate half (every low-confidence prediction in copper or selector auto-records a JSONL event with kind=`not_useful`). The calibration loop now accumulates evidence from real production traffic without requiring operator invocation.

## What shipped

### Code wires (2 production call sites + import)

- **MODIFIED** `src/chipset/copper/activation.ts` (`PipelineActivationDispatch.emitPredictions`):
  - Top-of-file import of `appendPredictiveLowConfidenceEvent` from `src/bounded-learning/predictive-low-confidence-events.js`.
  - Inside the fire-and-forget `Promise.resolve().then(...)` chain: moved `maxScore` computation out of the `if (fallback)` block so the low-confidence branch evaluates regardless of fallback wiring.
  - When `maxScore < lowConfidenceThreshold`: kick off `appendPredictiveLowConfidenceEvent({ timestamp, kind: 'not_useful' })` as a non-awaited promise with its own inner `.catch(() => {})`.
  - Fallback dispatch still serializes (awaited as before) after the auto-emit kickoff.

- **MODIFIED** `src/orchestration/selector.ts` (`ActivationSelector._emitPredictions`):
  - Mirror of the copper wire (same import, same pattern, same fire-and-forget shape).
  - Inline comment cross-references copper as the canonical site.

### Test coverage (+8 vitest assertions)

- **MODIFIED** `src/chipset/copper/activation.test.ts` (+4 assertions):
  - `vi.mock` of `appendPredictiveLowConfidenceEvent` at module load so test runs don't pollute `.planning/patterns/predictive-low-confidence-events.jsonl`.
  - New describe block "auto-emit-from-substrate (v1.49.846)" with 4 assertions:
    1. Low-confidence + fallback wired → append called once with `{kind:'not_useful', timestamp:ISO8601}`.
    2. Low-confidence + only `onPredictions` wired (no fallback) → append still called once (independence from fallback).
    3. Neither hook nor fallback wired → append not called (gated by subscriber pattern #10437).
    4. Append rejects → activation still succeeds (failure-mode contract #10427).

- **MODIFIED** `src/orchestration/__tests__/selector.test.ts` (+4 assertions):
  - Mirror of copper's auto-emit test block (one assertion per activated decision; otherwise identical shape).

- **MODIFIED** `tests/integration/copper-rosetta-fallback-wire.integration.test.ts`:
  - Added `vi.mock` of `appendPredictiveLowConfidenceEvent` at the top of the file.
  - Required because the integration test exercises the real copper → fallback chain; without the mock, every test run would write events to the operator's calibration file AND the disk-write latency would push the 10ms drain budget into flake territory.

## Why fire-and-forget (not awaited)

Initial implementation awaited `appendPredictiveLowConfidenceEvent` before invoking `fallback.onLowConfidence`. The integration test then flaked under suite load — the disk write inflated the chain's latency past the test's 10ms drain budget.

Refactored to fire-and-forget with an inner `.catch(() => {})` (peer to the outer `.catch` that swallows fallback errors). The auto-emit is observability, not load-bearing: a failed JSONL append must NOT delay or block the fallback dispatch.

Per failure-mode contracts (#10427): observability surfaces fail silently and run in parallel with load-bearing surfaces; load-bearing surfaces fail loudly and serialize as needed.

## Why default kind=`not_useful`

The calibration loop interprets event polarity for `predictive.low_confidence_threshold`:
- `useful` event (operator confirmed the low-confidence prediction was valuable) → favor RAISING the threshold (fire more often).
- `not_useful` event (default; no operator confirmation) → favor LOWERING the threshold (fire less often).

Substrate auto-emit has no operator-feedback channel at the time of dispatch, so the conservative default mirrors the v845 CLI parseArgs default. Operators can override via the CLI (`skill-creator predict-next <skill> --useful`) when they confirm a useful low-confidence dispatch.

## Why the auto-emit is independent of fallback wiring

The maxScore + low-confidence comparison was previously inside `if (fallback)`. v846 moves it OUTSIDE so the auto-emit fires whenever the predict path returns low-confidence, regardless of which subscriber is wired. Three rationales:

1. **Calibration evidence is independent of fallback consumption.** A low-confidence prediction is a true event whether or not anything acts on the fallback.
2. **`onPredictions`-only subscribers (telemetry without fallback) should still feed the calibration loop.** The threshold should converge whether deployments wire only the hook, only the fallback, or both.
3. **Symmetric with v845 CLI.** The CLI doesn't have a fallback — it calls the predict path directly and records on low-confidence. Substrate auto-emit follows the same rule.

The outer subscriber gate (`if (!hook && !fallback) return`) is preserved — the predict path runs only when some subscriber wants prediction work. No-subscriber call sites pay zero cost.

## Test impact

| Surface | Before | After | Delta |
|---|---|---|---|
| `src/chipset/copper/activation.test.ts` | 21 | 25 | +4 |
| `src/orchestration/__tests__/selector.test.ts` | 15 | 19 | +4 |
| `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` | 4 | 4 | 0 (mock added, no new assertions) |

Full suite at ship time: 34,778 → 34,786 PASS / 39 skipped / 7 todo / 0 fail. Pre-tag-gate 17/17 PASS.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **64 consecutive ships at 1.178**; was 63 entering this ship — new record by 1).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23 → 23** (UNCHANGED — no new discipline; #10428 duality refinement is a tentative observation only).
Lessons in manifest (unique): **78 → 78** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED — `predictive.low_confidence_threshold` was already counted as wired; v846 adds production write callers but doesn't change wired count).
KNOWN_UNWIRED Process: **16** (UNCHANGED). Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
Production write callers of predict-low-confidence-event path: **1 (v845 CLI) → 3 (v845 CLI + copper/activation + orchestration/selector)** — first time the substrate auto-emit will accumulate JSONL evidence from real operator traffic.

## Why this ship

Closes the next-session candidate #2 from the v841–845 cluster handoff: "Auto-emit-from-substrate wire (~30-45 min) — copper/activation.ts `emitPredictions` and orchestration/selector.ts `_emitPredictions` need to call `appendPredictiveLowConfidenceEvent` when fallback fires. Currently neither does. Pairs with v845 CLI as the (CLI manual + substrate auto) duality from v803's pattern."

v845's retrospective already named this gap explicitly. v846 closes it.

## Tentative observations carried forward

NEW this ship (3; mostly below threshold):

- **CLI manual + substrate auto-emit duality** — now **2 instances** (v803 token-budget + v845/v846 predict-low-confidence). Eligible at next codify ship as #10428 refinement: "calibration thresholds typically need TWO production callers — CLI manual + automatic auto-emit from substrate. Ship the CLI first (manual recorder), substrate auto-emit second (auto recorder)."
- **Production-caller scope-reduction via path-narrowing** — now **2 instances** (v845 CLI + v846 substrate; both call the underlying path directly rather than a wrapper class). Eligible at next codify ship.
- **Fire-and-forget over awaited for observability writes** — 1 instance (v846; the original awaited version flaked the integration test under suite load). Refinement of #10437 subscriber-gated observability pattern: when adding a disk-write side effect to an existing fire-and-forget chain, the new write MUST also be fire-and-forget; awaiting it serializes the chain and bloats latency. Wait for 2nd instance.

Inherited from prior ships (unchanged):

- DI-executor + tokenized-argv wire shape (v825 + v843×2; 3 instances; eligible).
- Re-throw ProcessContextDenied from CLI swallow-catch (v820 + v842; 2 instances; eligible).
- Verify axis (v829 + v832; 2 instances; canonical-doc home set at v844; numbered-lesson promotion pending).
- Bidirectional enforcement completeness (1-2 instances; classification ambiguous).
- All other single-instance observations from v841–845 cluster.

Still DEFERRED:

- Verify axis numbered-lesson promotion (canonical-doc set v844; pending codify).
- Bidirectional enforcement completeness classification.
- Help-text expansion in `src/cli/help.ts` to mention `predict-next`.

## Pickup

v1.49.846 SHIPPED. **Substrate auto-emit pair COMPLETE.** v845+v846 closes the v803 duality pattern for the predict-low-confidence threshold.

Next-session strong-default: NASA 1.179 forward-cadence (64 consecutive ships at 1.178 — new widest-pressure-margin record).

Other next-session candidates (unchanged from v845 handoff):
- Continued ProcessContext singleton chips (~14 remaining).
- Next codify ship (~v847-850) — now has **4 eligible candidates** with v846 promoting two more: verify axis, DI-executor (3 inst), ProcessContextDenied re-throw (2 inst), and the new #10428 CLI/auto-recorder duality (2 inst).
- Help-text expansion to surface `predict-next` and other recent commands.

| Engine pulse | Value |
|---|---|
| NASA degree | 1.178 (64 consecutive ships — new record) |
| Counter-cadence | 6 |
| Manifest entries | 23 |
| Unique lessons in manifest | 78 |
| UNCODIFIED | 39 ≤ 41 |
| KNOWN_UNWIRED Process | 16 |
| KNOWN_UNWIRED Egress | 11 |
| Wired calib thresholds | 5 / 7 |
| Operational axes (meta-cadence) | 4 (codify / consume / calibrate / verify) |
| Predict-low-confidence production write callers | 1 → 3 (v845 CLI + v846 copper/selector) |
