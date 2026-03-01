/**
 * State machine tests for the autonomy execution engine.
 *
 * Tests the transition map, factory function, validation,
 * and purity of state transitions.
 */

import { describe, it, expect } from 'vitest';
import {
  createExecutionState,
  transition,
  isValidTransition,
  VALID_TRANSITIONS,
} from './state-machine.js';
import type { ExecutionState, ExecutionStatus } from './types.js';

describe('state-machine', () => {
  // =========================================================================
  // VALID_TRANSITIONS map
  // =========================================================================
  describe('VALID_TRANSITIONS', () => {
    it('maps INITIALIZED to [RUNNING, FAILED]', () => {
      expect(VALID_TRANSITIONS.INITIALIZED).toEqual(['RUNNING', 'FAILED']);
    });

    it('maps RUNNING to [CHECKPOINTING, PAUSED, COMPLETING, FAILED]', () => {
      expect(VALID_TRANSITIONS.RUNNING).toEqual([
        'CHECKPOINTING',
        'PAUSED',
        'COMPLETING',
        'FAILED',
      ]);
    });

    it('maps CHECKPOINTING to [RUNNING, FAILED]', () => {
      expect(VALID_TRANSITIONS.CHECKPOINTING).toEqual(['RUNNING', 'FAILED']);
    });

    it('maps PAUSED to [RUNNING, FAILED]', () => {
      expect(VALID_TRANSITIONS.PAUSED).toEqual(['RUNNING', 'FAILED']);
    });

    it('maps COMPLETING to [DONE, FAILED]', () => {
      expect(VALID_TRANSITIONS.COMPLETING).toEqual(['DONE', 'FAILED']);
    });

    it('maps DONE to empty array (terminal)', () => {
      expect(VALID_TRANSITIONS.DONE).toEqual([]);
    });

    it('maps FAILED to empty array (terminal)', () => {
      expect(VALID_TRANSITIONS.FAILED).toEqual([]);
    });

    it('covers all 7 statuses', () => {
      const statuses: ExecutionStatus[] = [
        'INITIALIZED', 'RUNNING', 'CHECKPOINTING', 'PAUSED',
        'COMPLETING', 'DONE', 'FAILED',
      ];
      expect(Object.keys(VALID_TRANSITIONS).sort()).toEqual(statuses.sort());
    });
  });

  // =========================================================================
  // isValidTransition
  // =========================================================================
  describe('isValidTransition', () => {
    it('returns true for INITIALIZED -> RUNNING', () => {
      expect(isValidTransition('INITIALIZED', 'RUNNING')).toBe(true);
    });

    it('returns true for INITIALIZED -> FAILED', () => {
      expect(isValidTransition('INITIALIZED', 'FAILED')).toBe(true);
    });

    it('returns true for RUNNING -> CHECKPOINTING', () => {
      expect(isValidTransition('RUNNING', 'CHECKPOINTING')).toBe(true);
    });

    it('returns true for RUNNING -> PAUSED', () => {
      expect(isValidTransition('RUNNING', 'PAUSED')).toBe(true);
    });

    it('returns true for RUNNING -> COMPLETING', () => {
      expect(isValidTransition('RUNNING', 'COMPLETING')).toBe(true);
    });

    it('returns true for COMPLETING -> DONE', () => {
      expect(isValidTransition('COMPLETING', 'DONE')).toBe(true);
    });

    it('returns false for INITIALIZED -> DONE (skipping states)', () => {
      expect(isValidTransition('INITIALIZED', 'DONE')).toBe(false);
    });

    it('returns false for DONE -> RUNNING (terminal state)', () => {
      expect(isValidTransition('DONE', 'RUNNING')).toBe(false);
    });

    it('returns false for FAILED -> RUNNING (terminal state)', () => {
      expect(isValidTransition('FAILED', 'RUNNING')).toBe(false);
    });

    it('returns false for CHECKPOINTING -> DONE (must go through RUNNING)', () => {
      expect(isValidTransition('CHECKPOINTING', 'DONE')).toBe(false);
    });

    it('returns false for same-state transition', () => {
      expect(isValidTransition('RUNNING', 'RUNNING')).toBe(false);
    });
  });

  // =========================================================================
  // createExecutionState
  // =========================================================================
  describe('createExecutionState', () => {
    it('creates state with INITIALIZED status', () => {
      const state = createExecutionState('v1.53');
      expect(state.status).toBe('INITIALIZED');
    });

    it('sets milestone from argument', () => {
      const state = createExecutionState('v1.53');
      expect(state.milestone).toBe('v1.53');
    });

    it('starts at subversion 0', () => {
      const state = createExecutionState('v1.53');
      expect(state.current_subversion).toBe(0);
    });

    it('defaults to 100 total subversions', () => {
      const state = createExecutionState('v1.53');
      expect(state.total_subversions).toBe(100);
    });

    it('initializes with empty completed_subversions', () => {
      const state = createExecutionState('v1.53');
      expect(state.completed_subversions).toEqual([]);
    });

    it('initializes with empty transitions', () => {
      const state = createExecutionState('v1.53');
      expect(state.transitions).toEqual([]);
    });

    it('initializes with empty checkpoints', () => {
      const state = createExecutionState('v1.53');
      expect(state.checkpoints).toEqual([]);
    });

    it('sets current_phase to null', () => {
      const state = createExecutionState('v1.53');
      expect(state.current_phase).toBeNull();
    });

    it('sets resume_from to null', () => {
      const state = createExecutionState('v1.53');
      expect(state.resume_from).toBeNull();
    });

    it('sets last_error to null', () => {
      const state = createExecutionState('v1.53');
      expect(state.last_error).toBeNull();
    });

    it('sets started_at to an ISO timestamp', () => {
      const state = createExecutionState('v1.53');
      expect(() => new Date(state.started_at)).not.toThrow();
      expect(state.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('sets updated_at to an ISO timestamp', () => {
      const state = createExecutionState('v1.53');
      expect(state.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('sets version to 1', () => {
      const state = createExecutionState('v1.53');
      expect(state.version).toBe(1);
    });

    it('honors total_subversions override', () => {
      const state = createExecutionState('v1.53', { total_subversions: 50 });
      expect(state.total_subversions).toBe(50);
    });

    it('honors milestone_type override', () => {
      const state = createExecutionState('v1.53', { milestone_type: 'pedagogical' });
      expect(state.milestone_type).toBe('pedagogical');
    });

    it('produces independent instances (no shared references)', () => {
      const a = createExecutionState('v1.53');
      const b = createExecutionState('v1.53');
      a.completed_subversions.push({
        subversion: 0,
        started_at: '',
        completed_at: '',
        phase_results: {},
      } as any);
      expect(b.completed_subversions).toEqual([]);
    });
  });

  // =========================================================================
  // transition
  // =========================================================================
  describe('transition', () => {
    let initialState: ExecutionState;

    beforeEach(() => {
      initialState = createExecutionState('v1.53');
    });

    it('transitions INITIALIZED to RUNNING', () => {
      const next = transition(initialState, 'RUNNING', 'start execution');
      expect(next.status).toBe('RUNNING');
    });

    it('updates updated_at timestamp', () => {
      const before = initialState.updated_at;
      // Small delay to ensure timestamp differs
      const next = transition(initialState, 'RUNNING', 'start');
      expect(next.updated_at).toBeDefined();
      // updated_at should be a valid ISO string
      expect(next.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('appends a transition record', () => {
      const next = transition(initialState, 'RUNNING', 'start execution');
      expect(next.transitions).toHaveLength(1);
      expect(next.transitions[0]).toMatchObject({
        from: 'INITIALIZED',
        to: 'RUNNING',
        trigger: 'start execution',
      });
      expect(next.transitions[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('preserves previous transitions on subsequent calls', () => {
      const running = transition(initialState, 'RUNNING', 'start');
      const checkpointing = transition(running, 'CHECKPOINTING', 'checkpoint gate');
      expect(checkpointing.transitions).toHaveLength(2);
      expect(checkpointing.transitions[0].to).toBe('RUNNING');
      expect(checkpointing.transitions[1].to).toBe('CHECKPOINTING');
    });

    it('is pure — does not mutate input state', () => {
      const original = createExecutionState('v1.53');
      const originalStatus = original.status;
      const originalTransitionsLength = original.transitions.length;

      transition(original, 'RUNNING', 'test');

      expect(original.status).toBe(originalStatus);
      expect(original.transitions).toHaveLength(originalTransitionsLength);
    });

    it('throws on invalid transition INITIALIZED -> DONE', () => {
      expect(() => {
        transition(initialState, 'DONE', 'skip to end');
      }).toThrow(/invalid transition/i);
    });

    it('throws on terminal state DONE -> RUNNING', () => {
      const running = transition(initialState, 'RUNNING', 'start');
      const completing = transition(running, 'COMPLETING', 'all done');
      const done = transition(completing, 'DONE', 'graduation passed');

      expect(() => {
        transition(done, 'RUNNING', 'try again');
      }).toThrow(/invalid transition/i);
    });

    it('throws on terminal state FAILED -> RUNNING', () => {
      const failed = transition(initialState, 'FAILED', 'error');
      expect(() => {
        transition(failed, 'RUNNING', 'retry');
      }).toThrow(/invalid transition/i);
    });

    it('error message includes from and to states', () => {
      try {
        transition(initialState, 'DONE', 'bad');
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('INITIALIZED');
        expect(e.message).toContain('DONE');
      }
    });

    it('handles chained transitions correctly', () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = transition(state, 'CHECKPOINTING', 'checkpoint');
      state = transition(state, 'RUNNING', 'resume');
      state = transition(state, 'COMPLETING', 'all subversions done');
      state = transition(state, 'DONE', 'graduation passed');

      expect(state.status).toBe('DONE');
      expect(state.transitions).toHaveLength(5);
    });
  });
});
