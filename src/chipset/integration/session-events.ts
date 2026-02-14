/**
 * SessionEventBridge: Maps gsd-stack session lifecycle transitions to
 * Copper LifecycleSync emissions.
 *
 * Bridges session state changes (active, stalled, paused, stopped, saved)
 * to GSD lifecycle events (session-start, session-pause, session-resume,
 * session-stop), making session transitions available as WAIT targets
 * in Copper Lists.
 *
 * Transition rules are defined in TRANSITION_MAP as a simple
 * "from->to" string lookup for clarity and testability.
 */

import type { GsdLifecycleEvent } from '../copper/types.js';
import type { LifecycleSync } from '../copper/lifecycle-sync.js';

// ============================================================================
// Types
// ============================================================================

/** Session lifecycle states from gsd-stack (see get_session_state in bin/gsd-stack). */
export type SessionState = 'active' | 'stalled' | 'paused' | 'stopped' | 'saved';

/** Valid session state values for validation. */
const VALID_SESSION_STATES = new Set<string>([
  'active', 'stalled', 'paused', 'stopped', 'saved',
]);

/** A session state transition with timestamp. */
export interface SessionTransition {
  /** Previous state (null for new sessions). */
  from: SessionState | null;
  /** New state. */
  to: SessionState;
  /** ISO 8601 timestamp of the transition. */
  timestamp: string;
}

// ============================================================================
// Transition Map
// ============================================================================

/**
 * Maps state transitions to GSD lifecycle events.
 *
 * Key format: "{from}->{to}" where from can be "null" for new sessions.
 * Only transitions that produce a lifecycle event are included.
 */
const TRANSITION_MAP: Record<string, GsdLifecycleEvent> = {
  'null->active': 'session-start',
  'active->paused': 'session-pause',
  'stalled->paused': 'session-pause',
  'paused->active': 'session-resume',
  'saved->active': 'session-resume',
  'active->stopped': 'session-stop',
  'paused->stopped': 'session-stop',
  'stalled->stopped': 'session-stop',
};

// ============================================================================
// SessionEventBridge
// ============================================================================

/**
 * Bridge between gsd-stack session lifecycle and Copper LifecycleSync.
 *
 * Accepts a LifecycleSync instance and emits lifecycle events when
 * session state transitions occur that map to GSD lifecycle events.
 */
export class SessionEventBridge {
  private readonly lifecycleSync: LifecycleSync;

  constructor(lifecycleSync: LifecycleSync) {
    this.lifecycleSync = lifecycleSync;
  }

  /**
   * Handle a session state transition.
   *
   * If the transition maps to a GSD lifecycle event, emits it via
   * LifecycleSync and returns the event name. Otherwise returns null.
   *
   * @param from - Previous session state (null for new sessions)
   * @param to - New session state
   * @returns The emitted GsdLifecycleEvent, or null if no event maps
   */
  onTransition(from: SessionState | null, to: SessionState): GsdLifecycleEvent | null {
    const event = SessionEventBridge.getTransitionEvent(from, to);

    if (event !== null) {
      this.lifecycleSync.emit(event);
    }

    return event;
  }

  /**
   * Parse a gsd-stack meta.json file to extract the current session state.
   *
   * @param content - Raw JSON content of meta.json
   * @returns The parsed SessionState
   * @throws Error if JSON is invalid, status field is missing, or status is not a valid SessionState
   */
  fromMetaJson(content: string): SessionState {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON in meta.json');
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('status' in parsed)
    ) {
      throw new Error('Missing status field in meta.json');
    }

    const status = (parsed as Record<string, unknown>).status;
    if (typeof status !== 'string' || !VALID_SESSION_STATES.has(status)) {
      throw new Error(`Invalid session state: ${String(status)}`);
    }

    return status as SessionState;
  }

  /**
   * Pure function: determine the lifecycle event for a state transition.
   *
   * @param from - Previous session state (null for new sessions)
   * @param to - New session state
   * @returns The GsdLifecycleEvent for this transition, or null if none
   */
  static getTransitionEvent(
    from: SessionState | null,
    to: SessionState,
  ): GsdLifecycleEvent | null {
    const key = `${from ?? 'null'}->${to}`;
    return TRANSITION_MAP[key] ?? null;
  }
}
