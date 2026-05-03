/**
 * Intelligence Dashboard barrel.
 *
 * Re-exports the shared TypeScript contracts (types.ts) and the KB stub
 * (kb/stub.ts) for downstream Wave 1 components to consume.
 */

export * from './types.js';
export { IntelligenceKBStub } from './kb/stub.js';
export {
  MissionEmitter,
  composeBundleManifest,
  parseBundleManifest,
  generateRequestId,
  validateMeta,
  MetaValidationError,
} from './emitter/emit.js';
export type {
  EmissionResult,
  BundleEmissionResult,
  EmitterKB,
  ComposeContext,
  FindingSummary,
  BundleManifestData,
  ManifestDecisionEntry,
} from './emitter/emit.js';
export { MeetingRecordGenerator } from './meetings/record.js';
export type {
  MeetingRecordKB,
  MeetingRecordGeneratorOptions,
  RecordResult,
  RecordSummary,
  OutcomeUpdate,
} from './meetings/record.js';
