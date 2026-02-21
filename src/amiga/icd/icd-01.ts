/**
 * ICD-01: MC-1/ME-1 Interface payload schemas.
 *
 * Defines Zod payload schemas for all 5 event types on the highest-traffic
 * AMIGA interface between Mission Control (MC-1) and Mission Environment (ME-1).
 *
 * Event types:
 * - TELEMETRY_UPDATE (ME-1 -> MC-1): phase progress, team status, checkpoints, resources
 * - ALERT_SURFACE (ME-1 -> MC-1): alert level, source agent, message, category
 * - GATE_SIGNAL (ME-1 -> MC-1, requires_ack): gate type, blocking phase, criteria, deadline
 * - GATE_RESPONSE (MC-1 -> ME-1): decision, reasoning, responder, correlation
 * - COMMAND_DISPATCH (MC-1 -> ME-1, requires_ack): command type, target agent, parameters
 *
 * All schemas use `.passthrough()` for forward compatibility.
 */

import { z } from 'zod';
import {
  MissionIDSchema,
  PhaseStatusSchema,
  AlertLevelSchema,
  GateDecisionSchema,
  AgentIDSchema,
  TimestampSchema,
} from '../types.js';

// ============================================================================
// TelemetryUpdatePayloadSchema
// ============================================================================

/** Team status entry within a telemetry update. */
const TeamStatusEntrySchema = z.object({
  status: z.enum(['green', 'amber', 'red']),
  agent_count: z.number().int().min(0),
});

/** Checkpoint entry within a telemetry update. */
const CheckpointEntrySchema = z.object({
  name: z.string().min(1),
  completed: z.boolean(),
  timestamp: TimestampSchema.optional(),
});

/** Resource utilization snapshot. */
const ResourceSnapshotSchema = z.object({
  cpu_percent: z.number().min(0),
  memory_mb: z.number().min(0),
  active_agents: z.number().int().min(0),
});

/**
 * Telemetry update payload (ME-1 -> MC-1).
 *
 * Carries phase progress, per-team status, checkpoint completion,
 * and resource utilization data.
 */
export const TelemetryUpdatePayloadSchema = z.object({
  mission_id: MissionIDSchema,
  phase: PhaseStatusSchema,
  progress: z.number().min(0).max(100),
  team_status: z.record(z.string(), TeamStatusEntrySchema),
  checkpoints: z.array(CheckpointEntrySchema),
  resources: ResourceSnapshotSchema,
}).passthrough();

export type TelemetryUpdatePayload = z.infer<typeof TelemetryUpdatePayloadSchema>;

// ============================================================================
// AlertSurfacePayloadSchema
// ============================================================================

/**
 * Alert surface payload (ME-1 -> MC-1).
 *
 * Carries alert severity, source agent, human-readable message,
 * category, and optional resolution suggestion.
 */
export const AlertSurfacePayloadSchema = z.object({
  alert_level: AlertLevelSchema,
  source_agent: AgentIDSchema,
  message: z.string().min(1),
  category: z.enum(['resource', 'phase', 'agent', 'system']),
  resolution: z.string().optional(),
  expires_at: TimestampSchema.optional(),
}).passthrough();

export type AlertSurfacePayload = z.infer<typeof AlertSurfacePayloadSchema>;

// ============================================================================
// GateSignalPayloadSchema
// ============================================================================

/** Gate criteria entry. */
const GateCriterionSchema = z.object({
  name: z.string().min(1),
  met: z.boolean(),
  evidence: z.string().optional(),
});

/**
 * Gate signal payload (ME-1 -> MC-1, requires_ack=true).
 *
 * Signals a gate review is needed. Carries the gate type, which phase
 * is blocked, a checklist of criteria, and a deadline for response.
 */
export const GateSignalPayloadSchema = z.object({
  gate_type: z.enum(['phase_transition', 'quality_check', 'integration_verify', 'human_review']),
  blocking_phase: PhaseStatusSchema,
  criteria: z.array(GateCriterionSchema).min(1),
  deadline: TimestampSchema,
  context: z.string().optional(),
}).passthrough();

export type GateSignalPayload = z.infer<typeof GateSignalPayloadSchema>;

// ============================================================================
// GateResponsePayloadSchema
// ============================================================================

/**
 * Gate response payload (MC-1 -> ME-1).
 *
 * Carries the gate review decision, mandatory reasoning, responder
 * identity, correlation to the original gate signal, and optional
 * conditions for redirect decisions.
 */
export const GateResponsePayloadSchema = z.object({
  decision: GateDecisionSchema,
  reasoning: z.string().min(1),
  responder: z.union([AgentIDSchema, z.literal('human')]),
  gate_signal_id: z.string().min(1),
  conditions: z.array(z.string()).optional(),
}).passthrough();

export type GateResponsePayload = z.infer<typeof GateResponsePayloadSchema>;

// ============================================================================
// CommandDispatchPayloadSchema
// ============================================================================

/**
 * Command dispatch payload (MC-1 -> ME-1, requires_ack=true).
 *
 * Dispatches one of 8 mission commands to a specific agent or broadcast.
 * LAUNCH is the only command that does not require a mission_id.
 */
export const CommandDispatchPayloadSchema = z.object({
  command: z.enum(['LAUNCH', 'STATUS', 'REDIRECT', 'REVIEW', 'HOLD', 'RESUME', 'ABORT', 'DEBRIEF']),
  target_agent: z.union([AgentIDSchema, z.literal('broadcast')]),
  mission_id: MissionIDSchema.optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type CommandDispatchPayload = z.infer<typeof CommandDispatchPayloadSchema>;

// ============================================================================
// ICD_01_SCHEMAS convenience mapping
// ============================================================================

/**
 * Maps event type strings to their Zod payload schemas for ICD-01.
 */
export const ICD_01_SCHEMAS = {
  TELEMETRY_UPDATE: TelemetryUpdatePayloadSchema,
  ALERT_SURFACE: AlertSurfacePayloadSchema,
  GATE_SIGNAL: GateSignalPayloadSchema,
  GATE_RESPONSE: GateResponsePayloadSchema,
  COMMAND_DISPATCH: CommandDispatchPayloadSchema,
} as const;

// ============================================================================
// ICD_01_META metadata
// ============================================================================

/**
 * ICD-01 metadata: interface identity, parties, and event type inventory.
 */
export const ICD_01_META = {
  id: 'ICD-01',
  name: 'MC-1/ME-1 Interface',
  parties: ['MC-1', 'ME-1'] as const,
  event_types: [
    'TELEMETRY_UPDATE',
    'ALERT_SURFACE',
    'GATE_SIGNAL',
    'GATE_RESPONSE',
    'COMMAND_DISPATCH',
  ] as const,
} as const;
