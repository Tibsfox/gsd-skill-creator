/**
 * Bounded-learning calibration loop — atomic threshold writer.
 *
 * Reads/writes `.planning/skill-creator.json` to apply recommended
 * threshold adjustments. The writer is gated behind an explicit `apply`
 * flag — dry-run callers (the default) return the proposed write without
 * touching the file. Writes are atomic via the rename-from-tmpfile
 * pattern.
 *
 * @module bounded-learning/threshold-writer
 */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  CalibratableThreshold,
  CalibrationRecommendation,
} from './types.js';
import {
  DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH,
  readObservationRetentionEvents,
} from './observation-retention-events.js';

/**
 * Outcome of a `applyRecommendation` call.
 *
 * - `refused` (v1.49.982): a change WAS recommended but a safety guard blocked
 *   the apply (distinct from `noop`, which means no change was recommended).
 */
export type ApplyOutcome =
  | { kind: 'noop'; reason: string }
  | { kind: 'refused'; reason: string }
  | { kind: 'dry-run'; proposedConfig: unknown; proposedValue: number }
  | { kind: 'applied'; previousValue: number; newValue: number; configPath: string };

/**
 * Minimum count of the MINORITY retention-event polarity required before an
 * `--apply` is permitted (v1.49.983 — Ship 5.3 guard hardening). One or two
 * events of the rarer kind can be an artifact: the FIRST real `too_lax`
 * accrued post-v982 against a 26-strong `too_aggressive` pile, and the v983
 * dry-run probe showed the e-process recommending an increase off that 26:1
 * corpus (meanObservation −0.926, evidence 9182). Requiring ≥3 means the
 * minority direction is a pattern, not a fluke.
 */
const MIN_BIDIRECTIONAL_MINORITY_COUNT = 3;

/**
 * Minimum SHARE the minority polarity must hold of the two-sided corpus
 * (`too_lax` + `too_aggressive`) before an `--apply` is permitted
 * (v1.49.983). 0.2 caps the imbalance at 4:1 — equivalently
 * `|meanObservation| ≤ 0.6` — so a lopsided pile can no longer drive the
 * one-sided e-process to a "false vindication" change while the presence
 * check alone (v982) mechanically passes.
 */
const MIN_BIDIRECTIONAL_MINORITY_FRACTION = 0.2;

/**
 * Defense-in-depth guard (v1.49.982 Ship 5.2 / Option D; hardened v1.49.983
 * Ship 5.3).
 *
 * The `observation.retention_days` auto-emit signal was degenerate (one-way
 * `too_aggressive`) until the v982 substrate fix. Applying a calibration
 * recommendation against a degenerate signal raises the threshold as if it
 * were learned evidence — a "false vindication worse than null" (see
 * `docs/retention-substrate-outcome-driven-debt.md`). This guard converts the
 * doc-discipline rule "never `--apply` until the signal is verifiably
 * bidirectional" into enforced code, in two tiers:
 *
 *  1. **Presence** (v982): both `too_lax` AND `too_aggressive` must exist at
 *     all (also blocks a future all-`too_lax` degenerate corpus, not just
 *     today's all-`too_aggressive` one).
 *  2. **Depth + balance** (v983): the mechanical presence check passed at 26:1
 *     (one `too_lax`, `meanObservation` −0.926) and the loop still recommended
 *     an increase off essentially one-directional evidence. So the minority
 *     polarity must also be deep enough (≥ {@link MIN_BIDIRECTIONAL_MINORITY_COUNT})
 *     AND a large enough share (≥ {@link MIN_BIDIRECTIONAL_MINORITY_FRACTION})
 *     for the corpus to be trustworthy bidirectional evidence.
 *
 * Dry-run is intentionally NOT guarded — it is the intended post-fix probe.
 * Placed at the `applyRecommendation` chokepoint so it covers the CLI,
 * `--watch` mode, and any future scheduler in one spot.
 *
 * @returns a refusal reason string when the apply must be blocked, else `null`.
 */
async function retentionApplyRefusal(eventsPath: string): Promise<string | null> {
  const events = await readObservationRetentionEvents(eventsPath);
  const tooLax = events.filter((e) => e.kind === 'too_lax').length;
  const tooAggressive = events.filter((e) => e.kind === 'too_aggressive').length;

  // Tier 1 — presence.
  if (tooLax === 0 || tooAggressive === 0) {
    return (
      `Refusing --apply for observation.retention_days: the on-disk retention ` +
      `signal is not verifiably bidirectional (too_lax=${tooLax}, ` +
      `too_aggressive=${tooAggressive}). Applying on a one-directional signal ` +
      `is a false vindication — see docs/retention-substrate-outcome-driven-debt.md. ` +
      `Accumulate both polarities (the v982 outcome-driven substrate emits them ` +
      `from real sweeps) before applying.`
    );
  }

  // Tier 2 — depth + balance. Both polarities exist, but a thin or lopsided
  // corpus still lets the majority dominate the one-sided e-process.
  const total = tooLax + tooAggressive;
  const minority = Math.min(tooLax, tooAggressive);
  const minorityFraction = minority / total;
  if (
    minority < MIN_BIDIRECTIONAL_MINORITY_COUNT ||
    minorityFraction < MIN_BIDIRECTIONAL_MINORITY_FRACTION
  ) {
    return (
      `Refusing --apply for observation.retention_days: the retention signal is ` +
      `bidirectional but too imbalanced to apply (too_lax=${tooLax}, ` +
      `too_aggressive=${tooAggressive}; minority=${minority}, ` +
      `share=${minorityFraction.toFixed(3)}). Require the minority polarity to ` +
      `reach ≥ ${MIN_BIDIRECTIONAL_MINORITY_COUNT} events AND ≥ ` +
      `${MIN_BIDIRECTIONAL_MINORITY_FRACTION} share (≤ 4:1) so a lopsided pile ` +
      `cannot drive a false-vindication change — see ` +
      `docs/retention-substrate-outcome-driven-debt.md.`
    );
  }

  return null;
}

/**
 * Default skill-creator config path. Tests override via `configPath`.
 */
export const DEFAULT_CONFIG_PATH = join(process.cwd(), '.planning', 'skill-creator.json');

/**
 * Resolve a dotted-path threshold like `suggestions.min_occurrences` to
 * the value inside `config`. Returns `undefined` when any segment is
 * absent or non-object.
 */
export function readThresholdValue(
  config: unknown,
  threshold: CalibratableThreshold,
): number | undefined {
  if (typeof config !== 'object' || config === null) return undefined;
  const segments = threshold.split('.');
  let cur: unknown = config;
  for (const seg of segments) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return typeof cur === 'number' ? cur : undefined;
}

/**
 * Produce a structurally-identical clone of `config` with the threshold's
 * value overwritten. Does not mutate `config`. Creates intermediate
 * objects as needed (defensive; the keys are expected to already exist).
 */
export function setThresholdValue(
  config: unknown,
  threshold: CalibratableThreshold,
  value: number,
): Record<string, unknown> {
  const root: Record<string, unknown> =
    typeof config === 'object' && config !== null
      ? { ...(config as Record<string, unknown>) }
      : {};
  const segments = threshold.split('.');
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (seg === undefined) continue;
    const next = cur[seg];
    const cloned: Record<string, unknown> =
      typeof next === 'object' && next !== null
        ? { ...(next as Record<string, unknown>) }
        : {};
    cur[seg] = cloned;
    cur = cloned;
  }
  const leaf = segments[segments.length - 1];
  if (leaf !== undefined) cur[leaf] = value;
  return root;
}

async function atomicWriteJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmpPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmpPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await rename(tmpPath, path);
}

/**
 * Apply a calibration recommendation against a skill-creator config file.
 *
 * - When `recommendation.direction === 'hold'` or `proposedValue === null`:
 *   returns `{ kind: 'noop', reason }` — nothing to write.
 * - When `apply === false` (default): returns `{ kind: 'dry-run', proposedConfig, proposedValue }`
 *   showing the post-update config shape without touching disk.
 * - When `apply === true`: atomically writes the updated config and
 *   returns `{ kind: 'applied', previousValue, newValue, configPath }`.
 *
 * The writer refuses to apply if `currentValue` in the on-disk config no
 * longer matches the recommendation's `currentValue` (concurrent edit
 * detected) — surfaced as a `noop` outcome with a descriptive reason.
 */
export async function applyRecommendation(
  recommendation: CalibrationRecommendation,
  options: { apply?: boolean; configPath?: string; retentionEventsPath?: string } = {},
): Promise<ApplyOutcome> {
  const apply = options.apply ?? false;
  const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;

  if (recommendation.direction === 'hold' || recommendation.proposedValue === null) {
    return { kind: 'noop', reason: 'No threshold change recommended.' };
  }

  if (!existsSync(configPath)) {
    return {
      kind: 'noop',
      reason: `Config file not found at ${configPath}; cannot apply recommendation.`,
    };
  }

  const raw = await readFile(configPath, 'utf8');
  const config = JSON.parse(raw) as unknown;
  const onDiskValue = readThresholdValue(config, recommendation.threshold);

  if (onDiskValue === undefined) {
    return {
      kind: 'noop',
      reason: `Threshold ${recommendation.threshold} not found in config at ${configPath}.`,
    };
  }

  if (onDiskValue !== recommendation.currentValue) {
    return {
      kind: 'noop',
      reason: `Concurrent edit detected: on-disk ${recommendation.threshold} ` +
        `is ${onDiskValue}, recommendation expected ${recommendation.currentValue}. ` +
        `Re-run calibration-check against the current config.`,
    };
  }

  const proposedConfig = setThresholdValue(
    config,
    recommendation.threshold,
    recommendation.proposedValue,
  );

  if (!apply) {
    return {
      kind: 'dry-run',
      proposedConfig,
      proposedValue: recommendation.proposedValue,
    };
  }

  // Defense-in-depth: refuse to APPLY a retention change on a one-directional
  // signal (v982 / Ship 5.2 Option D). Dry-run above is unaffected.
  if (recommendation.threshold === 'observation.retention_days') {
    const refusal = await retentionApplyRefusal(
      options.retentionEventsPath ?? DEFAULT_OBSERVATION_RETENTION_EVENTS_PATH,
    );
    if (refusal !== null) {
      return { kind: 'refused', reason: refusal };
    }
  }

  await atomicWriteJson(configPath, proposedConfig);
  return {
    kind: 'applied',
    previousValue: recommendation.currentValue,
    newValue: recommendation.proposedValue,
    configPath,
  };
}
