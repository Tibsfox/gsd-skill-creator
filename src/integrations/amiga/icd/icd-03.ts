/**
 * ICD-03: MC-1/GL-1 Interface payload schemas.
 *
 * Defines Zod payload schemas for the governance interface between
 * Mission Control (MC-1) and Gate Lead (GL-1).
 *
 * Event types:
 * - GOVERNANCE_QUERY (MC-1 -> GL-1, requires_ack): compliance checks, policy lookups
 * - GOVERNANCE_RESPONSE (GL-1 -> MC-1): verdict with mandatory reasoning
 *
 * All schemas use `.passthrough()` for forward compatibility.
 */

import { z } from 'zod';
import { AgentIDSchema } from '../types.js';

// ============================================================================
// GovernanceQueryPayloadSchema
// ============================================================================

/**
 * Governance query payload (MC-1 -> GL-1, requires_ack=true).
 *
 * Requests a governance check -- compliance verification, policy lookup,
 * dispute initiation, or weight review. The requestor can be an agent
 * or a human operator.
 */
export const GovernanceQueryPayloadSchema = z.object({
  query_type: z.enum(['compliance_check', 'policy_lookup', 'dispute_initiate', 'weight_review']),
  subject: z.string().min(1),
  requestor: z.union([AgentIDSchema, z.literal('human')]),
  distribution_plan_id: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type GovernanceQueryPayload = z.infer<typeof GovernanceQueryPayloadSchema>;

// ============================================================================
// GovernanceResponsePayloadSchema
// ============================================================================

/**
 * Governance response payload (GL-1 -> MC-1).
 *
 * Carries the verdict, mandatory reasoning (per FOUND-06), respondent
 * identity, and optional citations or recommendations.
 */
export const GovernanceResponsePayloadSchema = z.object({
  query_id: z.string().min(1),
  verdict: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'ADVISORY']),
  reasoning: z.string().min(1),
  respondent: AgentIDSchema,
  cited_clauses: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
}).passthrough();

export type GovernanceResponsePayload = z.infer<typeof GovernanceResponsePayloadSchema>;

// ============================================================================
// ICD_03_SCHEMAS convenience mapping
// ============================================================================

/**
 * Maps event type strings to their Zod payload schemas for ICD-03.
 */
export const ICD_03_SCHEMAS = {
  GOVERNANCE_QUERY: GovernanceQueryPayloadSchema,
  GOVERNANCE_RESPONSE: GovernanceResponsePayloadSchema,
} as const;

// ============================================================================
// ICD_03_META metadata
// ============================================================================

/**
 * ICD-03 metadata: interface identity, parties, and event type inventory.
 */
export const ICD_03_META = {
  id: 'ICD-03',
  name: 'MC-1/GL-1 Interface',
  parties: ['MC-1', 'GL-1'] as const,
  event_types: ['GOVERNANCE_QUERY', 'GOVERNANCE_RESPONSE'] as const,
} as const;
