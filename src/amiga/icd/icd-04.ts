/**
 * ICD-04: CE-1/GL-1 Interface payload schemas.
 *
 * Defines Zod payload schemas for the interface between Commons Engine (CE-1)
 * and Gate Lead (GL-1). Provides read-only ledger access and dispute resolution.
 *
 * Event types:
 * - LEDGER_READ (GL-1 -> CE-1): read-only ledger queries with filters
 * - DISPUTE_RECORD: dispute documentation with evidence and algorithm adjustments
 *
 * All schemas use `.passthrough()` for forward compatibility.
 */

import { z } from 'zod';
import {
  ContributorIDSchema,
  AgentIDSchema,
  MissionIDSchema,
  PhaseStatusSchema,
  TimestampSchema,
} from '../types.js';

// ============================================================================
// LedgerReadPayloadSchema
// ============================================================================

/**
 * Ledger read payload (GL-1 -> CE-1, read-only access).
 *
 * Queries the attribution ledger with optional filters for mission,
 * contributor, phase, and time range.
 */
export const LedgerReadPayloadSchema = z.object({
  query: z.enum(['by_mission', 'by_contributor', 'by_phase', 'summary']),
  requestor: AgentIDSchema,
  mission_id: MissionIDSchema.optional(),
  contributor_id: ContributorIDSchema.optional(),
  phase: PhaseStatusSchema.optional(),
  from_timestamp: TimestampSchema.optional(),
  to_timestamp: TimestampSchema.optional(),
}).passthrough();

export type LedgerReadPayload = z.infer<typeof LedgerReadPayloadSchema>;

// ============================================================================
// EvidenceItemSchema
// ============================================================================

/** Evidence item supporting a dispute claim. */
export const EvidenceItemSchema = z.object({
  type: z.enum(['ledger_entry', 'invocation_log', 'weight_calculation', 'other']),
  reference: z.string().min(1),
  description: z.string().min(1),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

// ============================================================================
// AlgorithmAdjustmentSchema
// ============================================================================

/** Algorithm adjustment resulting from a resolved dispute. */
export const AlgorithmAdjustmentSchema = z.object({
  parameter: z.string().min(1),
  old_value: z.string().min(1),
  new_value: z.string().min(1),
  rationale: z.string().min(1),
});

export type AlgorithmAdjustment = z.infer<typeof AlgorithmAdjustmentSchema>;

// ============================================================================
// DisputeRecordPayloadSchema
// ============================================================================

/**
 * Dispute record payload.
 *
 * Documents a dispute against a ledger entry or weighting calculation.
 * Requires at least one evidence item. Resolved disputes may include
 * a conclusion and optional algorithm adjustment.
 */
export const DisputeRecordPayloadSchema = z.object({
  raiser: z.union([ContributorIDSchema, AgentIDSchema]),
  disputed_item: z.string().min(1),
  evidence: z.array(EvidenceItemSchema).min(1),
  status: z.enum(['open', 'under_review', 'resolved', 'rejected']),
  conclusion: z.string().optional(),
  algorithm_adjustment: AlgorithmAdjustmentSchema.nullable().optional(),
  resolved_at: TimestampSchema.optional(),
}).passthrough();

export type DisputeRecordPayload = z.infer<typeof DisputeRecordPayloadSchema>;

// ============================================================================
// ICD_04_SCHEMAS convenience mapping
// ============================================================================

/**
 * Maps event type strings to their Zod payload schemas for ICD-04.
 */
export const ICD_04_SCHEMAS = {
  LEDGER_READ: LedgerReadPayloadSchema,
  DISPUTE_RECORD: DisputeRecordPayloadSchema,
} as const;

// ============================================================================
// ICD_04_META metadata
// ============================================================================

/**
 * ICD-04 metadata: interface identity, parties, and event type inventory.
 */
export const ICD_04_META = {
  id: 'ICD-04',
  name: 'CE-1/GL-1 Interface',
  parties: ['CE-1', 'GL-1'] as const,
  event_types: ['LEDGER_READ', 'DISPUTE_RECORD'] as const,
} as const;
