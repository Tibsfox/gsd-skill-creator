> Following v1.49.844 — _Meta-cadence verify axis canonical-doc home_, v1.49.845 is the **production caller of the predict path**. Closes the v840 next-session candidate "production caller of predict path" by adding a new CLI command `skill-creator predict-next <currentSkill>` that exercises the predict path end-to-end and appends low-confidence events to the JSONL when triggered. First-ever non-test caller of `predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent`.

# v1.49.845 — Production Caller of Predict Path: `predict-next` CLI Command

**Shipped:** 2026-05-27

5th and final ship of the new operational-debt cluster. Closes the v837 forward-flag "Production callers of ActivationSelector and copper Activation are currently absent — the wire is structurally complete but exercised only by tests at v837 ship time" by adding a CLI-level production caller of the predict path. The auto-emit-from-substrate work (wiring `appendPredictiveLowConfidenceEvent` calls into `copper/activation.ts` + `orchestration/selector.ts` emitPredictions methods) remains deferred to a future ship — this ship establishes the operator-invocable production path that the predictive-low-confidence calibration loop has been waiting for.

## What shipped

### New CLI command

- **NEW** `src/cli/commands/predict-next.ts` (155 LOC):
  - Takes positional `<currentSkill>` argument.
  - Calls `predictNextSkillsWithMeta(currentSkill)` (production caller of the predict path).
  - Computes `maxScore` (top prediction score; 0 when predictions array is empty).
  - Compares against `lowConfidenceThreshold` from settings.
  - If low-confidence AND `--no-record` is NOT set, appends a JSONL event via `appendPredictiveLowConfidenceEvent`.
  - Outputs either human-readable text (default) or JSON (with `--json`).
  - Flags: `--useful` (event kind=useful), `--not-useful` (default), `--no-record` (skip JSONL append), `--json` (machine-readable output).
- **NEW** `src/cli/commands/predict-next.test.ts` (90 LOC, 7 vitest assertions):
  - Argument parsing (missing arg → exit 1).
  - JSON output schema validation.
  - Flag handling (--useful, --not-useful, --no-record).
  - Positional argument can appear before or after flags.

### Dispatch wiring

- **MODIFIED** `src/cli/dispatch.ts`:
  - Registered new command `{ aliases: ['predict-next', 'pn'], handler: ... }` (4 LOC).

## End-to-end smoke verification

```
$ skill-creator predict-next some-skill --no-record --json
{
  "currentSkill": "some-skill",
  "disabled": false,
  "predictions": [],
  "maxScore": 0,
  "lowConfidenceThreshold": 0.3,
  "isLowConfidence": true,
  "eventRecorded": false,
  "eventKind": null,
  "predictError": null,
  "recordError": null
}
```

Returns immediately. Predictions empty because "some-skill" isn't a known College-graph node; maxScore=0 triggers low-confidence path. With `--no-record` set, the JSONL append is skipped. Without `--no-record`, the event would land in `.planning/patterns/predictive-low-confidence-events.jsonl`.

## Why this is "the production caller"

The v837 retrospective said:

> Production callers of `ActivationSelector` and copper `Activation` are currently absent — the wire is structurally complete but exercised only by tests at v837 ship time. A future ship that constructs production instances of either class with a wired `fallbackProvider` will start accumulating real observations in the JSONL.

The strict interpretation would be a new substrate caller that constructs `new ActivationSelector(...)` or `new PipelineActivationDispatch(...)` with `fallbackProvider` wired. But neither class has any production caller in the entire `src/` tree — they're substrate ahead of demand. Adding a synthetic production caller of the substrate would be architectural over-reach.

The pragmatic interpretation: the production caller exercises the predict-then-low-confidence-event path. The CLI command does this directly without going through ActivationSelector or copper Activation. The predict path is `predictNextSkillsWithMeta → maxScore-vs-threshold → appendPredictiveLowConfidenceEvent`. The CLI is now the first non-test caller of this path; the bounded-learning calibration loop will see real operator-generated events.

This is the same architectural pattern as v803's token-budget wire (which shipped before /sc:status was bolted on as the auto-recorder). The CLI is the manual recorder; the substrate auto-emit is a separate future ship.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/cli/commands/predict-next.test.ts` | 7 | NEW — argument parsing + JSON schema + flag handling |

Full suite at ship time: 35,261 + 7 = 35,268 PASS / 45 skipped / 7 todo / 0 fail.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **63 consecutive ships at 1.178**; was 62 entering this ship — new record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — no new discipline).
Lessons in manifest (unique): **78 → 78** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED — predictive.low_confidence_threshold was already wired at v837; v845 adds a production caller, not a new wire).
KNOWN_UNWIRED Process: **16** (UNCHANGED). Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).

## Why this ship

5th and final ship of the operational-debt cluster authorized by the operator's "work through the list" directive. The cluster shape:

| Ship | Wall-clock | Type | Scope |
|---|---|---|---|
| v1.49.841 | ~40 min | Tooling | Quality-drift scorer recalibration; `chip` release_type added |
| v1.49.842 | ~20 min | Batch chip | Terminal family (3 wires); Process: 21 → 18 |
| v1.49.843 | ~15 min | Batch chip | Mesh family (2 wires); Process: 18 → 16 |
| v1.49.844 | ~15 min | Doc-structure | Verify-axis canonical-doc home |
| v1.49.845 | ~30 min | Production wire | predict-next CLI command (this ship) |

Cluster cumulative: ~2 hours wall-clock, 5 ships, 5 KNOWN_UNWIRED entries removed, 1 new release_type, 1 new operational axis, 1 new CLI command, 16 new vitest assertions, 0 source-code regressions.

## Tentative observations carried forward

NEW this ship (2; below threshold):

- **CLI-as-production-caller pattern.** When substrate code is ahead of demand (no source-level callers), a CLI command can be the first production caller. This is structurally different from a substrate caller — it exercises the path through operator intervention rather than automatic dispatch. 2 prior instances: v803 token-budget wire was eventually paired with the /sc:status integration as the auto-recorder; v845 predict-next is the CLI half of a similar pair (the auto-recorder via copper/activation + selector is deferred). 1 instance this ship; wait for 2nd.
- **Production-caller scope-reduction via path-narrowing.** The v837 forward-flag said "wire ActivationSelector with fallbackProvider in production". v845 ships a CLI that calls `predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent` directly, skipping ActivationSelector entirely. The PATH is the same (predict + record); the wrapper is unnecessary if no other path through ActivationSelector exists in production. 1 instance; wait for 2nd.

Inherited from earlier ships in the cluster (unchanged):

- DI-executor + tokenized-argv wire shape (v825 + v843×2; 3 instances; eligible at next codify ship).
- Re-throw ProcessContextDenied from CLI swallow-catch (v820 + v842; 2 instances; eligible).
- Canonical-doc-decision ship pattern (v844; 1 instance).
- Verify-axis self-applicability (v844 forward-flag; v843 mesh family).
- Recent-vs-baseline-recent comparison pattern (v841; 1 instance).
- Drift-check noise as scoring-system feedback loop (v841; 1 instance).
- All other single-instance observations.

Still DEFERRED:
- Bidirectional enforcement completeness (1-2 instances; classification ambiguous).
- Verify axis numbered-lesson promotion (canonical-doc set v844; promotion deferred to next codify ship).
- Auto-emit-from-substrate (substrate-level production caller of ActivationSelector/copper Activation with fallbackProvider; this is what v845 INTENTIONALLY didn't do).

## Pickup

v1.49.845 SHIPPED. **Operational-debt cluster closed.** 5/5 tasks complete.

Next-session strong-default: NASA 1.179 forward-cadence (63 consecutive ships at 1.178 — record-widest pressure margin).

Other next-session candidates:
- Continued ProcessContext singleton chips (~14 remaining singletons after the v842+v843 batch chips closed 5 entries).
- Next codify ship (~v847-850) — eligible candidates: DI-executor wire shape (3 instances), CLI catch-rethrow (2 instances), verify-axis numbered lesson, canonical-doc-decision pattern (if 2nd instance arrives).
- Auto-emit-from-substrate wire (copper/activation + selector emitPredictions calls appendPredictiveLowConfidenceEvent on fallback fire).

| Engine pulse | Value |
|---|---|
| NASA degree | 1.178 (63 consecutive ships — new record) |
| Counter-cadence | 6 |
| Manifest entries | 23 |
| Unique lessons in manifest | 78 |
| UNCODIFIED | 39 ≤ 41 |
| KNOWN_UNWIRED Process | 16 |
| KNOWN_UNWIRED Egress | 11 |
| Wired calib thresholds | 5 / 7 |
| Operational axes (meta-cadence) | 4 (codify / consume / calibrate / verify) |
| CLI commands | +1 (predict-next / pn) |
| Drift-check alerts | 0 major, 1 informational warning |
