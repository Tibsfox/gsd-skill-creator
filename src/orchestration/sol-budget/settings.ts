/**
 * HB-05 sol-budget — settings reader (opt-in, fail-closed).
 *
 * Reads `gsd-skill-creator.megakernel-substrate.sol-budget-guidance.enabled`.
 * Default OFF.
 *
 * @module orchestration/sol-budget/settings
 */

import {
  isMegakernelSubstrateEnabled,
} from '../../cartridge/megakernel/settings.js';

export function isSolBudgetEnabled(settingsPath?: string): boolean {
  return isMegakernelSubstrateEnabled('sol-budget-guidance', settingsPath);
}
