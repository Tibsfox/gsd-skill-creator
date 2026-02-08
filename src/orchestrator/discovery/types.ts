/**
 * Type definitions for GSD discovery module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - GSD command metadata (extracted from command .md files)
 * - GSD agent metadata (extracted from agent .md files)
 * - GSD team metadata (extracted from team .md files)
 * - Discovery result (aggregate of all discovered artifacts)
 *
 * All schemas use .passthrough() for forward compatibility with
 * new frontmatter fields added in future GSD versions.
 */

import { z } from 'zod';

// ============================================================================
// Command Metadata
// ============================================================================

/**
 * Zod schema for GSD command metadata extracted from command .md files.
 *
 * Fields map to command frontmatter:
 * - name: Command name (e.g., "gsd:plan-phase")
 * - description: Human-readable description
 * - argumentHint: Usage hint (e.g., "[phase] [--research]")
 * - allowedTools: Tools the command agent can use
 * - agent: Agent name to route to (e.g., "gsd-planner")
 * - objective: Content from first <objective> tag in body
 * - filePath: Absolute path to source .md file
 */
export const GsdCommandMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  argumentHint: z.string().optional(),
  allowedTools: z.array(z.string()).optional(),
  agent: z.string().optional(),
  objective: z.string(),
  filePath: z.string(),
}).passthrough();

export type GsdCommandMetadata = z.infer<typeof GsdCommandMetadataSchema>;

// ============================================================================
// Agent Metadata
// ============================================================================

/**
 * Zod schema for GSD agent metadata extracted from agent .md files.
 *
 * Fields map to agent frontmatter:
 * - name: Agent name (e.g., "gsd-executor")
 * - description: Human-readable description
 * - tools: Comma-separated tool list (e.g., "Read, Write, Bash")
 * - model: Model hint (e.g., "sonnet", "opus", "haiku", "inherit")
 * - color: Terminal color for output
 * - filePath: Absolute path to source .md file
 */
export const GsdAgentMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tools: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  filePath: z.string(),
}).passthrough();

export type GsdAgentMetadata = z.infer<typeof GsdAgentMetadataSchema>;

// ============================================================================
// Team Metadata
// ============================================================================

/**
 * Zod schema for GSD team metadata extracted from team .md files.
 *
 * Fields map to team frontmatter:
 * - name: Team name
 * - description: Human-readable description
 * - topology: Team topology (e.g., "leader-worker", "pipeline", "swarm")
 * - memberCount: Number of team members
 * - leadAgentId: ID of the lead agent
 * - filePath: Absolute path to source .md file
 */
export const GsdTeamMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  topology: z.string().optional(),
  memberCount: z.number(),
  leadAgentId: z.string().optional(),
  filePath: z.string(),
}).passthrough();

export type GsdTeamMetadata = z.infer<typeof GsdTeamMetadataSchema>;

// ============================================================================
// Discovery Result
// ============================================================================

/**
 * Zod schema for the complete discovery result.
 *
 * Aggregates all discovered commands, agents, and teams with metadata
 * about the discovery location and timing.
 */
export const DiscoveryResultSchema = z.object({
  commands: z.array(GsdCommandMetadataSchema),
  agents: z.array(GsdAgentMetadataSchema),
  teams: z.array(GsdTeamMetadataSchema),
  location: z.enum(['global', 'local']),
  basePath: z.string(),
  version: z.string().optional(),
  discoveredAt: z.number(),
});

export type DiscoveryResult = z.infer<typeof DiscoveryResultSchema>;

// ============================================================================
// Utility Types
// ============================================================================

/** GSD installation location type */
export type GsdLocation = 'global' | 'local';

/** Warning from discovery (malformed files, missing dirs, etc.) */
export interface DiscoveryWarning {
  type: 'parse-error' | 'missing-dir' | 'missing-file';
  path: string;
  message: string;
}
