/**
 * Rumor Delay Model — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether the UIP-22 T3b
 * Rumor Delay Model is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled (fail-closed).
 *
 * Config path:
 *   `gsd-skill-creator.upstream-intelligence.rumor-delay-model.enabled`
 *
 * When the flag is false (or unreadable), `simulatePropagation` and
 * `analyzeSignalVsHype` return byte-identical passthrough results, preserving
 * the pre-774 baseline (CAPCOM composition gate G14 requirement).
 *
 * No side effects beyond a single `fs.readFileSync` on the optional path.
 * Pattern matches `src/experience-compression/settings.ts` per v1.49.573 plan.
 *
 * @module rumor-delay-model/settings
 */

import { readNested, dedicatedConfigPath } from '../settings/read-settings.js';

export interface RumorDelayModelConfig {
  enabled: boolean;

  /**
   * Influence threshold ρ* above which claims enter expedited fact-check queue.
   * Maps to the SENTINEL Influence Threshold Gate (m7-capcom-revision.tex §4).
   * Default: 1.0 (matches R₀ stability threshold in arXiv:2604.17368).
   */
  influenceThreshold: number;

  /**
   * Noise tolerance σ band multiplier for the Influence Threshold Gate.
   * The effective threshold band is [ρ* - noiseToleranceSigma, ρ* + noiseToleranceSigma].
   * Default: 2.0 (±2σ as specified in m7-capcom-revision.tex §4 Noise Tolerance).
   */
  noiseToleranceSigma: number;
}

export const DEFAULT_RUMOR_DELAY_MODEL_CONFIG: RumorDelayModelConfig = {
  enabled: false,
  influenceThreshold: 1.0,
  noiseToleranceSigma: 2.0,
};

/**
 * Read the rumor-delay-model config block, or defaults on any error.
 *
 * @param settingsPath Optional override for the JSON file location.
 */
export function readRumorDelayModelConfig(
  settingsPath?: string,
): RumorDelayModelConfig {
  const block = readNested(
    ['upstream-intelligence', 'rumor-delay-model'],
    [dedicatedConfigPath(settingsPath)],
  );
  if (!block || typeof block !== 'object') {
    return { ...DEFAULT_RUMOR_DELAY_MODEL_CONFIG };
  }

  const rec = block as Record<string, unknown>;
  const out: RumorDelayModelConfig = { ...DEFAULT_RUMOR_DELAY_MODEL_CONFIG };

  if (typeof rec['enabled'] === 'boolean') {
    out.enabled = rec['enabled'] as boolean;
  }
  if (
    typeof rec['influenceThreshold'] === 'number' &&
    Number.isFinite(rec['influenceThreshold']) &&
    (rec['influenceThreshold'] as number) > 0
  ) {
    out.influenceThreshold = rec['influenceThreshold'] as number;
  }
  if (
    typeof rec['noiseToleranceSigma'] === 'number' &&
    Number.isFinite(rec['noiseToleranceSigma']) &&
    (rec['noiseToleranceSigma'] as number) >= 0
  ) {
    out.noiseToleranceSigma = rec['noiseToleranceSigma'] as number;
  }

  return out;
}

/**
 * Is the Rumor Delay Model opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isRumorDelayModelEnabled(settingsPath?: string): boolean {
  return readRumorDelayModelConfig(settingsPath).enabled === true;
}
