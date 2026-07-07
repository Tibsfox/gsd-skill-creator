/**
 * Megakernel substrate — settings reader (opt-in, fail-closed).
 *
 * Reads `.claude/gsd-skill-creator.json` and returns whether each Half B
 * megakernel-substrate module is opted in. Default at every field is FALSE:
 * missing file, malformed JSON, missing block, or missing flag all return
 * disabled.
 *
 * Path: `gsd-skill-creator.megakernel-substrate.<module>.enabled`.
 *
 * Modules under this block (v1.49.574 Half B):
 *   - instruction-tensor-schema   (HB-01, T1)
 *   - execution-trace-telemetry   (HB-02, T1)
 *   - jepa-planner-stub           (HB-03, T1)
 *   - adapter-selection-schema    (HB-04, T2; CAPCOM hard preservation)
 *   - sol-budget-guidance         (HB-05, T2)
 *   - verification-doctrine       (HB-07, T2)
 *
 * No side effects. Pure function surface. Pattern matches
 * `src/skilldex-auditor/settings.ts` per v1.49.573 substrate convention.
 *
 * @module cartridge/megakernel/settings
 */

import { readNested, dedicatedConfigPath } from '../../settings/read-settings.js';

export type MegakernelSubstrateModule =
  | 'instruction-tensor-schema'
  | 'execution-trace-telemetry'
  | 'jepa-planner-stub'
  | 'adapter-selection-schema'
  | 'sol-budget-guidance'
  | 'verification-doctrine';

export interface MegakernelSubstrateModuleConfig {
  enabled: boolean;
}

export const DEFAULT_MEGAKERNEL_SUBSTRATE_CONFIG: MegakernelSubstrateModuleConfig = {
  enabled: false,
};

/**
 * Read the megakernel-substrate config block for a single module, or defaults
 * on any error (missing file / malformed JSON / missing block / wrong shape).
 *
 * @param module The substrate module name.
 * @param settingsPath Optional override for the JSON file location (tests).
 */
export function readMegakernelSubstrateConfig(
  module: MegakernelSubstrateModule,
  settingsPath?: string,
): MegakernelSubstrateModuleConfig {
  const raw = readNested(['megakernel-substrate', module], [dedicatedConfigPath(settingsPath)]);
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_MEGAKERNEL_SUBSTRATE_CONFIG };
  const block = raw as { enabled?: unknown };
  const enabled =
    typeof block.enabled === 'boolean' ? block.enabled : false;
  return { enabled };
}

/**
 * Is the named substrate module opted in?
 * Returns false on any read/parse/shape error (fail-closed).
 */
export function isMegakernelSubstrateEnabled(
  module: MegakernelSubstrateModule,
  settingsPath?: string,
): boolean {
  return readMegakernelSubstrateConfig(module, settingsPath).enabled === true;
}
