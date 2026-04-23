/**
 * Convergent Substrate — centralized settings reader.
 *
 * Reads opt-in flags from the library-native `.claude/gsd-skill-creator.json`
 * with fallback to `.claude/settings.json`. Matches the drift module pattern
 * (see src/drift/context-entropy.ts readContextEntropyFlag).
 *
 * All five Half B modules (trust-tiers, two-gate, compression-spectrum,
 * cascade-mcp-defense, reasoning-graphs) share this reader so callers can
 * query enablement uniformly:
 *
 *   import { isConvergentModuleEnabled } from './convergent/settings.js';
 *   if (isConvergentModuleEnabled('trustTiers')) { ... }
 *
 * Returns false on any read/parse/shape error — fail-closed by design.
 *
 * @module convergent/settings
 */

import { readFileSync } from 'node:fs';

/** The 5 Half B module keys; extending this requires matching the config file. */
export type ConvergentModuleKey =
  | 'trustTiers'
  | 'twoGate'
  | 'compressionSpectrum'
  | 'cascadeMcpDefense'
  | 'reasoningGraphs';

/** All module keys as an exported constant for iteration. */
export const ALL_CONVERGENT_MODULES: readonly ConvergentModuleKey[] = [
  'trustTiers',
  'twoGate',
  'compressionSpectrum',
  'cascadeMcpDefense',
  'reasoningGraphs',
] as const;

const DEFAULT_PATH = '.claude/settings.json';
const LIB_PATH = '.claude/gsd-skill-creator.json';

/**
 * Read the entire convergent config block, or null on any error.
 * Caller may inspect nested keys directly when fine-grained settings are needed.
 */
export function readConvergentSettings(
  settingsPath: string = DEFAULT_PATH,
): Record<string, unknown> | null {
  try {
    const raw = (() => {
      const paths = settingsPath === DEFAULT_PATH ? [LIB_PATH, DEFAULT_PATH] : [settingsPath];
      for (const p of paths) {
        try {
          const txt = readFileSync(p, 'utf8');
          if (txt) return txt;
        } catch {}
      }
      throw new Error('no settings file found');
    })();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const scope = parsed['gsd-skill-creator'];
    if (!scope || typeof scope !== 'object') return null;
    const convergent = (scope as Record<string, unknown>).convergent;
    if (!convergent || typeof convergent !== 'object') return null;
    return convergent as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Is a specific Half B module enabled?
 * Returns false on any missing-config or shape error (fail-closed).
 */
export function isConvergentModuleEnabled(
  key: ConvergentModuleKey,
  settingsPath: string = DEFAULT_PATH,
): boolean {
  const conv = readConvergentSettings(settingsPath);
  if (!conv) return false;
  const mod = conv[key];
  if (!mod || typeof mod !== 'object') return false;
  return (mod as Record<string, unknown>).enabled === true;
}

/**
 * Read a numeric setting nested under a module, with a default fallback.
 * Returns defaultValue on any missing/non-numeric value.
 */
export function readConvergentNumber(
  key: ConvergentModuleKey,
  field: string,
  defaultValue: number,
  settingsPath: string = DEFAULT_PATH,
): number {
  const conv = readConvergentSettings(settingsPath);
  if (!conv) return defaultValue;
  const mod = conv[key];
  if (!mod || typeof mod !== 'object') return defaultValue;
  const v = (mod as Record<string, unknown>)[field];
  if (typeof v !== 'number' || !Number.isFinite(v)) return defaultValue;
  return v;
}

/**
 * Produce an enabled-state snapshot across all modules. Useful for CLIs,
 * dashboards, and the skill-creator convergent status subcommand.
 */
export function getConvergentEnablementSnapshot(
  settingsPath: string = DEFAULT_PATH,
): Record<ConvergentModuleKey, boolean> {
  const out: Record<ConvergentModuleKey, boolean> = {
    trustTiers: false,
    twoGate: false,
    compressionSpectrum: false,
    cascadeMcpDefense: false,
    reasoningGraphs: false,
  };
  for (const key of ALL_CONVERGENT_MODULES) {
    out[key] = isConvergentModuleEnabled(key, settingsPath);
  }
  return out;
}
