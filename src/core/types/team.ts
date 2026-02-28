/**
 * Claude Code agent team type definitions.
 *
 * Team configuration format supports leader-worker, pipeline, swarm,
 * and custom topologies for multi-agent coordination.
 * See: https://code.claude.com/docs/en/agent-teams
 */

// ============================================================================
// Team Topologies
// ============================================================================

/**
 * Valid team topology patterns.
 *
 * - leader-worker: One leader delegates to workers
 * - pipeline: Sequential processing chain
 * - swarm: Peer-to-peer collaboration
 * - router: One router classifies and directs to specialists
 * - map-reduce: Orchestrator splits work to parallel workers and consolidates
 * - custom: User-defined topology
 */
export const TEAM_TOPOLOGIES = [
  'leader-worker',
  'pipeline',
  'swarm',
  'router',
  'map-reduce',
  'custom',
] as const;

/** Type for team topology */
export type TeamTopology = (typeof TEAM_TOPOLOGIES)[number];

// ============================================================================
// Team Roles
// ============================================================================

/**
 * Valid roles a team member can fulfill.
 *
 * - leader: Coordinates team, delegates tasks
 * - worker: Executes assigned tasks
 * - reviewer: Reviews and validates output
 * - orchestrator: Manages workflow and routing
 * - specialist: Domain-specific expert
 * - router: Classifies and directs work to specialists
 * - reducer: Consolidates results from parallel workers
 */
export const TEAM_ROLES = [
  'leader',
  'worker',
  'reviewer',
  'orchestrator',
  'specialist',
  'router',
  'reducer',
] as const;

/** Type for team role */
export type TeamRole = (typeof TEAM_ROLES)[number];

// ============================================================================
// Inter-Team Links
// ============================================================================

/**
 * Declaration for inter-team output/input connections.
 *
 * Used by team members to declare outputTo/inputFrom relationships
 * with other teams for cross-team coordination.
 */
export interface InterTeamLink {
  teamName: string;
  description?: string;
}

// ============================================================================
// Backend Types
// ============================================================================

/**
 * Valid backend types for team member processes.
 *
 * - in-process: Runs in the same process
 * - tmux: Runs in a tmux session
 * - iterm2: Runs in an iTerm2 tab
 */
export const BACKEND_TYPES = ['in-process', 'tmux', 'iterm2'] as const;

/** Type for backend type */
export type BackendType = (typeof BACKEND_TYPES)[number];

// ============================================================================
// Team Member Models
// ============================================================================

/**
 * Valid model aliases for team members.
 *
 * - haiku: Claude Haiku (fastest)
 * - sonnet: Claude Sonnet (balanced)
 * - opus: Claude Opus (highest capability)
 */
export const TEAM_MEMBER_MODELS = ['haiku', 'sonnet', 'opus'] as const;

/** Type for team member model alias */
export type TeamMemberModel = (typeof TEAM_MEMBER_MODELS)[number];

// ============================================================================
// Team Member Interface
// ============================================================================

/**
 * A member of an agent team.
 *
 * Each member has a unique agent ID within the team and optional
 * configuration for backend, model, and working directory.
 */
export interface TeamMember {
  /** Unique agent identifier within the team. */
  agentId: string;

  /** Display name for the team member. */
  name: string;

  /** Agent classification (e.g., 'coder', 'reviewer'). */
  agentType?: string;

  /** Hex color for UI identification (e.g., '#FF5733'). */
  color?: string;

  /** ISO timestamp when the member joined the team. */
  joinedAt?: string;

  /** Process backend for this member. */
  backendType?: BackendType;

  /** Model alias for this member. */
  model?: TeamMemberModel;

  /** Working directory for this member. */
  cwd?: string;

  /** Initial prompt or instructions for this member. */
  prompt?: string;

  /** Whether plan mode is required for this member. */
  planModeRequired?: boolean;

  /** Allow unknown fields for forward compatibility. */
  [key: string]: unknown;
}

// ============================================================================
// Team Config Interface
// ============================================================================

/**
 * Top-level team configuration.
 *
 * Defines the team name, lead agent, and member list.
 * This is the root object serialized to/from team config files.
 */
export interface TeamConfig {
  /** Team identifier. */
  name: string;

  /** Human-readable description of the team's purpose. */
  description?: string;

  /** Agent ID of the team lead (must match a member's agentId). */
  leadAgentId: string;

  /** ISO timestamp when the team was created. */
  createdAt: string;

  /** Team members (at least one required). */
  members: TeamMember[];

  /** Allow unknown fields for forward compatibility. */
  [key: string]: unknown;
}

// ============================================================================
// Team Task Statuses
// ============================================================================

/**
 * Valid statuses for team tasks.
 *
 * - pending: Not yet started
 * - in_progress: Currently being worked on
 * - completed: Finished successfully
 */
export const TEAM_TASK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
] as const;

/** Type for team task status */
export type TeamTaskStatus = (typeof TEAM_TASK_STATUSES)[number];

// ============================================================================
// Team Task Interface
// ============================================================================

/**
 * A task within a team's work queue.
 *
 * Tasks can be assigned to members, have dependencies via
 * blockedBy/blocks, and track status through their lifecycle.
 */
export interface TeamTask {
  /** Unique task identifier. */
  id: string;

  /** Brief imperative title (e.g., 'Implement auth middleware'). */
  subject: string;

  /** Detailed description of the task. */
  description?: string;

  /** Current task status. */
  status: TeamTaskStatus;

  /** Agent ID of the assigned owner. */
  owner?: string;

  /** Present continuous form for spinner display (e.g., 'Implementing auth'). */
  activeForm?: string;

  /** Task IDs that must complete before this task can start. */
  blockedBy?: string[];

  /** Task IDs that depend on this task completing. */
  blocks?: string[];

  /** ISO timestamp when the task was created. */
  createdAt?: string;

  /** ISO timestamp when the task was last updated. */
  updatedAt?: string;

  /** Allow unknown fields for forward compatibility. */
  [key: string]: unknown;
}

// ============================================================================
// Structured Message Types
// ============================================================================

/**
 * Known structured message types for inter-agent communication.
 *
 * The union with `string` allows forward compatibility with
 * unknown structured message types from future versions.
 */
export const STRUCTURED_MESSAGE_TYPES = [
  'shutdown_request',
  'shutdown_response',
  'task_completed',
  'plan_approval_request',
  'plan_approval_response',
  'join_request',
] as const;

/** Type for structured message type (extensible via string union). */
export type StructuredMessageType =
  | (typeof STRUCTURED_MESSAGE_TYPES)[number]
  | string;

// ============================================================================
// Inbox Message Interface
// ============================================================================

/**
 * A message in an agent's inbox.
 *
 * Used for inter-agent communication within a team.
 * Messages are delivered to the recipient's inbox and marked read when processed.
 */
export interface InboxMessage {
  /** Sender identifier (agent ID or system). */
  from: string;

  /** Message content. */
  text: string;

  /** ISO timestamp when the message was sent. */
  timestamp: string;

  /** Whether the message has been read by the recipient. */
  read: boolean;

  /** Allow unknown fields for forward compatibility. */
  [key: string]: unknown;
}

// ============================================================================
// Team Validation Result
// ============================================================================

/**
 * Result of validating a team configuration.
 *
 * Follows the same pattern as AgentValidationResult from agent.ts.
 */
export interface TeamValidationResult {
  /** Whether the team configuration is valid. */
  valid: boolean;

  /** Error messages from validation. */
  errors: string[];

  /** Warning messages (non-blocking). */
  warnings: string[];

  /** Parsed and validated team config (if valid). */
  data?: TeamConfig;
}
