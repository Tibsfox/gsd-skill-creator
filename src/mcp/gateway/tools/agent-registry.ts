/**
 * In-memory agent registry for the GSD-OS MCP gateway.
 *
 * Tracks spawned agents, their lifecycle state, token usage, and log entries.
 * The registry provides query methods for the agent:status and agent:logs
 * gateway tools.
 *
 * Thread safety: Node.js is single-threaded, so Map operations are atomic
 * within a tick. No additional synchronization is needed.
 *
 * @module mcp/gateway/tools/agent-registry
 */

import { randomUUID } from 'node:crypto';
import {
  DEFAULT_MAX_LOGS,
  type AgentLogEntry,
  type AgentRecord,
  type AgentRole,
  type AgentState,
  type LogLevel,
  type TokenUsage,
} from './agent-types.js';

// ── Spawn Options ───────────────────────────────────────────────────────────

/** Options for spawning a new agent. */
export interface SpawnOptions {
  /** Agent role. */
  role: AgentRole;
  /** Skills to load. */
  skills: string[];
  /** Optional team assignment. */
  team?: string;
}

// ── Agent Registry ──────────────────────────────────────────────────────────

/**
 * In-memory registry for gateway-managed agents.
 *
 * Stores AgentRecord instances and their log ring buffers. Provides
 * spawn, query, update, and log methods consumed by the agent:* tools.
 */
export class AgentRegistry {
  private readonly agents = new Map<string, AgentRecord>();
  private readonly logs = new Map<string, AgentLogEntry[]>();
  private readonly maxLogs: number;

  constructor(maxLogs: number = DEFAULT_MAX_LOGS) {
    this.maxLogs = maxLogs;
  }

  /**
   * Spawn a new agent and register it.
   *
   * @returns The created AgentRecord
   */
  spawn(options: SpawnOptions): AgentRecord {
    const now = Date.now();
    const record: AgentRecord = {
      id: randomUUID(),
      role: options.role,
      skills: [...options.skills],
      team: options.team,
      state: 'running',
      currentTask: null,
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      lastActivity: now,
      createdAt: now,
    };

    this.agents.set(record.id, record);
    this.logs.set(record.id, []);

    // Log the spawn event
    this.addLog(record.id, 'info', `Agent spawned with role "${options.role}"`, {
      skills: options.skills,
      team: options.team,
    });

    return record;
  }

  /**
   * Get the current record for an agent.
   *
   * @returns The AgentRecord, or null if not found
   */
  getStatus(agentId: string): AgentRecord | null {
    return this.agents.get(agentId) ?? null;
  }

  /**
   * Get recent log entries for an agent.
   *
   * @param agentId - The agent to query
   * @param limit - Maximum entries to return (default 50, capped at maxLogs)
   * @returns Log entries in reverse chronological order, or null if agent not found
   */
  getLogs(agentId: string, limit: number = 50): AgentLogEntry[] | null {
    const entries = this.logs.get(agentId);
    if (!entries) return null;

    const cappedLimit = Math.min(limit, this.maxLogs);
    // Return most recent entries first (reverse chronological)
    return entries.slice(-cappedLimit).reverse();
  }

  /**
   * List all registered agents.
   */
  list(): AgentRecord[] {
    return Array.from(this.agents.values());
  }

  /**
   * Update agent state.
   */
  setState(agentId: string, state: AgentState): boolean {
    const record = this.agents.get(agentId);
    if (!record) return false;

    record.state = state;
    record.lastActivity = Date.now();
    this.addLog(agentId, 'info', `State changed to "${state}"`);
    return true;
  }

  /**
   * Update agent token usage.
   */
  updateTokenUsage(agentId: string, usage: Partial<TokenUsage>): boolean {
    const record = this.agents.get(agentId);
    if (!record) return false;

    if (usage.prompt !== undefined) record.tokenUsage.prompt = usage.prompt;
    if (usage.completion !== undefined) record.tokenUsage.completion = usage.completion;
    record.tokenUsage.total = record.tokenUsage.prompt + record.tokenUsage.completion;
    record.lastActivity = Date.now();
    return true;
  }

  /**
   * Set the current task for an agent.
   */
  setCurrentTask(agentId: string, task: string | null): boolean {
    const record = this.agents.get(agentId);
    if (!record) return false;

    record.currentTask = task;
    record.lastActivity = Date.now();
    if (task) {
      this.addLog(agentId, 'info', `Task started: ${task}`);
    }
    return true;
  }

  /**
   * Add a log entry to an agent's log ring buffer.
   * Evicts the oldest entry when the buffer is full.
   */
  addLog(
    agentId: string,
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): boolean {
    const entries = this.logs.get(agentId);
    if (!entries) return false;

    const entry: AgentLogEntry = {
      timestamp: Date.now(),
      level,
      message,
      ...(data ? { data } : {}),
    };

    entries.push(entry);

    // Ring buffer eviction
    if (entries.length > this.maxLogs) {
      entries.splice(0, entries.length - this.maxLogs);
    }

    return true;
  }

  /**
   * Remove an agent from the registry.
   */
  remove(agentId: string): boolean {
    const existed = this.agents.delete(agentId);
    this.logs.delete(agentId);
    return existed;
  }

  /**
   * Get the number of registered agents.
   */
  get size(): number {
    return this.agents.size;
  }
}
