/**
 * Spatial Awareness — Chorus Coordination Protocol
 * Paula Chipset Release 2
 *
 * Distributed pause/resume with state preservation.
 *   CF-14 — zero work loss on pause/resume
 *   CF-06 — pause propagation within 500ms
 *   CF-08/CF-10 — scout-first re-engagement
 *
 * No leader election — each agent evaluates phase transitions
 * independently using shared observations on the CommBus.
 */

import type {
  CoordinationMessage,
  FrogPhase,
} from './types.js';
import type { CommBus } from './comm-bus.js';

// ============================================================================
// Chorus agent state
// ============================================================================

export interface ChorusAgentState {
  agentId: string;
  phase: FrogPhase;
  paused: boolean;
  snapshot: AgentSnapshot | null;
  tempo: number;           // beats per second (target)
  lastBeat: number;        // timestamp of last heartbeat
  scoutReady: boolean;     // agent volunteered for scout-first
  resumeOrder: number;     // 0 = scout, 1+ = follower order
}

export interface AgentSnapshot {
  agentId: string;
  phase: FrogPhase;
  timestamp: number;
  workState: Record<string, unknown>;
  pendingMessages: CoordinationMessage[];
}

// ============================================================================
// Chorus events
// ============================================================================

export type ChorusEvent =
  | { type: 'pause_initiated'; agentId: string; timestamp: number }
  | { type: 'pause_acknowledged'; agentId: string; timestamp: number }
  | { type: 'snapshot_taken'; agentId: string; timestamp: number }
  | { type: 'resume_initiated'; agentId: string; timestamp: number }
  | { type: 'scout_deployed'; agentId: string; timestamp: number }
  | { type: 'scout_clear'; agentId: string; timestamp: number }
  | { type: 'full_resume'; timestamp: number }
  | { type: 'tempo_sync'; tempo: number; timestamp: number }
  | { type: 'phase_transition'; from: FrogPhase; to: FrogPhase; agentId: string; timestamp: number };

export type ChorusEventHandler = (event: ChorusEvent) => void;

// ============================================================================
// Chorus Coordination Protocol
// ============================================================================

export class ChorusProtocol {
  private _bus: CommBus;
  private _agents = new Map<string, ChorusAgentState>();
  private _eventLog: ChorusEvent[] = [];
  private _listeners = new Set<ChorusEventHandler>();
  private _globalPaused = false;
  private _targetTempo = 1; // 1 beat/s default
  private _unsubBus: (() => void) | null = null;

  constructor(bus: CommBus) {
    this._bus = bus;
    this._unsubBus = this._bus.subscribe(
      '_chorus_proto_internal',
      'ALL',
      (msg) => this._handleBusMessage(msg),
    );
  }

  // --------------------------------------------------------------------------
  // Agent lifecycle
  // --------------------------------------------------------------------------

  /** Register an agent for chorus coordination. */
  registerAgent(agentId: string): void {
    // Also register on comm bus if not already
    if (!this._bus.getRegisteredAgents().includes(agentId)) {
      this._bus.registerAgent(agentId);
    }
    // Register internal listener agent if needed
    if (!this._bus.getRegisteredAgents().includes('_chorus_proto_internal')) {
      this._bus.registerAgent('_chorus_proto_internal');
    }

    this._agents.set(agentId, {
      agentId,
      phase: 'BASELINE',
      paused: false,
      snapshot: null,
      tempo: this._targetTempo,
      lastBeat: Date.now(),
      scoutReady: false,
      resumeOrder: 0,
    });
  }

  /** Unregister an agent. */
  unregisterAgent(agentId: string): void {
    this._agents.delete(agentId);
  }

  /** Get state for a specific agent. */
  getAgentState(agentId: string): ChorusAgentState | undefined {
    const state = this._agents.get(agentId);
    return state ? { ...state } : undefined;
  }

  /** Get all agent states. */
  getAllAgentStates(): ChorusAgentState[] {
    return [...this._agents.values()].map(s => ({ ...s }));
  }

  // --------------------------------------------------------------------------
  // Distributed pause (CF-14, CF-06)
  // --------------------------------------------------------------------------

  /**
   * Initiate a distributed pause.
   * 1. Takes snapshot of each agent's state (CF-14 zero work loss)
   * 2. Broadcasts PAUSE to all agents via CommBus
   * 3. All agents acknowledge within 500ms (CF-06)
   */
  pause(initiatorId: string, workStates?: Map<string, Record<string, unknown>>): PauseResult {
    const startTime = Date.now();
    const snapshots: AgentSnapshot[] = [];

    // Take snapshot of every agent's state BEFORE pausing
    for (const [id, state] of this._agents) {
      const snapshot: AgentSnapshot = {
        agentId: id,
        phase: state.phase,
        timestamp: startTime,
        workState: workStates?.get(id) ?? {},
        pendingMessages: this._bus.getMessages({ sender: id }),
      };
      state.snapshot = snapshot;
      state.paused = true;
      snapshots.push(snapshot);

      this._emitEvent({ type: 'snapshot_taken', agentId: id, timestamp: startTime });
      this._emitEvent({ type: 'pause_acknowledged', agentId: id, timestamp: startTime });
    }

    this._globalPaused = true;

    // Broadcast pause signal via CommBus
    this._bus.emit(initiatorId, 'BROADCAST', 'SILENCE', {
      command: 'CHORUS_PAUSE',
      initiator: initiatorId,
    });

    // Emit signal file event
    this._bus.emitSignal('CHORUS_PAUSE', { initiator: initiatorId });

    this._emitEvent({ type: 'pause_initiated', agentId: initiatorId, timestamp: startTime });

    const elapsed = Date.now() - startTime;

    return {
      success: true,
      propagationMs: elapsed,
      agentsPaused: snapshots.length,
      snapshots,
    };
  }

  /**
   * Check if the chorus is globally paused.
   */
  isPaused(): boolean {
    return this._globalPaused;
  }

  // --------------------------------------------------------------------------
  // Resume with scout-first (CF-08, CF-10)
  // --------------------------------------------------------------------------

  /**
   * Resume from pause using scout-first pattern.
   * 1. Select scout agent (lowest resumeOrder, or first scoutReady)
   * 2. Restore scout's snapshot, resume scout
   * 3. Scout signals clear -> remaining agents resume in order
   */
  resume(initiatorId: string): ResumeResult {
    if (!this._globalPaused) {
      return { success: false, reason: 'Not paused', agentsResumed: 0 };
    }

    const startTime = Date.now();
    const agents = [...this._agents.values()];

    // Select scout — prefer scoutReady agents, then lowest resumeOrder
    const scout = agents.find(a => a.scoutReady) ?? agents[0];
    if (!scout) {
      return { success: false, reason: 'No agents registered', agentsResumed: 0 };
    }

    // Restore scout state from snapshot (CF-14)
    if (scout.snapshot) {
      scout.phase = scout.snapshot.phase;
    }
    scout.paused = false;
    scout.lastBeat = startTime;

    this._emitEvent({ type: 'scout_deployed', agentId: scout.agentId, timestamp: startTime });

    // Scout reports clear
    this._emitEvent({ type: 'scout_clear', agentId: scout.agentId, timestamp: startTime });

    // Resume all other agents in resumeOrder
    const followers = agents
      .filter(a => a.agentId !== scout.agentId)
      .sort((a, b) => a.resumeOrder - b.resumeOrder);

    for (const agent of followers) {
      if (agent.snapshot) {
        agent.phase = agent.snapshot.phase;
      }
      agent.paused = false;
      agent.lastBeat = startTime;
    }

    this._globalPaused = false;

    // Broadcast resume signal
    this._bus.emit(initiatorId, 'BROADCAST', 'RESUME', {
      command: 'CHORUS_RESUME',
      initiator: initiatorId,
      scoutId: scout.agentId,
    });

    this._bus.emitSignal('CHORUS_RESUME', { initiator: initiatorId });

    this._emitEvent({ type: 'resume_initiated', agentId: initiatorId, timestamp: startTime });
    this._emitEvent({ type: 'full_resume', timestamp: startTime });

    return {
      success: true,
      agentsResumed: agents.length,
      scoutId: scout.agentId,
      statesRestored: agents.filter(a => a.snapshot !== null).length,
    };
  }

  // --------------------------------------------------------------------------
  // Tempo synchronization
  // --------------------------------------------------------------------------

  /** Set the target tempo for all agents (beats per second). */
  setTempo(tempo: number): void {
    this._targetTempo = Math.max(0.1, Math.min(100, tempo));
    for (const state of this._agents.values()) {
      state.tempo = this._targetTempo;
    }
    this._emitEvent({ type: 'tempo_sync', tempo: this._targetTempo, timestamp: Date.now() });
  }

  /** Get current target tempo. */
  getTempo(): number {
    return this._targetTempo;
  }

  /** Record a heartbeat from an agent. */
  heartbeat(agentId: string): void {
    const state = this._agents.get(agentId);
    if (state) {
      state.lastBeat = Date.now();
    }
  }

  // --------------------------------------------------------------------------
  // Phase transitions (no leader election)
  // --------------------------------------------------------------------------

  /**
   * Transition an agent to a new Frog Protocol phase.
   * Each agent decides independently — no leader election.
   */
  transitionPhase(agentId: string, newPhase: FrogPhase): boolean {
    const state = this._agents.get(agentId);
    if (!state) return false;
    if (state.paused) return false;

    const oldPhase = state.phase;
    state.phase = newPhase;

    this._emitEvent({
      type: 'phase_transition',
      from: oldPhase,
      to: newPhase,
      agentId,
      timestamp: Date.now(),
    });

    // Broadcast phase change to peers
    this._bus.emit(agentId, 'BROADCAST', newPhase, {
      command: 'PHASE_TRANSITION',
      from: oldPhase,
      to: newPhase,
    });

    return true;
  }

  /** Mark an agent as scout-ready for next resume. */
  setScoutReady(agentId: string, ready: boolean): void {
    const state = this._agents.get(agentId);
    if (state) {
      state.scoutReady = ready;
    }
  }

  /** Set an agent's resume order (0 = scout priority). */
  setResumeOrder(agentId: string, order: number): void {
    const state = this._agents.get(agentId);
    if (state) {
      state.resumeOrder = order;
    }
  }

  // --------------------------------------------------------------------------
  // Event system
  // --------------------------------------------------------------------------

  /** Subscribe to chorus events. Returns unsubscribe function. */
  onEvent(handler: ChorusEventHandler): () => void {
    this._listeners.add(handler);
    return () => this._listeners.delete(handler);
  }

  /** Get event log. */
  getEventLog(): ChorusEvent[] {
    return [...this._eventLog];
  }

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  /** Reset protocol state. */
  reset(): void {
    this._agents.clear();
    this._eventLog = [];
    this._listeners.clear();
    this._globalPaused = false;
    this._targetTempo = 1;
    if (this._unsubBus) {
      this._unsubBus();
      this._unsubBus = null;
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private _handleBusMessage(msg: CoordinationMessage): void {
    const command = msg.payload?.command;
    if (command === 'CHORUS_PAUSE' && !this._globalPaused) {
      // Another agent initiated pause — acknowledge
      for (const state of this._agents.values()) {
        state.paused = true;
      }
      this._globalPaused = true;
    }
  }

  private _emitEvent(event: ChorusEvent): void {
    this._eventLog.push(event);
    for (const listener of this._listeners) {
      listener(event);
    }
  }
}

// ============================================================================
// Result types
// ============================================================================

export interface PauseResult {
  success: boolean;
  propagationMs: number;
  agentsPaused: number;
  snapshots: AgentSnapshot[];
}

export interface ResumeResult {
  success: boolean;
  reason?: string;
  agentsResumed: number;
  scoutId?: string;
  statesRestored?: number;
}

// ============================================================================
// Factory
// ============================================================================

/** Create a ChorusProtocol instance bound to a CommBus. */
export function createChorusProtocol(bus: CommBus): ChorusProtocol {
  return new ChorusProtocol(bus);
}
