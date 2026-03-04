/**
 * CapabilityClassifier -- finer-grained model classification than the 3-tier system.
 *
 * Four capability classes based on context window and tool support:
 * - small:  context < 8192 (tiny local models)
 * - medium: context 8192-32767 (mid-range local models)
 * - large:  context 32768-99999 (large local models)
 * - cloud:  context >= 100000 (cloud-tier models)
 *
 * Tool modifier: medium-context models (>16384 tokens) with tool support
 * are reclassified as 'large' because tool-calling correlates with better
 * instruction-following and structured output.
 *
 * CAL-01: Six capability classes (simplified to 4 for v1.49.16)
 */

import { z } from 'zod';
import type { ChipCapabilities } from '../chips/types.js';
import type { ModelCapabilityProfile } from './model-aware-grader.js';

// ============================================================================
// Types
// ============================================================================

export const CapabilityClassSchema = z.enum(['small', 'medium', 'large', 'cloud']);
export type CapabilityClass = z.infer<typeof CapabilityClassSchema>;

// ============================================================================
// Thresholds
// ============================================================================

const SMALL_CEILING = 8192;
const MEDIUM_CEILING = 32768;
const CLOUD_FLOOR = 100000;
const TOOL_MODIFIER_MIN_CONTEXT = 16384;

// ============================================================================
// CapabilityClassifier
// ============================================================================

export class CapabilityClassifier {
  /**
   * Classify a chip's capabilities into a capability class.
   *
   * Primary signal: maxContextLength
   * Modifier: supportsTools upgrades medium (>16384) to large
   */
  classify(capabilities: ChipCapabilities): CapabilityClass {
    const ctx = capabilities.maxContextLength;

    if (ctx >= CLOUD_FLOOR) return 'cloud';
    if (ctx >= MEDIUM_CEILING) return 'large';
    if (ctx >= SMALL_CEILING) {
      // Tool modifier: medium model with tools and sufficient context -> large
      if (capabilities.supportsTools && ctx >= TOOL_MODIFIER_MIN_CONTEXT) {
        return 'large';
      }
      return 'medium';
    }
    return 'small';
  }

  /**
   * Convenience: classify from an existing ModelCapabilityProfile.
   */
  classifyFromProfile(profile: ModelCapabilityProfile): CapabilityClass {
    return this.classify({
      models: [profile.model],
      maxContextLength: profile.maxContextLength,
      supportsStreaming: profile.supportsStreaming,
      supportsTools: profile.supportsTools,
    });
  }
}
