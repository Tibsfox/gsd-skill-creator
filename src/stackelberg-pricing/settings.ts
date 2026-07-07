/**
 * Stackelberg Drainability Pricing Reference — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the
 * `upstream-intelligence.stackelberg-pricing` block is enabled. Default at
 * every field is FALSE: missing file, malformed JSON, missing block, or
 * missing flag all return disabled.
 *
 * Path: `gsd-skill-creator.upstream-intelligence.stackelberg-pricing`.
 *
 * No side effects beyond a single `fs.readFileSync` on the optional path.
 *
 * Reference: arXiv:2604.16802 (Yan et al., CDC 2026)
 *
 * @module stackelberg-pricing/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface StackelbergPricingConfig {
  enabled: boolean;
  /** Optional override for the bilevel grid-search steps per resource (default 20). */
  gridSteps?: number;
  /** Optional override for the inner best-response grid steps (default 50). */
  innerGridSteps?: number;
}

export const DEFAULT_STACKELBERG_PRICING_CONFIG: StackelbergPricingConfig = {
  enabled: false,
};

/**
 * Read the stackelberg-pricing config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readStackelbergPricingConfig(
  settingsPath?: string,
): StackelbergPricingConfig {
  const block = readNested(
    ['upstream-intelligence', 'stackelberg-pricing'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_STACKELBERG_PRICING_CONFIG };
  }

  const out: StackelbergPricingConfig = { enabled: false };
  const rec = block as Record<string, unknown>;
  if (typeof rec.enabled === 'boolean') out.enabled = rec.enabled;
  if (
    typeof rec.gridSteps === 'number' &&
    Number.isInteger(rec.gridSteps) &&
    rec.gridSteps >= 1
  ) {
    out.gridSteps = rec.gridSteps;
  }
  if (
    typeof rec.innerGridSteps === 'number' &&
    Number.isInteger(rec.innerGridSteps) &&
    rec.innerGridSteps >= 1
  ) {
    out.innerGridSteps = rec.innerGridSteps;
  }
  return out;
}

/**
 * Is the stackelberg-pricing module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isStackelbergPricingEnabled(settingsPath?: string): boolean {
  return readStackelbergPricingConfig(settingsPath).enabled === true;
}
