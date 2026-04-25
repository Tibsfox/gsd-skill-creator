/**
 * HB-03 jepa-planner — settings reader (opt-in, fail-closed).
 *
 * Reads `gsd-skill-creator.megakernel-substrate.jepa-planner-stub.enabled`.
 * Default OFF.
 *
 * @module orchestration/jepa-planner/settings
 */

import {
  isMegakernelSubstrateEnabled,
} from '../../cartridge/megakernel/settings.js';

export function isJepaPlannerEnabled(settingsPath?: string): boolean {
  return isMegakernelSubstrateEnabled('jepa-planner-stub', settingsPath);
}
