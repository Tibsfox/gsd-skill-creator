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

/**
 * Outcome of a `applyRecommendation` call.
 */
export type ApplyOutcome =
  | { kind: 'noop'; reason: string }
  | { kind: 'dry-run'; proposedConfig: unknown; proposedValue: number }
  | { kind: 'applied'; previousValue: number; newValue: number; configPath: string };

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
  options: { apply?: boolean; configPath?: string } = {},
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

  await atomicWriteJson(configPath, proposedConfig);
  return {
    kind: 'applied',
    previousValue: recommendation.currentValue,
    newValue: recommendation.proposedValue,
    configPath,
  };
}
