# HB-03 Safe-Turn-Depth Calibration — User Guide

**Path:** `src/safety/std-calibration/`
**Source paper:** arXiv:2604.20911 (Safe-Turn-Depth study, 4,416 trials)
**Default:** OFF
**Flag:** `gsd-skill-creator.cs25-26-sweep.std-calibration.enabled`
**CAPCOM HARD GATE.**

## What it does

The published study measured per-model omission-constraint decay across
turn depth: prohibition compliance falls from 73% at turn 1 to 33% by
turn 16; commission constraints hold at 100% throughout. HB-03 ships a
per-model `Safe-Turn-Depth` (STD) calibration table and an automated
re-injection middleware that re-asserts the omission constraints just
before the model's measured STD.

Three components:

1. **Decay measurement** — runs an offline N-trial harness that produces
   a `DecayMeasurementResult` per (model, constraint) pair.
2. **Calibration table** — a JSON store at `.planning/safety/std-table.json`
   holding the active and staged calibration per model.
3. **Re-injection middleware** — `decideReInjection(model, depth,
   activeConstraints)` returns a `triggered: true` decision when
   `depth >= std`, instructing the conversation harness to re-inject.

## How to enable + the CAPCOM workflow

HB-03 is a CAPCOM HARD GATE because it touches Safety Warden BLOCK
timing. Two distinct authorization markers exist (trigger-vs-auth
separation):

1. **Set the flag.**
   ```jsonc
   { "gsd-skill-creator": { "cs25-26-sweep": {
     "std-calibration": { "enabled": true }
   }}}
   ```

2. **Record the trigger** (user request).
   ```bash
   touch .planning/safety/std-calibration.trigger
   ```

3. **Authorize via CAPCOM** (human review).
   ```bash
   echo "human-foxy@2026-04-25" > .planning/safety/std-calibration.capcom
   ```

The trigger marker presence is "I asked for calibration." The CAPCOM
marker presence + non-empty content is "calibration is authorized."
Both are required.

## Calibration trigger workflow

Run the decay measurement once per model release; commit the staged
calibration table. The `stageCalibration()` API stages a new
calibration without activating it; `promoteStaged()` activates after
CAPCOM auth. The bootstrap floor (`BOOTSTRAP_STD_FLOOR`) is the
fail-closed default the re-injection middleware uses when no
calibration exists.

## Default-off invariant

`decideReInjection()` returns `RE_INJECTION_DISABLED_DECISION` (a
frozen sentinel — `triggered: false, depth: 0, std: 0, …,
disabled: true`). No re-injection fires. The Safety Warden's existing
BLOCK paths run unchanged.
