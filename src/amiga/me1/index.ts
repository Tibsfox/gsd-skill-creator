/**
 * Barrel exports for the ME-1 (Mission Environment) module.
 *
 * Provides a single import point for all ME-1 public API:
 * - Mission manifest schema, types, factory, and update utility
 * - Telemetry emitter for ICD-01 event production
 * - Provisioner for clean environment creation
 * - Phase engine for lifecycle transition management
 * - Gate controller for REVIEW_GATE suspension and clearance
 * - Swarm coordinator for command dispatch and resource locking
 * - Archive writer for sealed immutable mission records
 */

// Manifest schemas, types, constants, factory, and update utility
export {
  MissionManifestSchema,
  SkillEntrySchema,
  AgentEntrySchema,
  TelemetryConfigSchema,
  PhaseEntrySchema,
  ManifestStatusSchema,
  EntryCriterionSchema,
  MANIFEST_STATUSES,
  createManifest,
  updateManifest,
} from './manifest.js';
export type {
  MissionManifest,
  SkillEntry,
  AgentEntry,
  TelemetryConfig,
  PhaseEntry,
  ManifestStatus,
  EntryCriterion,
} from './manifest.js';

// Telemetry emitter
export { TelemetryEmitter } from './telemetry-emitter.js';
export type { TelemetryEmitterConfig } from './telemetry-emitter.js';

// Provisioner
export { provision } from './provisioner.js';
export type { MissionBrief, ProvisionedEnvironment } from './provisioner.js';

// Phase engine
export { PhaseEngine, PHASE_ORDER, VALID_TRANSITIONS } from './phase-engine.js';
export type { PhaseTransitionResult } from './phase-engine.js';

// Gate controller
export { GateController } from './gate-controller.js';
export type { GateControllerConfig, GateClearance, GateSuspension } from './gate-controller.js';

// Swarm coordinator
export { SwarmCoordinator } from './swarm-coordinator.js';
export type {
  SwarmCoordinatorConfig,
  ResourceLock,
  TeamRegistration,
  CommandResult,
} from './swarm-coordinator.js';

// Archive writer
export { ArchiveWriter } from './archive-writer.js';
export type {
  ArchiveWriterConfig,
  MissionArchive,
  ArchiveOutcome,
  InvocationRecord,
} from './archive-writer.js';
