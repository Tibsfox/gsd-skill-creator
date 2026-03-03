/**
 * ThresholdsConfigLoader -- reads and interprets thresholds.json.
 *
 * Provides per-chip pass rate threshold lookup with a configurable default.
 * Follows the CHIP-06 pattern from ChipRegistry: only ENOENT is silently
 * swallowed and replaced with a default config; all other errors propagate.
 *
 * EVAL-04: thresholds.json defines per-chip pass rate thresholds with a
 * configurable default, enabling per-chip quality bars.
 *
 * IMP-03: Threshold registry -- Wave 2 constants defined here.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ThresholdsConfigSchema, DEFAULT_PASS_RATE_THRESHOLD } from './types.js';
import type { ThresholdsConfig } from './types.js';

// ============================================================================
// Constants (IMP-03: Threshold registry -- Wave 2)
// ============================================================================

/**
 * Floating-point tolerance used when comparing a pass rate to a threshold.
 * Two rates are considered equal ('at') if their absolute difference is <= this value.
 *
 * Rationale: pass rates are computed as ratios (e.g., 7/10 = 0.6999... in IEEE 754).
 * A tolerance of 0.001 absorbs rounding without masking meaningful differences.
 */
export const THRESHOLD_EQUALITY_TOLERANCE = 0.001;

// Re-export DEFAULT_PASS_RATE_THRESHOLD from types.ts for callers that import
// from thresholds-config.ts (per plan spec and barrel export requirement).
export { DEFAULT_PASS_RATE_THRESHOLD } from './types.js';

// ============================================================================
// Default config (returned on ENOENT)
// ============================================================================

function buildDefaultConfig(): ThresholdsConfig {
  return {
    version: 1,
    defaultPassRate: DEFAULT_PASS_RATE_THRESHOLD,
    chips: {},
  };
}

// ============================================================================
// ThresholdsConfigLoader
// ============================================================================

/**
 * Loads and interprets thresholds.json for per-chip pass rate configuration.
 *
 * Usage:
 * ```typescript
 * const loader = new ThresholdsConfigLoader();
 * await loader.loadFromFile();
 * const threshold = loader.getThresholdForChip('ollama');
 * const status = loader.getStatus(0.72, 'ollama');
 * ```
 */
export class ThresholdsConfigLoader {
  private readonly configPath: string;
  private config: ThresholdsConfig | null = null;

  /**
   * @param configPath - Path to thresholds.json. Defaults to `{cwd}/thresholds.json`.
   */
  constructor(configPath?: string) {
    this.configPath = configPath ?? path.join(process.cwd(), 'thresholds.json');
  }

  /**
   * Load and validate thresholds.json from disk.
   *
   * EVAL-04: Parses thresholds.json with ThresholdsConfigSchema validation.
   * CHIP-06 pattern: ENOENT returns a default config (version 1, defaultPassRate 0.75,
   * empty chips). Any other error (EACCES, malformed JSON, schema failure) propagates.
   *
   * @returns The validated ThresholdsConfig, or the default if file is missing.
   * @throws If the file exists but cannot be parsed or fails schema validation.
   */
  async loadFromFile(): Promise<ThresholdsConfig> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      const validated = ThresholdsConfigSchema.parse(parsed);
      this.config = validated;
      return this.config;
    } catch (err) {
      // CHIP-06: only ENOENT is silently swallowed
      if (
        err instanceof Error &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        this.config = buildDefaultConfig();
        return this.config;
      }
      // All other errors (EACCES, malformed JSON, Zod parse error) propagate
      throw err;
    }
  }

  /**
   * Get the pass rate threshold for a specific chip.
   *
   * Returns the chip-specific override if configured in `chips`,
   * otherwise falls back to `defaultPassRate`.
   *
   * @param chipName - The chip name to look up (matches ChipConfig.name).
   * @returns The pass rate threshold for this chip (0-1).
   * @throws If `loadFromFile()` has not been called yet.
   */
  getThresholdForChip(chipName: string): number {
    if (this.config === null) {
      throw new Error(
        'ThresholdsConfigLoader: call loadFromFile() before getThresholdForChip()'
      );
    }
    const chipConfig = this.config.chips[chipName];
    return chipConfig !== undefined ? chipConfig.passRate : this.config.defaultPassRate;
  }

  /**
   * Compare a pass rate to the configured threshold for a chip.
   *
   * Uses THRESHOLD_EQUALITY_TOLERANCE (0.001) to handle floating-point rounding
   * in pass rate calculations (e.g., 7/10 = 0.6999... should be 'at' for threshold 0.7).
   *
   * @param passRate - The measured pass rate to evaluate (0-1).
   * @param chipName - The chip name to look up the threshold for.
   * @returns 'above' | 'below' | 'at' based on comparison.
   * @throws If `loadFromFile()` has not been called yet.
   */
  getStatus(passRate: number, chipName: string): 'above' | 'below' | 'at' {
    const threshold = this.getThresholdForChip(chipName);
    const diff = passRate - threshold;

    if (Math.abs(diff) <= THRESHOLD_EQUALITY_TOLERANCE) {
      return 'at';
    }
    return diff > 0 ? 'above' : 'below';
  }
}
