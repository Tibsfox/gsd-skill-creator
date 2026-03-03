/**
 * ChipFactory -- creates ModelChip instances from ChipConfig.
 *
 * Pure function: dispatches on config.type to instantiate the correct
 * chip implementation. No IO, no side effects.
 *
 * IMP-03 constant: CHIPSET_FILE_VERSION = 1 (chipset.json schema version)
 * IMP-03 constant: HEALTH_CHECK_PARALLEL_LIMIT = 10 (max concurrent health checks)
 */

import type { ChipConfig, ModelChip } from './types.js';
import { OpenAICompatibleChip } from './openai-compatible-chip.js';
import { AnthropicChip } from './anthropic-chip.js';

// ============================================================================
// IMP-03: Threshold constants (chipset-level)
// ============================================================================

/** Chipset.json schema version this implementation targets */
export const CHIPSET_FILE_VERSION = 1;

/**
 * Maximum number of concurrent health checks to avoid overwhelming
 * local hardware (e.g. Ollama running on the same machine).
 */
export const HEALTH_CHECK_PARALLEL_LIMIT = 10;

// ============================================================================
// createChip
// ============================================================================

/**
 * Create a ModelChip instance from a ChipConfig.
 *
 * Dispatches on config.type:
 * - 'openai-compatible' -> OpenAICompatibleChip
 * - 'anthropic' -> AnthropicChip
 * - anything else -> throws a descriptive error
 *
 * @param config - Validated chip configuration
 * @returns Instantiated ModelChip ready for use
 * @throws Error if config.type is not a recognised chip type
 */
export function createChip(config: ChipConfig): ModelChip {
  switch (config.type) {
    case 'openai-compatible':
      return new OpenAICompatibleChip(config);
    case 'anthropic':
      return new AnthropicChip(config);
    default: {
      // Exhaustiveness guard: if a new type is added to ChipConfig without
      // updating this switch, TypeScript will catch it at compile time.
      // At runtime, we reach here only with an invalid (non-schema) config.
      const _unreachable: never = config;
      void _unreachable;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error(`Unknown chip type: '${(config as any).type}'`);
    }
  }
}
