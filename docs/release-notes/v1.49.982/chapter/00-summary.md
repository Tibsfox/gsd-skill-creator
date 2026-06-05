# v1.49.982 — Summary

## The ship

Ship 5.2 closes the F4 retention debt by making the `observation.retention_days` auto-emit signal **outcome-driven**. The pre-v982 substrate hardcoded `kind = 'too_aggressive'` on every sweep, so the on-disk signal was one-directional and a calibration tick on it would have raised the threshold as false "learned evidence." This ship replaces the constant with an age-pressure derivation, records the previously-missing `retainedCount`, and adds a chokepoint guard that refuses `--apply` until the signal is verifiably bidirectional. No tick was run — the deliverable is "the signal can now be bidirectional," not "the loop ticked."

## What shipped

- **`deriveAgePressureKind`** (retention-substrate.ts): `R = oldestRetainedAgeDays / retention_days`, band `[0.5, 0.9]`. Young corpus (`R < low`) → `too_lax`; packed edge with drops (`R ≥ high`) → `too_aggressive`; dropped-entire-corpus → `too_aggressive`; in-band/empty → no emit. `defaultKind` still overrides (manual-recorder path).
- **`RetentionManager.pruneWithStats`** returns `retainedCount` + `oldestRetainedAgeDays`; `prune()` delegates (number return preserved). The sweep now records `retainedCount` on every event.
- **Bidirectional apply-guard** at `applyRecommendation`: refuses `--apply` for `observation.retention_days` unless both `too_lax` and `too_aggressive` exist on disk. Dry-run and other thresholds untouched. New first-class `refused` outcome → exit 1 + distinct audit-log state + surfaced in all renderers.

## Verification

- `npm run build` clean; full `npx vitest run` green (35,823).
- pre-tag-gate **20/20** (no new gate step; folded into existing suites).
- Adversarial review: 5 findings → 2 refuted, 2 confirmed-and-fixed, 1 partial-dup.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — unchanged.
