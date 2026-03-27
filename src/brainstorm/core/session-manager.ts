/**
 * Session Manager for brainstorm sessions.
 *
 * The single source of truth for brainstorm session state. Manages the
 * 5-status lifecycle (created/active/paused/completed/abandoned), JSONL
 * append-only idea and question persistence, timer pause/resume, and full
 * state.json serialization with Zod schema read-back.
 *
 * Every downstream component (Phase Controller, agents, Facilitator) reads
 * from and writes through SessionManager. It is the critical path dependency
 * for Phase 307.
 *
 * Only imports from brainstorm/shared -- zero imports from den/, vtm/, knowledge/.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type {
  SessionState,
  SessionPhase,
  SessionStatus,
  Idea,
  Question,
  Cluster,
  Evaluation,
  ActionItem,
  AgentRole,
  EnergyLevel,
  PathwayId,
  TechniqueId,
} from '../shared/types.js';
import { SessionStateSchema } from '../shared/types.js';
import { PHASE_ORDER, TECHNIQUE_DEFAULTS } from '../shared/constants.js';

// ============================================================================
// Error types
// ============================================================================

/**
 * Error codes for SessionManager operations.
 */
export type SessionManagerErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'SESSION_ALREADY_COMPLETE';

/**
 * Custom error class for SessionManager.
 *
 * Includes a machine-readable `code` field for programmatic error handling.
 */
export class SessionManagerError extends Error {
  readonly code: SessionManagerErrorCode;

  constructor(message: string, code: SessionManagerErrorCode) {
    super(message);
    this.name = 'SessionManagerError';
    this.code = code;
  }
}

// ============================================================================
// Interface
// ============================================================================

/**
 * SessionManager interface.
 *
 * All methods are async -- filesystem I/O on every state mutation.
 * Methods take session_id explicitly so the same manager instance can
 * be reused across sessions in tests.
 */
export interface ISessionManager {
  createSession(problem_statement: string, pathway?: PathwayId): Promise<SessionState>;
  getSession(session_id: string): Promise<SessionState>;
  updatePhase(session_id: string, phase: SessionPhase): Promise<SessionState>;
  addIdea(session_id: string, idea: Idea): Promise<void>;
  addQuestion(session_id: string, question: Question): Promise<void>;
  setClusters(session_id: string, clusters: Cluster[]): Promise<void>;
  addEvaluation(session_id: string, evaluation: Evaluation): Promise<void>;
  addActionItem(session_id: string, item: ActionItem): Promise<void>;
  setActiveTechnique(session_id: string, technique: TechniqueId | null): Promise<void>;
  setActiveAgents(session_id: string, agents: AgentRole[]): Promise<void>;
  setEnergyLevel(session_id: string, level: EnergyLevel): Promise<void>;
  pauseSession(session_id: string): Promise<void>;
  resumeSession(session_id: string): Promise<void>;
  completeSession(session_id: string): Promise<SessionState>;
  abandonSession(session_id: string): Promise<void>;
}

// ============================================================================
// Internal timer tracking
// ============================================================================

/**
 * In-memory timer entry for technique timing.
 *
 * Tracks setTimeout handle and timing state for pause/resume support.
 * Only exists in memory -- not persisted. On process restart, timers are lost
 * but remaining_ms in state.json captures the last known value.
 */
interface TimerEntry {
  timeoutId: ReturnType<typeof setTimeout> | null;
  startedAt: number;
  remainingMs: number;
  totalMs: number;
}

// ============================================================================
// Valid state machine transitions
// ============================================================================

/**
 * Valid status transitions.
 *
 * created -> active (via setActiveTechnique or updatePhase)
 * active -> paused (pauseSession)
 * paused -> active (resumeSession)
 * active -> completed (completeSession)
 * active -> abandoned (abandonSession)
 * paused -> abandoned (abandonSession)
 */
const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  created: ['active'],
  active: ['paused', 'completed', 'abandoned'],
  paused: ['active', 'abandoned'],
  completed: [],
  abandoned: [],
};

// ============================================================================
// SessionManager implementation
// ============================================================================

/**
 * SessionManager -- the single source of truth for brainstorm session state.
 *
 * All state mutations write state.json before returning (no fire-and-forget).
 * ideas.jsonl and questions.jsonl are append-only -- never truncated or overwritten.
 * getSession() validates with SessionStateSchema.parse() on every read-back.
 */
export class SessionManager implements ISessionManager {
  private readonly brainstormDir: string;
  private readonly _timers: Map<string, TimerEntry> = new Map();

  constructor(config: { brainstormDir: string }) {
    this.brainstormDir = config.brainstormDir;
  }

  // ==========================================================================
  // Path helpers
  // ==========================================================================

  private sessionDir(session_id: string): string {
    return path.join(this.brainstormDir, 'sessions', session_id);
  }

  private statePath(session_id: string): string {
    return path.join(this.sessionDir(session_id), 'state.json');
  }

  private ideasPath(session_id: string): string {
    return path.join(this.sessionDir(session_id), 'ideas.jsonl');
  }

  private questionsPath(session_id: string): string {
    return path.join(this.sessionDir(session_id), 'questions.jsonl');
  }

  private clustersPath(session_id: string): string {
    return path.join(this.sessionDir(session_id), 'clusters.json');
  }

  private evaluationsPath(session_id: string): string {
    return path.join(this.sessionDir(session_id), 'evaluations.json');
  }

  // ==========================================================================
  // State persistence
  // ==========================================================================

  /**
   * Write full session state to disk.
   *
   * Called on every state mutation -- no fire-and-forget.
   */
  private async writeState(session_id: string, state: SessionState): Promise<void> {
    await fs.writeFile(this.statePath(session_id), JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * Read and validate session state from disk.
   *
   * Uses SessionStateSchema.parse() for Zod runtime validation -- filesystem
   * roundtrip loses TypeScript types. Never cast from disk reads.
   */
  private async readState(session_id: string): Promise<SessionState> {
    let data: string;
    try {
      data = await fs.readFile(this.statePath(session_id), 'utf-8');
    } catch {
      throw new SessionManagerError(
        `Session ${session_id} not found`,
        'SESSION_NOT_FOUND',
      );
    }
    return SessionStateSchema.parse(JSON.parse(data));
  }

  /**
   * Validate a status transition against the state machine.
   *
   * Throws SessionManagerError with code 'INVALID_TRANSITION' if the
   * transition is not permitted.
   */
  private assertTransition(current: SessionStatus, target: SessionStatus): void {
    if (!VALID_TRANSITIONS[current].includes(target)) {
      throw new SessionManagerError(
        `Invalid transition from '${current}' to '${target}'`,
        'INVALID_TRANSITION',
      );
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Create a new brainstorm session.
   *
   * Generates a UUID, creates the session directory, initializes state with
   * 'created' status and 'explore' phase, writes state.json.
   */
  async createSession(
    problem_statement: string,
    pathway?: PathwayId,
  ): Promise<SessionState> {
    const session_id = randomUUID();
    const dir = this.sessionDir(session_id);
    await fs.mkdir(dir, { recursive: true });

    const now = Date.now();
    const state: SessionState = {
      id: session_id,
      status: 'created',
      phase: 'explore',
      problem_statement,
      active_technique: null,
      active_pathway: pathway ?? null,
      technique_queue: [],
      active_agents: ['facilitator', 'scribe'],
      ideas: [],
      questions: [],
      clusters: [],
      evaluations: [],
      action_items: [],
      timer: {
        technique_timer: null,
        session_timer: { elapsed_ms: 0 },
        is_paused: false,
      },
      energy_level: 'high',
      rules_active: [],
      hat_color: undefined,
      metadata: {
        created_at: now,
        updated_at: now,
        total_ideas: 0,
        total_questions: 0,
        techniques_used: [],
        phase_history: [{ phase: 'explore', entered_at: now }],
      },
    };

    await this.writeState(session_id, state);
    return state;
  }

  /**
   * Get session state from disk with Zod validation.
   *
   * Throws SESSION_NOT_FOUND if state.json doesn't exist.
   */
  async getSession(session_id: string): Promise<SessionState> {
    return this.readState(session_id);
  }

  /**
   * Update the session phase.
   *
   * Validates phase follows PHASE_ORDER. Closes previous phase_history entry
   * (sets exited_at), adds new phase entry. Auto-transitions status from
   * 'created' to 'active' if currently 'created'.
   */
  async updatePhase(session_id: string, phase: SessionPhase): Promise<SessionState> {
    const state = await this.readState(session_id);

    // Validate phase ordering
    const currentIndex = PHASE_ORDER.indexOf(state.phase);
    const targetIndex = PHASE_ORDER.indexOf(phase);
    if (targetIndex <= currentIndex) {
      throw new SessionManagerError(
        `Cannot transition from phase '${state.phase}' to '${phase}' -- phases must advance forward`,
        'INVALID_TRANSITION',
      );
    }

    // Auto-transition from created to active
    if (state.status === 'created') {
      this.assertTransition('created', 'active');
      state.status = 'active';
    }

    // Reject if completed or abandoned
    if (state.status === 'completed' || state.status === 'abandoned') {
      throw new SessionManagerError(
        `Cannot update phase on a '${state.status}' session`,
        'SESSION_ALREADY_COMPLETE',
      );
    }

    const now = Date.now();

    // Close previous phase history entry
    const lastHistory = state.metadata.phase_history[state.metadata.phase_history.length - 1];
    if (lastHistory && !lastHistory.exited_at) {
      lastHistory.exited_at = now;
    }

    // Add new phase entry
    state.metadata.phase_history.push({ phase, entered_at: now });
    state.phase = phase;
    state.metadata.updated_at = now;

    await this.writeState(session_id, state);
    return state;
  }

  /**
   * Add an idea to the session.
   *
   * Appends to in-memory ideas[] array AND to ideas.jsonl on disk.
   * Both writes happen for every idea -- append-only, never truncate.
   */
  async addIdea(session_id: string, idea: Idea): Promise<void> {
    const state = await this.readState(session_id);

    state.ideas.push(idea);
    state.metadata.total_ideas += 1;
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
    await fs.appendFile(this.ideasPath(session_id), JSON.stringify(idea) + '\n', 'utf-8');
  }

  /**
   * Add a question to the session.
   *
   * Same pattern as addIdea -- append to in-memory array AND questions.jsonl.
   */
  async addQuestion(session_id: string, question: Question): Promise<void> {
    const state = await this.readState(session_id);

    state.questions.push(question);
    state.metadata.total_questions += 1;
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
    await fs.appendFile(this.questionsPath(session_id), JSON.stringify(question) + '\n', 'utf-8');
  }

  /**
   * Set clusters for the session (overwrite).
   *
   * Replaces all clusters in state AND writes clusters.json.
   */
  async setClusters(session_id: string, clusters: Cluster[]): Promise<void> {
    const state = await this.readState(session_id);

    state.clusters = clusters;
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
    await fs.writeFile(this.clustersPath(session_id), JSON.stringify(clusters, null, 2), 'utf-8');
  }

  /**
   * Add an evaluation to the session.
   *
   * Accumulates in evaluations[] array AND overwrites evaluations.json with
   * the complete array.
   */
  async addEvaluation(session_id: string, evaluation: Evaluation): Promise<void> {
    const state = await this.readState(session_id);

    state.evaluations.push(evaluation);
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
    await fs.writeFile(
      this.evaluationsPath(session_id),
      JSON.stringify(state.evaluations, null, 2),
      'utf-8',
    );
  }

  /**
   * Add an action item to the session.
   */
  async addActionItem(session_id: string, item: ActionItem): Promise<void> {
    const state = await this.readState(session_id);

    state.action_items.push(item);
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
  }

  /**
   * Set the active technique for the session.
   *
   * When technique is not null: looks up duration from TECHNIQUE_DEFAULTS,
   * initializes timer in _timers map, sets state.timer.technique_timer,
   * tracks technique in metadata.techniques_used, and auto-transitions
   * status from 'created' to 'active'.
   *
   * When technique is null: clears timer from _timers map, sets
   * state.timer.technique_timer to null.
   */
  async setActiveTechnique(
    session_id: string,
    technique: TechniqueId | null,
  ): Promise<void> {
    const state = await this.readState(session_id);

    // Reject if session is completed or abandoned -- no further mutations
    if (state.status === 'completed' || state.status === 'abandoned') {
      throw new SessionManagerError(
        `Cannot set technique on a '${state.status}' session`,
        'INVALID_TRANSITION',
      );
    }

    if (technique !== null) {
      const defaults = TECHNIQUE_DEFAULTS[technique];
      const durationMs = defaults.duration_ms;

      // Initialize in-memory timer
      this._timers.set(session_id, {
        timeoutId: null,
        startedAt: Date.now(),
        remainingMs: durationMs,
        totalMs: durationMs,
      });

      state.active_technique = technique;
      state.timer.technique_timer = {
        remaining_ms: durationMs,
        total_ms: durationMs,
      };

      // Track technique usage
      if (!state.metadata.techniques_used.includes(technique)) {
        state.metadata.techniques_used.push(technique);
      }

      // Auto-transition from created to active
      if (state.status === 'created') {
        this.assertTransition('created', 'active');
        state.status = 'active';
      }
    } else {
      // Clear technique and timer
      const timerEntry = this._timers.get(session_id);
      if (timerEntry?.timeoutId) {
        clearTimeout(timerEntry.timeoutId);
      }
      this._timers.delete(session_id);

      state.active_technique = null;
      state.timer.technique_timer = null;
    }

    state.metadata.updated_at = Date.now();
    await this.writeState(session_id, state);
  }

  /**
   * Set the active agents for the session.
   */
  async setActiveAgents(session_id: string, agents: AgentRole[]): Promise<void> {
    const state = await this.readState(session_id);

    state.active_agents = agents;
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
  }

  /**
   * Set the energy level for the session.
   */
  async setEnergyLevel(session_id: string, level: EnergyLevel): Promise<void> {
    const state = await this.readState(session_id);

    state.energy_level = level;
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
  }

  /**
   * Pause the session.
   *
   * If a technique timer is active in _timers, calculates remaining_ms
   * and stores it both in the map entry AND in state.timer.technique_timer.
   * Sets state.timer.is_paused = true. Transitions status to 'paused'.
   */
  async pauseSession(session_id: string): Promise<void> {
    const state = await this.readState(session_id);
    this.assertTransition(state.status, 'paused');

    // Handle technique timer
    const timerEntry = this._timers.get(session_id);
    if (timerEntry) {
      if (timerEntry.timeoutId) {
        clearTimeout(timerEntry.timeoutId);
        timerEntry.timeoutId = null;
      }
      const elapsed = Date.now() - timerEntry.startedAt;
      timerEntry.remainingMs = Math.max(0, timerEntry.totalMs - elapsed);

      if (state.timer.technique_timer) {
        state.timer.technique_timer.remaining_ms = timerEntry.remainingMs;
      }
    }

    state.timer.is_paused = true;
    state.status = 'paused';
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
  }

  /**
   * Resume a paused session.
   *
   * Restores timer with remaining_ms from state.timer.technique_timer.
   * Sets state.timer.is_paused = false. Transitions status to 'active'.
   */
  async resumeSession(session_id: string): Promise<void> {
    const state = await this.readState(session_id);
    this.assertTransition(state.status, 'active');

    // Restore technique timer if one exists
    if (state.timer.technique_timer) {
      const remainingMs = state.timer.technique_timer.remaining_ms;
      this._timers.set(session_id, {
        timeoutId: null,
        startedAt: Date.now(),
        remainingMs,
        totalMs: remainingMs, // For resumed timers, total = remaining
      });
    }

    state.timer.is_paused = false;
    state.status = 'active';
    state.metadata.updated_at = Date.now();

    await this.writeState(session_id, state);
  }

  /**
   * Complete the session.
   *
   * Only valid from 'active' status. Sets status to 'completed', closes
   * last phase_history entry, writes final state.
   */
  async completeSession(session_id: string): Promise<SessionState> {
    const state = await this.readState(session_id);
    this.assertTransition(state.status, 'completed');

    const now = Date.now();

    // Close last phase history entry
    const lastHistory = state.metadata.phase_history[state.metadata.phase_history.length - 1];
    if (lastHistory && !lastHistory.exited_at) {
      lastHistory.exited_at = now;
    }

    // Clean up timer
    const timerEntry = this._timers.get(session_id);
    if (timerEntry?.timeoutId) {
      clearTimeout(timerEntry.timeoutId);
    }
    this._timers.delete(session_id);

    state.status = 'completed';
    state.metadata.updated_at = now;

    await this.writeState(session_id, state);
    return state;
  }

  /**
   * Abandon the session.
   *
   * Valid from 'active' or 'paused'. Sets status to 'abandoned', closes
   * last phase_history entry, cleans up timers.
   */
  async abandonSession(session_id: string): Promise<void> {
    const state = await this.readState(session_id);
    this.assertTransition(state.status, 'abandoned');

    const now = Date.now();

    // Close last phase history entry
    const lastHistory = state.metadata.phase_history[state.metadata.phase_history.length - 1];
    if (lastHistory && !lastHistory.exited_at) {
      lastHistory.exited_at = now;
    }

    // Clean up timer
    const timerEntry = this._timers.get(session_id);
    if (timerEntry?.timeoutId) {
      clearTimeout(timerEntry.timeoutId);
    }
    this._timers.delete(session_id);

    state.status = 'abandoned';
    state.metadata.updated_at = now;

    await this.writeState(session_id, state);
  }
}
