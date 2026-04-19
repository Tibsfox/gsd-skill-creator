/**
 * Type barrel exports for the GSD Skill Creator.
 *
 * Re-exports security types for v1.38 SSH Agent Security milestone.
 * Other type modules are imported directly by path as they predate
 * this barrel file.
 *
 * @module types
 */

export {
  DomainCredentialSchema,
  SecurityEventSchema,
  SandboxProfileSchema,
  ProxyConfigSchema,
  AgentIsolationStateSchema,
} from './security.js';

export type {
  DomainCredential,
  SecurityEvent,
  SandboxProfile,
  ProxyConfig,
  AgentIsolationState,
} from './security.js';

// ─── Living Sensoria (v1.49.561) — M1..M8 shared types ──────────────────

export type {
  EntityKind,
  Entity,
  Edge,
  Community,
  MemoryEntry,
  ReflectionBatch,
  DecisionTrace,
  BranchState,
  LivingSensoriaBranch,
  PrefixCacheHit,
  StepGraphNode,
} from './memory.js';

export type {
  SensoriaBlock,
  NetShiftResult,
  DesensitisationState,
} from './sensoria.js';

export type {
  SensoryState,
  ActiveState,
  InternalState,
  ExternalObservationProxy,
  GenerativeModel,
  FreeEnergyResult,
  SurpriseEntry,
} from './umwelt.js';

export type {
  TeachCategory,
  TeachEntry,
  OfferingKind,
  CoEvolutionOffering,
  QuintessenceSnapshot,
} from './symbiosis.js';
