
# v1.49.845 — Production Caller of Predict Path: `predict-next` CLI Command

**Released:** 2026-05-27

## Why this ship

5th and final ship of the new operational-debt cluster. Closes the v837 forward-flag "Production callers of ActivationSelector and copper Activation are currently absent" by adding a CLI-level production caller of the predict path. The auto-emit from substrate code (wiring `appendPredictiveLowConfidenceEvent` calls into copper/activation.ts + orchestration/selector.ts) remains deferred — this ship establishes the operator-invocable production path that the predictive-low-confidence calibration loop has been waiting for since v837.

## The CLI command

`skill-creator predict-next <currentSkill>` (or alias `pn`).

Workflow:
1. Call `predictNextSkillsWithMeta(currentSkill)` to get predictions + lowConfidenceThreshold.
2. Compute maxScore (top prediction; 0 if empty).
3. If maxScore < threshold AND `--no-record` is NOT set, append a low-confidence event to `.planning/patterns/predictive-low-confidence-events.jsonl`.
4. Output predictions + threshold + recorded event (if any).

Flags:
- `--useful` — record event kind=useful (operator found fallback useful).
- `--not-useful` — record event kind=not_useful (default; fallback fired but operator didn't act on it).
- `--no-record` — skip JSONL append (predict-only mode).
- `--json` — machine-readable output.

## Why "production caller" via CLI not substrate

The v837 forward-flag literally said "wire `RosettaConceptFallback` into production copper/selector construction paths". But neither `ActivationSelector` nor copper `Activation` (`PipelineActivationDispatch`) has any production caller anywhere in `src/` — they're substrate ahead of demand. Adding a synthetic production caller of the substrate would be architectural over-reach.

The path the v837 wire actually depends on is:
`predictNextSkillsWithMeta → maxScore-vs-threshold → appendPredictiveLowConfidenceEvent`

The CLI calls this path directly without going through ActivationSelector or copper Activation. The PATH is the same; the wrapper is unnecessary if no other path through ActivationSelector exists in production.

This mirrors v803's token-budget wire: the CLI shipped first as the manual recorder; the auto-recorder via /sc:status was bolted on later. v845 ships the CLI half; the substrate auto-emit (wiring appendPredictiveLowConfidenceEvent into copper/activation.ts + orchestration/selector.ts emitPredictions methods) is a separate future ship.

## Surface delta

- 1 new file: `src/cli/commands/predict-next.ts` (155 LOC)
- 1 new test file: `src/cli/commands/predict-next.test.ts` (90 LOC, 7 vitest assertions)
- 1 modified file: `src/cli/dispatch.ts` (4 LOC for the registration)
- 5 release-notes files (this + README + 3 chapters)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 78 | 78 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~12-14 | ~14-16 (+2 from v845 forward-flags) |
| CLI commands | N | N+1 (predict-next) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **63 consecutive ships at 1.178**; was 62 entering this ship). New widest-pressure-margin record.
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 16.
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
Operational axes (meta-cadence): 4 (codify / consume / calibrate / verify).

## End-to-end smoke

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

The path works end-to-end. Without `--no-record`, the event lands in `.planning/patterns/predictive-low-confidence-events.jsonl` which the bounded-learning calibration loop reads via the v837 observation source wire.
