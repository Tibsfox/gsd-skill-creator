/**
 * Barrel exports for the AMIGA module.
 *
 * Provides a single import point for all AMIGA foundation types:
 * - Shared data types (Zod schemas + inferred TypeScript types)
 * - Agent registry (14 agents across 5 teams)
 * - Event routing table (11 event types)
 * - Message envelope schema + factory
 * - ICD payload schemas, metadata, and validation utilities
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
