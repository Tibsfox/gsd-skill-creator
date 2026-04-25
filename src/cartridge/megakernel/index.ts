/**
 * Megakernel substrate — barrel export (v1.49.574 Half B).
 *
 * @module cartridge/megakernel
 */

export type {
  MegakernelSubstrateModule,
  MegakernelSubstrateModuleConfig,
} from './settings.js';
export {
  DEFAULT_MEGAKERNEL_SUBSTRATE_CONFIG,
  isMegakernelSubstrateEnabled,
  readMegakernelSubstrateConfig,
} from './settings.js';

// HB-01 — instruction-tensor schema
export type {
  InstructionOpcode,
  CounterRef,
  InstructionOperand,
  Instruction,
  InstructionTensor,
  InstructionTensorValidationResult,
} from './instruction-tensor-schema.js';
export {
  InstructionOpcodeSchema,
  CounterRefSchema,
  InstructionOperandSchema,
  InstructionSchema,
  InstructionTensorSchema,
  validateInstructionTensor,
  serializeInstructionTensor,
  parseInstructionTensor,
  INSTRUCTION_TENSOR_SCHEMA_VERSION,
} from './instruction-tensor-schema.js';

// HB-04 — adapter-selection schema (CAPCOM HARD GATE)
export type {
  AdapterDtype,
  AdapterEntry,
  AdapterPool,
  AdapterBinding,
  AdapterSelection,
  AdapterSelectionValidationResult,
} from './adapter-selection-schema.js';
export {
  AdapterDtypeSchema,
  AdapterEntrySchema,
  AdapterPoolSchema,
  AdapterBindingSchema,
  AdapterSelectionSchema,
  validateAdapterSelection,
  ADAPTER_SELECTION_SCHEMA_VERSION,
} from './adapter-selection-schema.js';

// HB-07 — verification doctrine (typed spec)
export type {
  VerificationMethod,
  VerifierKind,
  VerificationSpec,
  VerificationSpecSeverity,
  VerificationSpecFinding,
  VerificationSpecAuditResult,
} from './verification-spec.js';
export {
  VerificationMethodSchema,
  VerifierKindSchema,
  VerificationSpecSchema,
  VerificationSpecSeveritySchema,
  auditVerificationSpec,
  VERIFICATION_SPEC_VERSION,
} from './verification-spec.js';
