/**
 * AMIGA shared data type system.
 *
 * Defines Zod schemas for the 8 foundation types used across all AMIGA
 * components (MC-1, ME-1, CE-1, GL-1). Every ICD and the message bus
 * reference these types.
 *
 * Schemas:
 * - MissionIDSchema: mission identifier in mission-YYYY-MM-DD-NNN format
 * - ContributorIDSchema: contributor identifier in contrib-[a-z0-9-]+ format
 * - AgentIDSchema: agent identifier with team prefix, number, optional sub-agent
 * - PhaseStatusSchema: 8-value enum for mission phase lifecycle
 * - AlertLevelSchema: 3-value enum for alert severity
 * - GateDecisionSchema: 3-value enum for gate review outcomes
 * - TimestampSchema: ISO 8601 UTC timestamp string
 * - PrioritySchema: 4-value enum for task priority
 *
 * All schemas use Zod for runtime validation with inferred TypeScript types
 * (zero type duplication).
 */

import { z } from 'zod';

// ============================================================================
// MissionIDSchema
// ============================================================================

/**
 * Validates mission identifiers in the format mission-YYYY-MM-DD-NNN.
 *
 * Examples: 'mission-2026-02-17-001', 'mission-2025-12-31-999'
 */
export const MissionIDSchema = z.string().regex(
  /^mission-\d{4}-\d{2}-\d{2}-\d{3}$/,
  'MissionID must match mission-YYYY-MM-DD-NNN format',
);

export type MissionID = z.infer<typeof MissionIDSchema>;

// ============================================================================
// ContributorIDSchema
// ============================================================================

/**
 * Validates contributor identifiers in the format contrib-[a-z0-9-]+.
 *
 * The min(8) constraint ensures at least one character after the 'contrib-'
 * prefix (7 chars for prefix + 1 char minimum = 8).
 *
 * Examples: 'contrib-skill-author-abc123', 'contrib-a'
 */
export const ContributorIDSchema = z.string()
  .regex(
    /^contrib-[a-z0-9-]+$/,
    'ContributorID must match contrib-[a-z0-9-]+ format',
  )
  .min(8, 'ContributorID must have at least one character after prefix');

export type ContributorID = z.infer<typeof ContributorIDSchema>;

// ============================================================================
// AgentIDSchema
// ============================================================================

/**
 * Validates agent identifiers with team prefix, number, and optional sub-agent.
 *
 * Format: {TEAM}-{N}[.{suffix}]
 * - TEAM: CS (Command Staff), ME (Mission Execution), CE (Chief Engineer),
 *         GL (Gate Lead), OPS (Operations)
 * - N: positive integer
 * - suffix: optional single lowercase letter for sub-agents
 *
 * Examples: 'CS-1', 'ME-2', 'GL-1', 'ME-2.r'
 */
export const AgentIDSchema = z.string().regex(
  /^(CS|ME|CE|GL|OPS)-\d+(\.[a-z])?$/,
  'AgentID must match {TEAM}-{N} or {TEAM}-{N}.{suffix} format (teams: CS, ME, CE, GL, OPS)',
);

export type AgentID = z.infer<typeof AgentIDSchema>;

// ============================================================================
// PhaseStatusSchema
// ============================================================================

/** All valid phase status values. */
export const PHASE_STATUSES = [
  'BRIEFING',
  'PLANNING',
  'EXECUTION',
  'INTEGRATION',
  'REVIEW_GATE',
  'COMPLETION',
  'HOLD',
  'ABORT',
] as const;

/**
 * Validates phase lifecycle status values.
 *
 * Lifecycle flow: BRIEFING -> PLANNING -> EXECUTION -> INTEGRATION ->
 *                 REVIEW_GATE -> COMPLETION
 * Special states: HOLD (paused), ABORT (terminated)
 */
export const PhaseStatusSchema = z.enum(PHASE_STATUSES);

export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

// ============================================================================
// AlertLevelSchema
// ============================================================================

/** All valid alert level values. */
export const ALERT_LEVELS = ['nominal', 'advisory', 'gate'] as const;

/**
 * Validates alert severity levels.
 *
 * - nominal: normal operation, no issues
 * - advisory: attention needed, not blocking
 * - gate: blocking issue, requires gate review
 */
export const AlertLevelSchema = z.enum(ALERT_LEVELS);

export type AlertLevel = z.infer<typeof AlertLevelSchema>;

// ============================================================================
// GateDecisionSchema
// ============================================================================

/** All valid gate decision values. */
export const GATE_DECISIONS = ['go', 'no_go', 'redirect'] as const;

/**
 * Validates gate review decision outcomes.
 *
 * - go: proceed to next phase
 * - no_go: block progression, issues must be resolved
 * - redirect: reroute to different phase or approach
 */
export const GateDecisionSchema = z.enum(GATE_DECISIONS);

export type GateDecision = z.infer<typeof GateDecisionSchema>;

// ============================================================================
// TimestampSchema
// ============================================================================

/**
 * Validates ISO 8601 UTC timestamp strings.
 *
 * Accepts: '2026-02-17T14:30:00Z', '2026-02-17T14:30:00.000Z'
 * Rejects: date-only, time-only, non-UTC timezones
 */
export const TimestampSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
  'Timestamp must be ISO 8601 UTC format (e.g., 2026-02-17T14:30:00Z)',
);

export type Timestamp = z.infer<typeof TimestampSchema>;

// ============================================================================
// PrioritySchema
// ============================================================================

/** All valid priority values. */
export const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

/**
 * Validates task priority levels.
 *
 * Ordered from lowest to highest: low -> normal -> high -> urgent
 */
export const PrioritySchema = z.enum(PRIORITIES);

export type Priority = z.infer<typeof PrioritySchema>;

// ============================================================================
// Team Prefixes
// ============================================================================

/**
 * Valid team prefixes for AgentID construction.
 *
 * - CS: Command Staff
 * - ME: Mission Execution
 * - CE: Chief Engineer
 * - GL: Gate Lead
 * - OPS: Operations
 */
export const TEAM_PREFIXES = ['CS', 'ME', 'CE', 'GL', 'OPS'] as const;

export type TeamPrefix = (typeof TEAM_PREFIXES)[number];

// ============================================================================
// AMIGA_SCHEMAS convenience object
// ============================================================================

/**
 * Maps type name strings to their Zod schemas for programmatic
 * iteration and validation.
 */
export const AMIGA_SCHEMAS = {
  MissionID: MissionIDSchema,
  ContributorID: ContributorIDSchema,
  AgentID: AgentIDSchema,
  PhaseStatus: PhaseStatusSchema,
  AlertLevel: AlertLevelSchema,
  GateDecision: GateDecisionSchema,
  Timestamp: TimestampSchema,
  Priority: PrioritySchema,
} as const;
