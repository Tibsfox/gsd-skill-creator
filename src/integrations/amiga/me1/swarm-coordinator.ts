/**
 * ME-1 swarm coordinator.
 *
 * Receives COMMAND_DISPATCH events from MC-1 via ICD-01, distributes them
 * to registered agent teams, and manages resource locking with conflict
 * queuing. The coordinator is ME-1's operational brain -- it translates
 * high-level mission commands into team-level actions and prevents resource
 * conflicts between concurrently operating teams.
 *
 * Supported commands (all 8 ICD-01 mission commands):
 * - LAUNCH: activate all teams
 * - STATUS: gather consolidated status, emit TELEMETRY_UPDATE
 * - HOLD: suspend all teams, acquire global lock
 * - RESUME: reactivate suspended teams, release global lock
 * - ABORT: terminate all teams, release all locks
 * - REDIRECT: target a specific team with new parameters
 * - REVIEW: trigger a gate review signal
 * - DEBRIEF: signal mission completion to all teams
 */

import { CommandDispatchPayloadSchema } from '../icd/icd-01.js';
import type { CommandDispatchPayload } from '../icd/icd-01.js';
import type { TelemetryEmitter } from './telemetry-emitter.js';
import type { EventEnvelope } from '../message-envelope.js';

// ============================================================================
// Types
// ============================================================================

/** Registration entry for an agent team. */
export interface TeamRegistration {
  /** Team identifier (e.g., 'CS', 'ME', 'CE'). */
  team_id: string;
  /** Agent IDs belonging to this team. */
  agent_ids: string[];
  /** Team status: active, suspended, terminated. */
  status: 'active' | 'suspended' | 'terminated';
  /** Callback invoked when a command is dispatched to this team. */
  onCommand?: (command: string, params?: Record<string, unknown>) => void;
}

/** A resource lock held by a team. */
export interface ResourceLock {
  /** Unique lock identifier. */
  lock_id: string;
  /** Resource being locked. */
  resource: string;
  /** Team holding the lock. */
  holder: string;
  /** When the lock was acquired. */
  acquired_at: string;
  /** Lock timeout in milliseconds (null = no timeout). */
  timeout_ms: number | null;
  /** Timer handle for auto-release (internal). */
  _timer?: ReturnType<typeof setTimeout>;
}

/** Result of a command dispatch. */
export type CommandResult =
  | { success: true; command: string; dispatched_to: string[] }
  | { success: false; command: string; error: string };

/** Configuration for creating a SwarmCoordinator. */
export interface SwarmCoordinatorConfig {
  /** Telemetry emitter for status reporting. */
  emitter: TelemetryEmitter;
  /** Initial team registrations. */
  teams: TeamRegistration[];
  /** Default lock timeout in ms (default: 30000). */
  default_lock_timeout_ms?: number;
}

// ============================================================================
// Lock queue entry (internal)
// ============================================================================

interface LockQueueEntry {
  team: string;
  timeout_ms: number | null;
}

// ============================================================================
// SwarmCoordinator
// ============================================================================

/**
 * Distributes MC-1 commands to agent teams and manages resource locking
 * with conflict queuing.
 */
export class SwarmCoordinator {
  private readonly emitter: TelemetryEmitter;
  private readonly teams: Map<string, TeamRegistration>;
  private readonly locks: Map<string, ResourceLock>;
  private readonly lockQueues: Map<string, LockQueueEntry[]>;
  private readonly defaultTimeoutMs: number;
  private held: boolean;
  private terminated: boolean;

  constructor(config: SwarmCoordinatorConfig) {
    this.emitter = config.emitter;
    this.teams = new Map(config.teams.map(t => [t.team_id, { ...t }]));
    this.locks = new Map();
    this.lockQueues = new Map();
    this.defaultTimeoutMs = config.default_lock_timeout_ms ?? 30_000;
    this.held = false;
    this.terminated = false;
  }

  // --------------------------------------------------------------------------
  // Public API: queries
  // --------------------------------------------------------------------------

  /** Get all registered teams. */
  getRegisteredTeams(): TeamRegistration[] {
    return [...this.teams.values()];
  }

  /** Get all active locks. */
  getActiveLocks(): ResourceLock[] {
    return [...this.locks.values()];
  }

  /** Get the lock queue for a resource. */
  getLockQueue(resource: string): Array<{ team: string; position: number }> {
    const queue = this.lockQueues.get(resource) ?? [];
    return queue.map((entry, idx) => ({ team: entry.team, position: idx + 1 }));
  }

  /** Check if the coordinator is in HOLD state. */
  isHeld(): boolean {
    return this.held;
  }

  // --------------------------------------------------------------------------
  // Public API: dispatch
  // --------------------------------------------------------------------------

  /**
   * Dispatch a COMMAND_DISPATCH event to the appropriate teams.
   *
   * Validates the command envelope against ICD-01 CommandDispatchPayloadSchema.
   * Routes to a specific team or broadcasts to all teams based on target_agent.
   */
  dispatch(envelope: EventEnvelope): CommandResult {
    // Validate payload against ICD-01 schema
    const parseResult = CommandDispatchPayloadSchema.safeParse(envelope.payload);
    if (!parseResult.success) {
      return {
        success: false,
        command: (envelope.payload as Record<string, unknown>).command as string ?? 'UNKNOWN',
        error: `Invalid command payload: ${parseResult.error.message}`,
      };
    }

    const payload: CommandDispatchPayload = parseResult.data;
    const { command, target_agent, parameters } = payload;

    // Check if terminated
    if (this.terminated) {
      return {
        success: false,
        command,
        error: 'Coordinator is terminated. No further commands accepted.',
      };
    }

    switch (command) {
      case 'LAUNCH':
        return this.handleLaunch(command);
      case 'STATUS':
        return this.handleStatus(command);
      case 'HOLD':
        return this.handleHold(command);
      case 'RESUME':
        return this.handleResume(command);
      case 'ABORT':
        return this.handleAbort(command);
      case 'REDIRECT':
        return this.handleRedirect(command, target_agent, parameters);
      case 'REVIEW':
        return this.handleReview(command);
      case 'DEBRIEF':
        return this.handleDebrief(command);
      default:
        return { success: false, command, error: `Unknown command: ${command}` };
    }
  }

  // --------------------------------------------------------------------------
  // Public API: resource locking
  // --------------------------------------------------------------------------

  /**
   * Acquire a resource lock for a team.
   *
   * If the resource is already locked by a different team, the request
   * is queued for automatic granting when the current holder releases.
   */
  acquireLock(
    resource: string,
    team: string,
    options?: { timeout_ms?: number },
  ): { granted: boolean; lock_id?: string; queued?: boolean; position?: number } {
    const existingLock = this.locks.get(resource);

    // Resource not locked -- grant immediately
    if (!existingLock) {
      const lock = this.createLock(resource, team, options?.timeout_ms ?? null);
      return { granted: true, lock_id: lock.lock_id };
    }

    // Same team already holds it -- idempotent
    if (existingLock.holder === team) {
      return { granted: true, lock_id: existingLock.lock_id };
    }

    // Different team -- queue
    if (!this.lockQueues.has(resource)) {
      this.lockQueues.set(resource, []);
    }
    const queue = this.lockQueues.get(resource)!;
    queue.push({ team, timeout_ms: options?.timeout_ms ?? null });
    return { granted: false, queued: true, position: queue.length };
  }

  /**
   * Release a resource lock.
   *
   * If there are queued requests for the resource, the next one is
   * automatically granted.
   */
  releaseLock(
    resource: string,
    team: string,
  ): { released: boolean; error?: string; next_holder?: string } {
    const lock = this.locks.get(resource);

    if (!lock) {
      return { released: false, error: 'Resource not locked' };
    }

    if (lock.holder !== team) {
      return { released: false, error: 'Resource locked by different team' };
    }

    // Clear timeout timer if any
    if (lock._timer) {
      clearTimeout(lock._timer);
    }

    // Remove the lock
    this.locks.delete(resource);

    // Grant to next in queue
    const queue = this.lockQueues.get(resource);
    if (queue && queue.length > 0) {
      const next = queue.shift()!;
      if (queue.length === 0) {
        this.lockQueues.delete(resource);
      }
      const newLock = this.createLock(resource, next.team, next.timeout_ms);
      return { released: true, next_holder: next.team };
    }

    return { released: true };
  }

  // --------------------------------------------------------------------------
  // Command handlers
  // --------------------------------------------------------------------------

  private handleLaunch(command: string): CommandResult {
    const dispatched: string[] = [];
    for (const [id, team] of this.teams) {
      team.status = 'active';
      if (team.onCommand) {
        team.onCommand('LAUNCH');
      }
      dispatched.push(id);
    }
    return { success: true, command, dispatched_to: dispatched };
  }

  private handleStatus(command: string): CommandResult {
    const dispatched: string[] = [];
    const teamStatus: Record<string, { status: 'green' | 'amber' | 'red'; agent_count: number }> = {};

    for (const [id, team] of this.teams) {
      const statusColor = team.status === 'active' ? 'green'
        : team.status === 'suspended' ? 'amber'
        : 'red';
      teamStatus[id] = { status: statusColor, agent_count: team.agent_ids.length };
      dispatched.push(id);
    }

    this.emitter.emitTelemetry({
      phase: 'EXECUTION',
      progress: 50,
      team_status: teamStatus,
      checkpoints: [],
      resources: { cpu_percent: 0, memory_mb: 0, active_agents: this.countActiveAgents() },
    });

    return { success: true, command, dispatched_to: dispatched };
  }

  private handleHold(command: string): CommandResult {
    if (this.held) {
      return { success: false, command, error: 'Coordinator is already held' };
    }

    const dispatched: string[] = [];
    for (const [id, team] of this.teams) {
      if (team.status === 'active') {
        team.status = 'suspended';
        if (team.onCommand) {
          team.onCommand('HOLD');
        }
      }
      dispatched.push(id);
    }

    // Acquire global lock
    this.createLock('global', 'COORDINATOR', null);
    this.held = true;

    return { success: true, command, dispatched_to: dispatched };
  }

  private handleResume(command: string): CommandResult {
    if (!this.held) {
      return { success: false, command, error: 'Coordinator is not held' };
    }

    const dispatched: string[] = [];
    for (const [id, team] of this.teams) {
      if (team.status === 'suspended') {
        team.status = 'active';
        if (team.onCommand) {
          team.onCommand('RESUME');
        }
      }
      dispatched.push(id);
    }

    // Release global lock
    this.locks.delete('global');
    this.held = false;

    return { success: true, command, dispatched_to: dispatched };
  }

  private handleAbort(command: string): CommandResult {
    const dispatched: string[] = [];
    for (const [id, team] of this.teams) {
      team.status = 'terminated';
      if (team.onCommand) {
        team.onCommand('ABORT');
      }
      dispatched.push(id);
    }

    // Release all locks and clear all queues
    for (const lock of this.locks.values()) {
      if (lock._timer) {
        clearTimeout(lock._timer);
      }
    }
    this.locks.clear();
    this.lockQueues.clear();
    this.terminated = true;

    return { success: true, command, dispatched_to: dispatched };
  }

  private handleRedirect(
    command: string,
    targetAgent: string,
    parameters?: Record<string, unknown>,
  ): CommandResult {
    // Extract team prefix from AgentID (e.g., 'ME-1' -> 'ME', 'OPS-2' -> 'OPS')
    const teamPrefix = targetAgent.replace(/-\d+(\.[a-z])?$/, '');
    const team = this.teams.get(teamPrefix);
    if (!team) {
      return { success: false, command, error: `Team not found for agent: ${targetAgent}` };
    }

    if (team.onCommand) {
      team.onCommand('REDIRECT', parameters);
    }

    return { success: true, command, dispatched_to: [teamPrefix] };
  }

  private handleReview(command: string): CommandResult {
    const dispatched: string[] = [];
    for (const id of this.teams.keys()) {
      dispatched.push(id);
    }

    this.emitter.emitGateSignal({
      gate_type: 'human_review',
      blocking_phase: 'REVIEW_GATE',
      criteria: [{ name: 'Command review requested', met: false }],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
    });

    return { success: true, command, dispatched_to: dispatched };
  }

  private handleDebrief(command: string): CommandResult {
    const dispatched: string[] = [];
    for (const [id, team] of this.teams) {
      if (team.onCommand) {
        team.onCommand('DEBRIEF');
      }
      dispatched.push(id);
    }
    return { success: true, command, dispatched_to: dispatched };
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /** Create a ResourceLock and store it, optionally with a timeout timer. */
  private createLock(
    resource: string,
    holder: string,
    timeout_ms: number | null,
  ): ResourceLock {
    const lock: ResourceLock = {
      lock_id: `lock-${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      resource,
      holder,
      acquired_at: new Date().toISOString(),
      timeout_ms,
    };

    if (timeout_ms !== null && timeout_ms > 0) {
      lock._timer = setTimeout(() => {
        this.releaseLock(resource, holder);
      }, timeout_ms);
    }

    this.locks.set(resource, lock);
    return lock;
  }

  /** Count total active agents across all teams. */
  private countActiveAgents(): number {
    let count = 0;
    for (const team of this.teams.values()) {
      if (team.status === 'active') {
        count += team.agent_ids.length;
      }
    }
    return count;
  }
}
