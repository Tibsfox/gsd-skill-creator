/**
 * Activation Steering Runtime — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the
 * `upstream-intelligence.activation-steering` block is enabled. Default at
 * every field is FALSE: missing file, malformed JSON, missing block, or
 * missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.upstream-intelligence.activation-steering`.
 *
 * No side effects beyond a single `fs.readFileSync` on the optional path.
 *
 * @module activation-steering/settings
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ActivationSteeringConfig {
  enabled: boolean;
  /** Optional override for the controller proportional gain (default 0.5). */
  gain?: number;
  /** Optional override for the local-linearity residual threshold (default 0.1). */
  linearityThreshold?: number;
}

export const DEFAULT_ACTIVATION_STEERING_CONFIG: ActivationSteeringConfig = {
  enabled: false,
};

/** Default proportional gain for `K * (target - current)` form. */
export const DEFAULT_STEERING_GAIN = 0.5;

/** Default normalised-residual threshold for the local-linearity validator. */
export const DEFAULT_LINEARITY_THRESHOLD = 0.1;

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultConfigPath(): string {
  return path.join(projectRoot(), '.claude', 'gsd-skill-creator.json');
}

/**
 * Read the activation-steering config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readActivationSteeringConfig(
  settingsPath?: string,
): ActivationSteeringConfig {
  const configPath = settingsPath ?? defaultConfigPath();
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_ACTIVATION_STEERING_CONFIG };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return { ...DEFAULT_ACTIVATION_STEERING_CONFIG };
  }
  const block = extractBlock(raw);
  if (!block) return { ...DEFAULT_ACTIVATION_STEERING_CONFIG };

  const out: ActivationSteeringConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (
    typeof rec.gain === 'number' &&
    Number.isFinite(rec.gain) &&
    rec.gain > 0 &&
    rec.gain <= 1
  ) {
    out.gain = rec.gain;
  }
  if (
    typeof rec.linearityThreshold === 'number' &&
    Number.isFinite(rec.linearityThreshold) &&
    rec.linearityThreshold > 0 &&
    rec.linearityThreshold <= 1
  ) {
    out.linearityThreshold = rec.linearityThreshold;
  }
  return out;
}

function extractBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const outer = (raw as Record<string, unknown>)['gsd-skill-creator'];
  if (!outer || typeof outer !== 'object') return null;
  const upstream = (outer as Record<string, unknown>)['upstream-intelligence'];
  if (!upstream || typeof upstream !== 'object') return null;
  const block = (upstream as Record<string, unknown>)['activation-steering'];
  if (!block || typeof block !== 'object') return null;
  return block as Record<string, unknown>;
}

/**
 * Is the activation-steering primitive opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isActivationSteeringEnabled(settingsPath?: string): boolean {
  return readActivationSteeringConfig(settingsPath).enabled === true;
}
