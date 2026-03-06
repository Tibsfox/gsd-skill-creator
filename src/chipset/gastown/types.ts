/**
 * Gastown orchestration chipset type system.
 *
 * Defines all shared TypeScript interfaces and type aliases for the
 * Gastown multi-agent orchestration chipset. These types model:
 * - Agent identity and lifecycle (AgentIdentity, AgentRole, AgentStatus)
 * - Work items and dispatch (WorkItem, WorkStatus, HookStatus)
 * - Inter-agent communication (AgentMessage, MessageChannel)
 * - Chipset configuration (ChipsetConfig and sub-interfaces)
 * - Runtime state (HookState, Convoy, MergeRequest)
 *
 * All downstream waves (1-4) import from this foundation module.
 */

// ============================================================================
// Agent Role & Status
// ============================================================================

/**
 * Agent roles in the Gastown topology.
 *
 * - `mayor`: Orchestrator — owns the convoy, dispatches work, supervises agents
 * - `witness`: Observer — monitors agent health, validates outputs
 * - `refinery`: Merge gatekeeper — processes merge requests sequentially
 * - `polecat`: Worker — executes individual work items (parallelizable)
 * - `crew`: General-purpose agent — fills gaps in the topology
 */
export type AgentRole = 'mayor' | 'witness' | 'refinery' | 'polecat' | 'crew';

/**
 * Agent lifecycle status.
 *
 * - `idle`: Agent exists but has no assigned work
 * - `active`: Agent is executing a work item
 * - `stalled`: Agent has not reported activity within the expected window
 * - `terminated`: Agent session has ended (graceful or forced)
 */
export type AgentStatus = 'idle' | 'active' | 'stalled' | 'terminated';

// ============================================================================
// Work Item Types
// ============================================================================

/**
 * Work item lifecycle status.
 *
 * - `open`: Work item created, not yet assigned
 * - `hooked`: Assigned to an agent via hook, awaiting pickup
 * - `in_progress`: Agent is actively working on it
 * - `done`: Work completed, awaiting merge
 * - `merged`: Work merged into target branch
 */
export type WorkStatus = 'open' | 'hooked' | 'in_progress' | 'done' | 'merged';

/**
 * Hook lifecycle status for GUPP enforcement.
 *
 * - `empty`: No hook assigned
 * - `pending`: Hook created, agent not yet active
 * - `active`: Agent is working under this hook
 * - `completed`: Hook work finished
 */
export type HookStatus = 'empty' | 'pending' | 'active' | 'completed';

// ============================================================================
// Agent Identity
// ============================================================================

/**
 * Agent identity bead — the durable record of an agent in the topology.
 *
 * Persisted as JSON in `state/agents/{role}-{id}.json`.
 * The `sessionId` is ephemeral and only present while the agent is active.
 */
export interface AgentIdentity {
  /** Unique agent identifier (e.g., 'polecat-alpha'). */
  id: string;

  /** Role in the Gastown topology. */
  role: AgentRole;

  /** Parent rig name this agent belongs to. */
  rig: string;

  /** Pointer to this agent's hook bead in state/hooks/. */
  hookId: string;

  /** Current lifecycle status. */
  status: AgentStatus;

  /** Current session identifier (ephemeral, present only while active). */
  sessionId?: string;
}

// ============================================================================
// Work Item
// ============================================================================

/**
 * A unit of work tracked through the dispatch pipeline.
 *
 * Work items are created by the mayor, assigned via hooks to polecats,
 * and flow through the lifecycle: open -> hooked -> in_progress -> done -> merged.
 */
export interface WorkItem {
  /** Bead-style identifier (e.g., 'bead-a1b2c'). */
  beadId: string;

  /** Short title for display and logging. */
  title: string;

  /** Detailed description of the work to perform. */
  description: string;

  /** Current lifecycle status. */
  status: WorkStatus;

  /** Agent ID of the assigned worker (undefined if unassigned). */
  assignee?: string;

  /** GUPP hook status for this work item. */
  hookStatus: HookStatus;

  /** Dispatch priority. */
  priority: 'P1' | 'P2' | 'P3';
}

// ============================================================================
// Agent Communication
// ============================================================================

/**
 * Communication channel types for inter-agent messaging.
 *
 * - `mail`: Durable async messages persisted to filesystem
 * - `nudge`: Lightweight sync pings (non-durable)
 * - `hook`: Hook state change notifications
 * - `handoff`: Work item ownership transfer
 */
export type MessageChannel = 'mail' | 'nudge' | 'hook' | 'handoff';

/**
 * A message sent between agents.
 *
 * Messages are the primary inter-agent communication primitive.
 * Durable messages are persisted to `state/mail/{to}/{timestamp}-{from}.json`.
 */
export interface AgentMessage {
  /** Sender agent ID. */
  from: string;

  /** Recipient agent ID or broadcast address. */
  to: string;

  /** Communication channel. */
  channel: MessageChannel;

  /** Message content (free-form string, interpretation depends on channel). */
  payload: string;

  /** ISO 8601 timestamp of when the message was created. */
  timestamp: string;

  /** Whether this message persists in the filesystem. */
  durable: boolean;
}

// ============================================================================
// Chipset Configuration Sub-Interfaces
// ============================================================================

/**
 * Skill entry in the chipset manifest.
 */
export interface SkillEntry {
  /** Skill name (kebab-case). */
  name: string;

  /** Domain this skill belongs to. */
  domain: string;

  /** Human-readable description. */
  description: string;

  /** Relative token budget weight (0.0 - 1.0). */
  token_budget_weight: number;
}

/**
 * Skill manifest declaring required and recommended skills.
 */
export interface SkillManifest {
  /** Skills that must be loaded for the chipset to function. */
  required: SkillEntry[];

  /** Skills that enhance but are not essential. */
  recommended: SkillEntry[];
}

/**
 * Agent entry in the topology declaration.
 */
export interface AgentEntry {
  /** Agent name. */
  name: string;

  /** Agent role in the topology. */
  role: AgentRole;

  /** Skills this agent uses. */
  skills: string[];

  /** Number of instances to spawn (default 1). */
  count?: number;
}

/**
 * Agent topology configuration.
 */
export interface AgentTopology {
  /** Topology pattern name (e.g., 'mayor-witness-polecat'). */
  topology: string;

  /** Agent definitions. */
  agents: AgentEntry[];
}

/**
 * Channel entry in the communication configuration.
 */
export interface ChannelEntry {
  /** Channel name. */
  name: string;

  /** Channel type (maps to MessageChannel). */
  type: MessageChannel;

  /** Filesystem path for this channel's state. */
  filesystem_path: string;

  /** Channel behavior description. */
  behavior: string;
}

/**
 * Communication configuration for inter-agent messaging.
 */
export interface CommunicationConfig {
  /** Available communication channels. */
  channels: ChannelEntry[];
}

/**
 * Dispatch configuration for work item assignment.
 */
export interface DispatchConfig {
  /** Dispatch strategy (e.g., 'sling', 'round-robin'). */
  strategy: string;

  /** Maximum parallel work items. */
  max_parallel: number;

  /** Minimum batch size before dispatching. */
  batch_threshold: number;

  /** Whether formula-based dispatch is supported. */
  formula_support: boolean;
}

/**
 * A single evaluation gate check.
 */
export interface GateCheck {
  /** Check identifier. */
  check: string;

  /** Pass/fail threshold. */
  threshold: number;

  /** Action on failure ('block' | 'warn' | 'log'). */
  action: 'block' | 'warn' | 'log';
}

/**
 * Evaluation gates for pre-deploy quality checks.
 */
export interface EvaluationGates {
  /** Pre-deploy gate checks. */
  pre_deploy: GateCheck[];
}

// ============================================================================
// Chipset Configuration
// ============================================================================

/**
 * Top-level chipset configuration.
 *
 * Declares the complete Gastown orchestration chipset: its identity,
 * skills, agent topology, communication channels, dispatch strategy,
 * and evaluation gates.
 */
export interface ChipsetConfig {
  /** Chipset name (e.g., 'gastown-orchestration'). */
  name: string;

  /** Semantic version. */
  version: string;

  /** Chipset archetype (e.g., 'multi-agent-orchestration'). */
  archetype: string;

  /** Skill manifest (required + recommended). */
  skills: SkillManifest;

  /** Agent topology configuration. */
  agents: AgentTopology;

  /** Communication channel configuration. */
  communication: CommunicationConfig;

  /** Work dispatch configuration. */
  dispatch: DispatchConfig;

  /** Quality evaluation gates. */
  evaluation: EvaluationGates;
}

// ============================================================================
// Runtime State Types
// ============================================================================

/**
 * Hook state for a single agent — tracks GUPP enforcement.
 *
 * Persisted to `state/hooks/{agentId}.json`.
 */
export interface HookState {
  /** Agent this hook belongs to. */
  agentId: string;

  /** Current hook status. */
  status: HookStatus;

  /** Work item currently under this hook (undefined if hook is empty). */
  workItem?: WorkItem;

  /** ISO 8601 timestamp of last activity on this hook. */
  lastActivity: string;
}

/**
 * A convoy groups related work items for batch tracking.
 *
 * The mayor creates convoys to organize related beads and track
 * aggregate progress.
 */
export interface Convoy {
  /** Unique convoy identifier. */
  id: string;

  /** Human-readable convoy name. */
  name: string;

  /** Bead IDs belonging to this convoy. */
  beadIds: string[];

  /** Completion progress (0.0 - 1.0). */
  progress: number;

  /** ISO 8601 timestamp of convoy creation. */
  createdAt: string;
}

/**
 * A merge request queued for the refinery.
 *
 * The refinery processes merge requests strictly sequentially.
 * Conflicts block the queue and escalate.
 */
export interface MergeRequest {
  /** Unique merge request identifier. */
  id: string;

  /** Source branch name. */
  sourceBranch: string;

  /** Target branch name. */
  targetBranch: string;

  /** Merge request status. */
  status: 'pending' | 'merging' | 'merged' | 'conflicted';

  /** Associated work item bead ID. */
  beadId: string;
}
