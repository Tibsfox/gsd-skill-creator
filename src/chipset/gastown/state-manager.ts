/**
 * Gastown StateManager — beads persistence abstraction.
 *
 * Provides git-friendly, crash-recoverable state management for the Gastown
 * orchestration chipset. All state is stored as individual JSON files using
 * atomic write operations (write temp -> fsync -> rename).
 *
 * State directory layout:
 *   {stateDir}/agents/     Agent identity JSON files
 *   {stateDir}/hooks/      GUPP hook state per agent
 *   {stateDir}/work/       Work item beads
 *   {stateDir}/convoys/    Batch tracking
 *   {stateDir}/merge-queue/ Refinery merge requests
 *
 * All JSON output uses sorted keys for deterministic, git-diff-friendly output.
 */

import { mkdir, writeFile, readFile, readdir, rename, open } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import type {
  AgentRole,
  AgentStatus,
  AgentIdentity,
  WorkItem,
  WorkStatus,
  HookState,
  Convoy,
} from './types.js';

// ============================================================================
// Configuration
// ============================================================================

export interface StateManagerOptions {
  /** Root directory for state files. Default: '.chipset/state/' */
  stateDir: string;
}

// ============================================================================
// Helpers
// ============================================================================

/** Generate a short random hex ID. */
function generateId(prefix: string): string {
  const hex = randomBytes(5).toString('hex');
  return `${prefix}-${hex}`;
}

/**
 * Serialize data to JSON with sorted keys for git-friendly output.
 *
 * Uses a replacer that sorts object keys alphabetically at every level,
 * producing deterministic output regardless of property insertion order.
 */
function serializeSorted(data: unknown): string {
  return JSON.stringify(data, (_key: string, value: unknown) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  }, 2) + '\n';
}

/**
 * Atomic write: write to temp file, fsync, then rename.
 *
 * Guarantees that a reader always sees either the complete old content
 * or the complete new content, never a partial write.
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });

  const tmpPath = filePath + '.tmp';
  const fd = await open(tmpPath, 'w');
  try {
    await fd.writeFile(content, 'utf-8');
    await fd.sync();
  } finally {
    await fd.close();
  }
  await rename(tmpPath, filePath);
}

/** Read and parse a JSON file, returning null if not found or corrupt. */
async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// ============================================================================
// StateManager
// ============================================================================

export class StateManager {
  private readonly stateDir: string;

  constructor(options: StateManagerOptions) {
    this.stateDir = options.stateDir;
  }

  // --------------------------------------------------------------------------
  // Directory helpers
  // --------------------------------------------------------------------------

  private agentsDir(): string {
    return join(this.stateDir, 'agents');
  }

  private workDir(): string {
    return join(this.stateDir, 'work');
  }

  private hooksDir(): string {
    return join(this.stateDir, 'hooks');
  }

  private convoysDir(): string {
    return join(this.stateDir, 'convoys');
  }

  private agentPath(id: string): string {
    return join(this.agentsDir(), `${id}.json`);
  }

  private workPath(beadId: string): string {
    return join(this.workDir(), `${beadId}.json`);
  }

  private hookPath(agentId: string): string {
    return join(this.hooksDir(), `${agentId}.json`);
  }

  private convoyPath(id: string): string {
    return join(this.convoysDir(), `${id}.json`);
  }

  // --------------------------------------------------------------------------
  // Agent operations
  // --------------------------------------------------------------------------

  /** Create a new agent identity and persist it to disk. */
  async createAgent(role: AgentRole, rig: string): Promise<AgentIdentity> {
    const id = generateId(role);
    const agent: AgentIdentity = {
      id,
      role,
      rig,
      hookId: `hook-${id}`,
      status: 'idle',
    };
    await atomicWrite(this.agentPath(id), serializeSorted(agent));
    return agent;
  }

  /** Retrieve an agent by ID, or null if not found. */
  async getAgent(id: string): Promise<AgentIdentity | null> {
    return readJson<AgentIdentity>(this.agentPath(id));
  }

  /** Update an agent's lifecycle status atomically. */
  async updateAgentStatus(id: string, status: AgentStatus): Promise<void> {
    const agent = await this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }
    agent.status = status;
    await atomicWrite(this.agentPath(id), serializeSorted(agent));
  }

  /** List all agents, optionally filtered by role and/or rig. */
  async listAgents(filter?: { role?: AgentRole; rig?: string }): Promise<AgentIdentity[]> {
    const dir = this.agentsDir();
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return [];
    }

    const agents: AgentIdentity[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const agent = await readJson<AgentIdentity>(join(dir, file));
      if (!agent) continue;
      if (filter?.role && agent.role !== filter.role) continue;
      if (filter?.rig && agent.rig !== filter.rig) continue;
      agents.push(agent);
    }
    return agents;
  }

  // --------------------------------------------------------------------------
  // Work item operations
  // --------------------------------------------------------------------------

  /** Create a new work item and persist it to disk. */
  async createWorkItem(
    title: string,
    description: string,
    priority?: 'P1' | 'P2' | 'P3',
  ): Promise<WorkItem> {
    const beadId = generateId('bead');
    const item: WorkItem = {
      beadId,
      title,
      description,
      status: 'open',
      hookStatus: 'empty',
      priority: priority ?? 'P2',
    };
    await atomicWrite(this.workPath(beadId), serializeSorted(item));
    return item;
  }

  /** Retrieve a work item by bead ID, or null if not found. */
  async getWorkItem(beadId: string): Promise<WorkItem | null> {
    return readJson<WorkItem>(this.workPath(beadId));
  }

  /** Update a work item's status atomically. */
  async updateWorkStatus(beadId: string, status: WorkStatus): Promise<void> {
    const item = await this.getWorkItem(beadId);
    if (!item) {
      throw new Error(`Work item not found: ${beadId}`);
    }
    item.status = status;
    await atomicWrite(this.workPath(beadId), serializeSorted(item));
  }

  // --------------------------------------------------------------------------
  // Hook operations
  // --------------------------------------------------------------------------

  /** Assign a work item to an agent. Enforces single assignment. */
  async setHook(agentId: string, beadId: string): Promise<void> {
    const existing = await this.getHook(agentId);
    if (existing && existing.status === 'active') {
      throw new Error(`Agent ${agentId} already has an active hook`);
    }

    const workItem = await this.getWorkItem(beadId);
    if (!workItem) {
      throw new Error(`Work item not found: ${beadId}`);
    }

    const hook: HookState = {
      agentId,
      status: 'active',
      workItem,
      lastActivity: new Date().toISOString(),
    };
    await atomicWrite(this.hookPath(agentId), serializeSorted(hook));
  }

  /** Retrieve hook state for an agent, or null if no hook set. */
  async getHook(agentId: string): Promise<HookState | null> {
    return readJson<HookState>(this.hookPath(agentId));
  }

  /** Clear a hook assignment by deleting the hook file. */
  async clearHook(agentId: string): Promise<void> {
    const { unlink } = await import('node:fs/promises');
    try {
      await unlink(this.hookPath(agentId));
    } catch {
      // Already cleared or never set — no-op
    }
  }

  // --------------------------------------------------------------------------
  // Convoy operations
  // --------------------------------------------------------------------------

  /** Create a convoy grouping related work items. */
  async createConvoy(name: string, beadIds: string[]): Promise<Convoy> {
    const id = generateId('convoy');
    const convoy: Convoy = {
      id,
      name,
      beadIds,
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    await atomicWrite(this.convoyPath(id), serializeSorted(convoy));
    return convoy;
  }

  /** Retrieve a convoy by ID, or null if not found. */
  async getConvoy(id: string): Promise<Convoy | null> {
    return readJson<Convoy>(this.convoyPath(id));
  }

  /**
   * Recalculate convoy progress from member bead statuses.
   *
   * Progress = (done + merged beads) / total beads.
   */
  async updateConvoyProgress(id: string): Promise<void> {
    const convoy = await this.getConvoy(id);
    if (!convoy) {
      throw new Error(`Convoy not found: ${id}`);
    }

    let completed = 0;
    for (const beadId of convoy.beadIds) {
      const item = await this.getWorkItem(beadId);
      if (item && (item.status === 'done' || item.status === 'merged')) {
        completed++;
      }
    }

    convoy.progress = convoy.beadIds.length > 0
      ? completed / convoy.beadIds.length
      : 0;

    await atomicWrite(this.convoyPath(id), serializeSorted(convoy));
  }
}
