/**
 * ICD-02: ME-1/CE-1 Interface payload schemas.
 *
 * Defines Zod payload schemas for the attribution data interface between
 * Mission Environment (ME-1) and Commons Engine (CE-1).
 *
 * Event types:
 * - LEDGER_ENTRY (ME-1 -> CE-1): contribution record with dependency tree and depth decay
 *
 * All schemas use `.passthrough()` for forward compatibility.
 */

import { z } from 'zod';
import {
  MissionIDSchema,
  ContributorIDSchema,
  AgentIDSchema,
  PhaseStatusSchema,
  TimestampSchema,
} from '../types.js';

// ============================================================================
// DependencyNodeSchema
// ============================================================================

/**
 * Dependency tree node representing a transitive contributor.
 *
 * - depth 0 = direct dependency
 * - depth 1+ = transitive dependency
 * - decay_factor: 0-1 weight multiplier based on depth
 */
export const DependencyNodeSchema = z.object({
  contributor_id: ContributorIDSchema,
  depth: z.number().int().min(0),
  decay_factor: z.number().min(0).max(1),
});

export type DependencyNode = z.infer<typeof DependencyNodeSchema>;

// ============================================================================
// LedgerEntryPayloadSchema
// ============================================================================

/**
 * Ledger entry payload (ME-1 -> CE-1).
 *
 * Records a contribution to the attribution ledger. Includes the contributor,
 * skill invoked, mission phase, context weight (significance), and a
 * depth-decayed dependency tree for transitive attribution.
 */
export const LedgerEntryPayloadSchema = z.object({
  mission_id: MissionIDSchema,
  contributor_id: ContributorIDSchema,
  agent_id: AgentIDSchema,
  skill_name: z.string().min(1),
  phase: PhaseStatusSchema,
  timestamp: TimestampSchema,
  context_weight: z.number().min(0).max(1),
  dependency_tree: z.array(DependencyNodeSchema),
  invocation_id: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();

export type LedgerEntryPayload = z.infer<typeof LedgerEntryPayloadSchema>;

// ============================================================================
// ICD_02_SCHEMAS convenience mapping
// ============================================================================

/**
 * Maps event type strings to their Zod payload schemas for ICD-02.
 */
export const ICD_02_SCHEMAS = {
  LEDGER_ENTRY: LedgerEntryPayloadSchema,
} as const;

// ============================================================================
// ICD_02_META metadata
// ============================================================================

/**
 * ICD-02 metadata: interface identity, parties, and event type inventory.
 */
export const ICD_02_META = {
  id: 'ICD-02',
  name: 'ME-1/CE-1 Interface',
  parties: ['ME-1', 'CE-1'] as const,
  event_types: ['LEDGER_ENTRY'] as const,
} as const;
