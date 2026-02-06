/**
 * Team configuration validation module.
 *
 * Provides Zod schemas for validating team config.json files with:
 * - TeamMemberSchema for individual member validation
 * - TeamConfigSchema for top-level team configuration
 * - TeamTaskSchema for task queue entries
 * - InboxMessageSchema for inter-agent messages
 * - validateTeamConfig() for structured validation results with semantic checks
 * - validateTopologyRules() for topology-specific structural validation
 */

import { z } from 'zod';
import {
  TEAM_TASK_STATUSES,
  BACKEND_TYPES,
  TEAM_MEMBER_MODELS,
  type TeamConfig,
  type TeamValidationResult,
} from '../types/team.js';

// ============================================================================
// TeamMemberSchema
// ============================================================================

/**
 * Zod schema for validating a team member.
 *
 * Required: agentId, name
 * Optional: agentType, color, joinedAt, backendType, model, cwd, prompt, planModeRequired
 * Uses passthrough() for forward compatibility with unknown fields.
 */
export const TeamMemberSchema = z
  .object({
    agentId: z.string().min(1, 'Agent ID is required'),
    name: z.string().min(1, 'Member name is required'),
    agentType: z.string().optional(),
    color: z.string().optional(),
    joinedAt: z.string().optional(),
    backendType: z.enum(BACKEND_TYPES as unknown as [string, ...string[]]).optional(),
    model: z.enum(TEAM_MEMBER_MODELS as unknown as [string, ...string[]]).optional(),
    cwd: z.string().optional(),
    prompt: z.string().optional(),
    planModeRequired: z.boolean().optional(),
  })
  .passthrough();

// ============================================================================
// TeamConfigSchema
// ============================================================================

/**
 * Zod schema for validating a team configuration.
 *
 * Required: name, leadAgentId, createdAt, members (min 1)
 * Optional: description
 * Uses passthrough() for forward compatibility with unknown fields.
 */
export const TeamConfigSchema = z
  .object({
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
    leadAgentId: z.string().min(1, 'Lead agent ID is required'),
    createdAt: z.string().min(1, 'Creation timestamp is required'),
    members: z.array(TeamMemberSchema).min(1, 'Team must have at least one member'),
  })
  .passthrough();

// ============================================================================
// TeamTaskSchema
// ============================================================================

/**
 * Zod schema for validating a team task.
 *
 * Required: id, subject, status
 * Optional: description, owner, activeForm, blockedBy, blocks, createdAt, updatedAt
 * Uses passthrough() for forward compatibility with unknown fields.
 */
export const TeamTaskSchema = z
  .object({
    id: z.string().min(1, 'Task ID is required'),
    subject: z.string().min(1, 'Task subject is required'),
    description: z.string().optional(),
    status: z.enum(TEAM_TASK_STATUSES as unknown as [string, ...string[]]),
    owner: z.string().optional(),
    activeForm: z.string().optional(),
    blockedBy: z.array(z.string()).optional(),
    blocks: z.array(z.string()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

// ============================================================================
// InboxMessageSchema
// ============================================================================

/**
 * Zod schema for validating an inbox message.
 *
 * Required: from, text, timestamp, read
 * Uses passthrough() for forward compatibility with unknown fields.
 */
export const InboxMessageSchema = z
  .object({
    from: z.string().min(1, 'Sender is required'),
    text: z.string().min(1, 'Message text is required'),
    timestamp: z.string().min(1, 'Timestamp is required'),
    read: z.boolean(),
  })
  .passthrough();

// ============================================================================
// Team Config Validation
// ============================================================================

/**
 * Validate a team configuration object.
 *
 * Runs Zod schema validation and returns a structured result with
 * valid/invalid status, error messages, warnings, and parsed data.
 *
 * @param data - Raw team configuration data to validate
 * @returns Structured validation result
 */
export function validateTeamConfig(data: unknown): TeamValidationResult {
  const result = TeamConfigSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return { valid: false, errors, warnings: [] };
  }

  // Semantic validation (VALID-01)
  const config = result.data as TeamConfig;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check leadAgentId matches a member's agentId
  const leadExists = config.members.some((m) => m.agentId === config.leadAgentId);
  if (!leadExists) {
    errors.push(
      `leadAgentId "${config.leadAgentId}" does not match any member's agentId`
    );
  }

  // Check for duplicate agentIds
  const agentIds = config.members.map((m) => m.agentId);
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of agentIds) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  if (duplicates.size > 0) {
    errors.push(`Duplicate member agentIds: ${[...duplicates].join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: config,
  };
}

// ============================================================================
// Topology Rule Validation (VALID-07)
// ============================================================================

/**
 * Validate topology-specific rules for a team configuration.
 *
 * Enforces structural constraints based on the topology field:
 * - leader-worker: exactly 1 leader (coordinator or orchestrator)
 * - pipeline: exactly 1 orchestrator
 * - swarm: exactly 1 coordinator
 * - custom: no rules enforced
 * - absent/unknown: graceful skip (no errors, no warnings)
 *
 * @param config - Parsed team configuration
 * @returns Object with errors and warnings arrays
 */
export function validateTopologyRules(config: TeamConfig): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const topology = (config as Record<string, unknown>).topology as string | undefined;

  if (topology === undefined) {
    return { errors, warnings };
  }

  switch (topology) {
    case 'leader-worker': {
      const leaderCount = config.members.filter(
        (m) => m.agentType === 'coordinator' || m.agentType === 'orchestrator'
      ).length;
      if (leaderCount !== 1) {
        errors.push(
          `Leader-worker topology requires exactly 1 leader, found ${leaderCount}`
        );
      }
      break;
    }
    case 'pipeline': {
      const orchestratorCount = config.members.filter(
        (m) => m.agentType === 'orchestrator'
      ).length;
      if (orchestratorCount !== 1) {
        errors.push(
          `Pipeline topology requires exactly 1 orchestrator, found ${orchestratorCount}`
        );
      }
      break;
    }
    case 'swarm': {
      const coordinatorCount = config.members.filter(
        (m) => m.agentType === 'coordinator'
      ).length;
      if (coordinatorCount !== 1) {
        errors.push(
          `Swarm topology requires exactly 1 coordinator, found ${coordinatorCount}`
        );
      }
      break;
    }
    case 'custom':
    default:
      // No rules to enforce for custom or unknown topologies
      break;
  }

  return { errors, warnings };
}
