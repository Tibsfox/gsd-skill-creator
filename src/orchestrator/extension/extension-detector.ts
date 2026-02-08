/**
 * Extension detector for gsd-skill-creator.
 *
 * Probes for gsd-skill-creator installation and returns typed
 * capability flags. Supports DI overrides for testing.
 */

import type { ExtensionCapabilities, DetectionOverrides } from './types.js';

/**
 * Detect gsd-skill-creator installation and return capabilities.
 *
 * Uses a two-strategy approach:
 * 1. CLI binary check (highest priority)
 * 2. dist/ directory check (fallback)
 *
 * @param overrides - Optional DI overrides for testing
 * @returns Extension capabilities with feature flags
 */
export async function detectExtension(
  overrides?: DetectionOverrides,
): Promise<ExtensionCapabilities> {
  throw new Error('Not implemented');
}

/**
 * Create a null capabilities object with all features disabled.
 *
 * Used as the default when gsd-skill-creator is not detected,
 * providing a zero-error degradation path.
 *
 * @returns ExtensionCapabilities with detected=false and all features disabled
 */
export function createNullCapabilities(): ExtensionCapabilities {
  throw new Error('Not implemented');
}
