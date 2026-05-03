/**
 * High-level emitter entry points.
 *
 * Re-exports the MissionEmitter class with the public surface. UI code calls
 * `emitter.emitSendNow(decisionId)` or `emitter.emitBundle(meetingId)`.
 *
 * Phase 825 / C10.
 */

export {
  MissionEmitter,
  type EmissionResult,
  type BundleEmissionResult,
  type EmitterKB,
  type ComposeContext,
  type FindingSummary,
  type MissionEmitterOptions,
} from './compose.js';

export {
  composeBundleManifest,
  parseBundleManifest,
  type BundleManifestData,
  type ManifestDecisionEntry,
  type ManifestExcludedEntry,
  type ManifestBatchHints,
} from './manifest.js';

export {
  atomicWriteFile,
  cleanupOrphanTransactions,
  emitBundle,
  type EmissionPayload,
  type BundleManifestPayload,
} from './staging.js';

export { generateRequestId } from './request-id.js';
export { renderTemplate, lookup, type TemplateContext } from './template-render.js';
export { validateMeta, MetaValidationError } from './meta-validator.js';
