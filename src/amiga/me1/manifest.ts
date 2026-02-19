/**
 * Mission manifest schema, factory, and update utility.
 *
 * The manifest is ME-1's core data model -- the single source of truth for a
 * mission's configuration and runtime state. It is:
 * - Machine-parseable: Zod safeParse validates every field
 * - Human-readable: descriptive field names and string enums throughout
 * - Incrementally writable: createManifest for initial construction,
 *   updateManifest for partial updates that merge without data loss
 *
 * Schemas:
 * - ManifestStatusSchema: 6-value enum for manifest lifecycle
 * - SkillEntrySchema: loaded skill with version and active flag
 * - AgentEntrySchema: registered agent with role and status
 * - TelemetryConfigSchema: telemetry toggle, interval, event types
 * - EntryCriterionSchema: named boolean criterion with optional description
 * - PhaseEntrySchema: phase status with optional timestamps and entry criteria
 * - MissionManifestSchema: top-level manifest combining all sub-schemas
 */

import { z } from 'zod';
import {
  MissionIDSchema,
  PhaseStatusSchema,
  AgentIDSchema,
  TimestampSchema,
} from '../types.js';

// ============================================================================
// ManifestStatusSchema
// ============================================================================

/** All valid manifest status values. */
export const MANIFEST_STATUSES = [
  'draft', 'provisioned', 'active', 'completed', 'aborted', 'archived',
] as const;

/**
 * Validates manifest lifecycle status.
 *
 * Flow: draft -> provisioned -> active -> completed
 * Terminal: aborted, archived
 */
export const ManifestStatusSchema = z.enum(MANIFEST_STATUSES);

export type ManifestStatus = z.infer<typeof ManifestStatusSchema>;

// ============================================================================
// SkillEntrySchema
// ============================================================================

/**
 * Skill entry within a mission manifest.
 *
 * Tracks a loaded skill's identity, version, load time, and active state.
 */
export const SkillEntrySchema = z.object({
  /** Skill identifier (e.g., 'pattern-detection'). */
  skill_id: z.string().min(1),
  /** Semantic version string. */
  version: z.string().min(1),
  /** When the skill was loaded (ISO 8601 UTC). */
  loaded_at: TimestampSchema,
  /** Whether the skill is currently active. */
  active: z.boolean(),
}).passthrough();

export type SkillEntry = z.infer<typeof SkillEntrySchema>;

// ============================================================================
// AgentEntrySchema
// ============================================================================

/**
 * Agent entry within a mission manifest.
 *
 * Tracks a registered agent's identity, role, registration time, and status.
 */
export const AgentEntrySchema = z.object({
  /** Agent identifier (validates against AgentIDSchema). */
  agent_id: AgentIDSchema,
  /** Human-readable role description. */
  role: z.string().min(1),
  /** When the agent was registered (ISO 8601 UTC). */
  registered_at: TimestampSchema,
  /** Agent operational status. */
  status: z.enum(['registered', 'active', 'idle', 'terminated']),
}).passthrough();

export type AgentEntry = z.infer<typeof AgentEntrySchema>;

// ============================================================================
// TelemetryConfigSchema
// ============================================================================

/**
 * Telemetry configuration within a mission manifest.
 *
 * Controls whether telemetry is active, how often it fires, and which
 * event types are emitted.
 */
export const TelemetryConfigSchema = z.object({
  /** Whether telemetry emission is enabled. */
  enabled: z.boolean(),
  /** Minimum interval between telemetry emissions (ms). Must be >= 100. */
  interval_ms: z.number().int().min(100),
  /** Event types to emit. At least one required. */
  event_types: z.array(z.string().min(1)).min(1),
}).passthrough();

export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>;

// ============================================================================
// EntryCriterionSchema
// ============================================================================

/**
 * Entry criterion for a mission phase.
 *
 * A named boolean check that must be met before a phase can be entered.
 */
export const EntryCriterionSchema = z.object({
  /** Criterion name (e.g., 'Brief reviewed'). */
  name: z.string().min(1),
  /** Whether the criterion has been met. */
  met: z.boolean(),
  /** Optional human-readable description. */
  description: z.string().optional(),
});

export type EntryCriterion = z.infer<typeof EntryCriterionSchema>;

// ============================================================================
// PhaseEntrySchema
// ============================================================================

/**
 * Phase entry within a mission manifest.
 *
 * Tracks the status of a single lifecycle phase, including optional
 * start/completion timestamps and entry criteria.
 */
export const PhaseEntrySchema = z.object({
  /** Current phase status. */
  status: PhaseStatusSchema,
  /** When the phase was started (ISO 8601 UTC). */
  started_at: TimestampSchema.optional(),
  /** When the phase was completed (ISO 8601 UTC). */
  completed_at: TimestampSchema.optional(),
  /** Entry criteria that must be met before entering this phase. */
  entry_criteria: z.array(EntryCriterionSchema),
}).passthrough();

export type PhaseEntry = z.infer<typeof PhaseEntrySchema>;

// ============================================================================
// MissionManifestSchema
// ============================================================================

/**
 * Top-level mission manifest schema.
 *
 * The single source of truth for a mission's configuration and runtime state.
 * Contains the mission identity, lifecycle status, phase entries, loaded
 * skills, registered agents, and telemetry configuration.
 */
export const MissionManifestSchema = z.object({
  /** Mission identifier (mission-YYYY-MM-DD-NNN format). */
  mission_id: MissionIDSchema,
  /** Human-readable mission name. */
  name: z.string().min(1),
  /** Mission description/purpose. */
  description: z.string().min(1),
  /** When the manifest was created (ISO 8601 UTC). */
  created_at: TimestampSchema,
  /** When the manifest was last updated (ISO 8601 UTC). */
  updated_at: TimestampSchema,
  /** Manifest lifecycle status. */
  status: ManifestStatusSchema,
  /** Phase entries keyed by phase name. */
  phases: z.record(z.string(), PhaseEntrySchema),
  /** Loaded skills. */
  skills: z.array(SkillEntrySchema),
  /** Registered agents. */
  agents: z.array(AgentEntrySchema),
  /** Telemetry configuration. */
  telemetry_config: TelemetryConfigSchema,
}).passthrough();

export type MissionManifest = z.infer<typeof MissionManifestSchema>;

// ============================================================================
// Factory: createManifest
// ============================================================================

/** Default lifecycle phases initialized to BRIEFING with empty criteria. */
const DEFAULT_PHASE_NAMES = [
  'BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION',
] as const;

/**
 * Create a new mission manifest with sensible defaults.
 *
 * Auto-generates created_at and updated_at as current UTC timestamps.
 * Initializes all 6 lifecycle phases, empty skill/agent arrays, and
 * default telemetry configuration.
 *
 * @param input - Mission identity fields (mission_id, name, description)
 * @returns A fully populated MissionManifest in 'draft' status
 */
export function createManifest(input: {
  mission_id: string;
  name: string;
  description: string;
}): MissionManifest {
  const now = new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z');

  const phases: Record<string, PhaseEntry> = {};
  for (const phaseName of DEFAULT_PHASE_NAMES) {
    phases[phaseName] = {
      status: 'BRIEFING',
      entry_criteria: [],
    };
  }

  return {
    mission_id: input.mission_id,
    name: input.name,
    description: input.description,
    created_at: now,
    updated_at: now,
    status: 'draft',
    phases,
    skills: [],
    agents: [],
    telemetry_config: {
      enabled: true,
      interval_ms: 5000,
      event_types: ['TELEMETRY_UPDATE', 'ALERT_SURFACE', 'GATE_SIGNAL'],
    },
  };
}

// ============================================================================
// Utility: updateManifest
// ============================================================================

/**
 * Merge partial updates into an existing manifest without mutation.
 *
 * For array fields (skills, agents), new entries are concatenated to existing
 * arrays rather than replacing them. The updated_at timestamp is always
 * refreshed to the current time.
 *
 * @param manifest - The existing manifest to update
 * @param updates - Partial fields to merge
 * @returns A new MissionManifest with the updates applied
 */
export function updateManifest(
  manifest: MissionManifest,
  updates: Partial<MissionManifest>,
): MissionManifest {
  const now = new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z');

  const merged: MissionManifest = {
    ...manifest,
    ...updates,
    updated_at: now,
  };

  // Concatenate array fields instead of replacing
  if (updates.skills) {
    merged.skills = [...manifest.skills, ...updates.skills];
  }
  if (updates.agents) {
    merged.agents = [...manifest.agents, ...updates.agents];
  }

  return merged;
}
