/**
 * Public API for the unified cartridge-forge schema.
 *
 * Import from `src/cartridge/` in new code. The legacy location
 * `src/bundles/cartridge/` remains operational via the legacy adapter but is
 * marked @deprecated for new consumers.
 */

export {
  CartridgeSchema,
  ChipsetSchema,
  CartridgeTrustSchema,
  CartridgeProvenanceSchema,
  ContentChipsetSchema,
  VoiceChipsetSchema,
  DepartmentChipsetSchema,
  GroveChipsetSchema,
  CollegeChipsetSchema,
  CoprocessorChipsetSchema,
  GraphicsChipsetSchema,
  GraphicsShaderStageSchema,
  MetricsChipsetSchema,
  EvaluationChipsetSchema,
  CartridgeSkillEntrySchema,
  CartridgeAgentEntrySchema,
  CartridgeAgentsBlockSchema,
  CartridgeTeamEntrySchema,
  CartridgeCustomizationSchema,
  GroveRecordTypeSchema,
  FunctionalChipSchema,
  BenchmarkSchema,
  CHIPSET_KINDS,
  findChipset,
  findChipsets,
} from './types.js';

export type {
  Cartridge,
  Chipset,
  ChipsetKind,
  CartridgeTrust,
  CartridgeProvenance,
  ContentChipset,
  VoiceChipset,
  DepartmentChipset,
  GroveChipset,
  CollegeChipset,
  CoprocessorChipset,
  GraphicsChipset,
  GraphicsShaderStage,
  MetricsChipset,
  EvaluationChipset,
  CartridgeSkillEntry,
  CartridgeAgentEntry,
  CartridgeAgentsBlock,
  CartridgeTeamEntry,
  CartridgeCustomization,
  GroveRecordType,
  FunctionalChip,
  Benchmark,
} from './types.js';
