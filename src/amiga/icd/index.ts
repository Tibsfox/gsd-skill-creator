/**
 * Barrel exports for all ICD modules.
 *
 * Provides a single import point for:
 * - All 4 ICD schema files (icd-01 through icd-04)
 * - Combined schema and metadata collections
 * - Validation utilities (validator + cross-reference checker)
 */

// ICD-01: MC-1/ME-1 Interface
export {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
  GateSignalPayloadSchema,
  GateResponsePayloadSchema,
  CommandDispatchPayloadSchema,
  ICD_01_SCHEMAS,
  ICD_01_META,
} from './icd-01.js';
export type {
  TelemetryUpdatePayload,
  AlertSurfacePayload,
  GateSignalPayload,
  GateResponsePayload,
  CommandDispatchPayload,
} from './icd-01.js';

// ICD-02: ME-1/CE-1 Interface
export {
  DependencyNodeSchema,
  LedgerEntryPayloadSchema,
  ICD_02_SCHEMAS,
  ICD_02_META,
} from './icd-02.js';
export type {
  DependencyNode,
  LedgerEntryPayload,
} from './icd-02.js';

// ICD-03: MC-1/GL-1 Interface
export {
  GovernanceQueryPayloadSchema,
  GovernanceResponsePayloadSchema,
  ICD_03_SCHEMAS,
  ICD_03_META,
} from './icd-03.js';
export type {
  GovernanceQueryPayload,
  GovernanceResponsePayload,
} from './icd-03.js';

// ICD-04: CE-1/GL-1 Interface
export {
  LedgerReadPayloadSchema,
  DisputeRecordPayloadSchema,
  EvidenceItemSchema,
  AlgorithmAdjustmentSchema,
  ICD_04_SCHEMAS,
  ICD_04_META,
} from './icd-04.js';
export type {
  LedgerReadPayload,
  DisputeRecordPayload,
  EvidenceItem,
  AlgorithmAdjustment,
} from './icd-04.js';

// Validation utilities
export {
  validateICD,
  crossReferenceCheck,
  validateAllICDs,
} from './icd-validator.js';
export type {
  ICDMeta,
  ICDValidationError,
  ICDValidationResult,
  CrossReferenceResult,
  AggregateValidationResult,
} from './icd-validator.js';

// ============================================================================
// Combined collections
// ============================================================================

import { ICD_01_META } from './icd-01.js';
import { ICD_02_META } from './icd-02.js';
import { ICD_03_META } from './icd-03.js';
import { ICD_04_META } from './icd-04.js';
import { ICD_01_SCHEMAS } from './icd-01.js';
import { ICD_02_SCHEMAS } from './icd-02.js';
import { ICD_03_SCHEMAS } from './icd-03.js';
import { ICD_04_SCHEMAS } from './icd-04.js';

/**
 * Array of all 4 ICD metadata objects.
 */
export const ALL_ICD_META = [
  ICD_01_META,
  ICD_02_META,
  ICD_03_META,
  ICD_04_META,
] as const;

/**
 * Combined schema mapping across all ICDs.
 * Maps every event type string to its Zod payload schema.
 */
export const ALL_ICD_SCHEMAS = {
  ...ICD_01_SCHEMAS,
  ...ICD_02_SCHEMAS,
  ...ICD_03_SCHEMAS,
  ...ICD_04_SCHEMAS,
} as const;
