/**
 * HB-02 megakernel-trace — settings reader (opt-in, fail-closed).
 *
 * Reads `gsd-skill-creator.megakernel-substrate.execution-trace-telemetry.enabled`.
 * Default OFF.
 *
 * @module traces/megakernel-trace/settings
 */

import {
  isMegakernelSubstrateEnabled,
} from '../../cartridge/megakernel/settings.js';

export function isMegakernelTraceEnabled(settingsPath?: string): boolean {
  return isMegakernelSubstrateEnabled('execution-trace-telemetry', settingsPath);
}
