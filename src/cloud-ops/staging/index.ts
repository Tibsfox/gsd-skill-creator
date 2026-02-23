/**
 * Cloud-ops staging module barrel exports.
 *
 * Provides the OpenStack configuration intake pipeline and community chipset
 * variant staging. All public functions and types are re-exported here.
 *
 * @module cloud-ops/staging
 */

// Types
export type {
  OpenStackConfigType,
  OpenStackConfigIntake,
  ConfigValidationResult,
  ChipsetVariant,
  ChipsetVariantIntake,
  StagedVariantInfo,
} from './types.js';

// Config intake
export {
  SUPPORTED_CONFIG_TYPES,
  validateConfigFile,
  stageOpenStackConfig,
} from './config-intake.js';

export type { StageOpenStackConfigResult } from './config-intake.js';

// Chipset variant staging
export {
  validateChipsetVariant,
  stageChipsetVariant,
  listStagedVariants,
} from './chipset-variants.js';

export type { StageChipsetVariantResult } from './chipset-variants.js';
