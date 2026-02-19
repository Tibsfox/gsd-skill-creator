/**
 * Barrel exports for the AMIGA module.
 *
 * Provides a single import point for all AMIGA public API:
 * - Shared data types (Zod schemas + inferred TypeScript types)
 * - Agent registry (14 agents across 5 teams)
 * - Event routing table (11 event types)
 * - Message envelope schema + factory
 * - ICD payload schemas, metadata, and validation utilities
 * - MC-1 Control Surface (Dashboard, AlertRenderer, TelemetryConsumer, CommandParser)
 * - ME-1 Mission Environment (Manifest, TelemetryEmitter, Provisioner, PhaseEngine, GateController, SwarmCoordinator, ArchiveWriter)
 * - Integration (MissionController -- MC-1/ME-1 cross-component harness)
 * - CE-1 Commons Engine (AttributionLedger, ContributionRegistry, InvocationRecorder, TokenArchitecture)
 * - GL-1 Governance Layer (Charter, Weighting Docs, Dispute Records, Rules Engine, Decision Log, Policy Query)
 * - Meta-Mission (MetaMissionHarness, SkillCandidateDetector -- M-5 Launch Gate)
 */

// Shared data types
export {
  MissionIDSchema, ContributorIDSchema, AgentIDSchema,
  PhaseStatusSchema, AlertLevelSchema, GateDecisionSchema,
  TimestampSchema, PrioritySchema,
  PHASE_STATUSES, ALERT_LEVELS, GATE_DECISIONS, PRIORITIES,
  TEAM_PREFIXES, AMIGA_SCHEMAS,
} from './types.js';
export type {
  MissionID, ContributorID, AgentID,
  PhaseStatus, AlertLevel, GateDecision,
  Timestamp, Priority, TeamPrefix,
} from './types.js';

// Agent registry
export type { AgentEntry, RouteEntry } from './agent-registry.js';
export {
  getAgent, getTeamAgents, getAllAgents,
  getRoute, getAllRoutes,
  AGENT_REGISTRY, ROUTING_TABLE,
} from './agent-registry.js';

// Message envelope
export { EventEnvelopeSchema, createEnvelope } from './message-envelope.js';
export type { EventEnvelope, CreateEnvelopeInput } from './message-envelope.js';

// ICD payload schemas, metadata, and validation
export * from './icd/index.js';

// MC-1 Control Surface
export * from './mc1/index.js';

// ME-1 Mission Environment
export * from './me1/index.js';

// Integration (MC-1/ME-1 cross-component)
export * from './integration/index.js';

// CE-1 Commons Engine
export * from './ce1/index.js';

// GL-1 Governance Layer
export * from './gl1/index.js';

// Meta-Mission (AMIGA M-5 Launch Gate)
export * from './meta-mission/index.js';
