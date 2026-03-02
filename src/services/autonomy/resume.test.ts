/**
 * Auto-resume tests for the autonomy execution engine.
 *
 * Tests crash recovery: reading persisted state, computing resume
 * points, transitioning back to RUNNING, and skipping completed work.
 *
 * Uses real filesystem I/O in temp directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canResume, computeResumePoint, resumeExecution } from './resume.js';
import { createExecutionState, transition } from './state-machine.js';
import { writeExecutionState } from './persistence.js';
import type { ExecutionState, ExecutionStatus } from './types.js';

describe('resume', () => {
  let tempDir: string;
  let statePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'autonomy-resume-'));
    statePath = join(tempDir, 'execution-state.json');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // =========================================================================
  // canResume
  // =========================================================================
  describe('canResume', () => {
    it('returns true for RUNNING', () => {
      expect(canResume('RUNNING')).toBe(true);
    });

    it('returns true for CHECKPOINTING', () => {
      expect(canResume('CHECKPOINTING')).toBe(true);
    });

    it('returns true for PAUSED', () => {
      expect(canResume('PAUSED')).toBe(true);
    });

    it('returns false for INITIALIZED', () => {
      expect(canResume('INITIALIZED')).toBe(false);
    });

    it('returns false for DONE', () => {
      expect(canResume('DONE')).toBe(false);
    });

    it('returns false for FAILED', () => {
      expect(canResume('FAILED')).toBe(false);
    });

    it('returns false for COMPLETING', () => {
      expect(canResume('COMPLETING')).toBe(false);
    });
  });

  // =========================================================================
  // computeResumePoint
  // =========================================================================
  describe('computeResumePoint', () => {
    it('returns resume_from if set (non-null)', () => {
      const state = createExecutionState('v1.53');
      const modified = { ...state, resume_from: 42, status: 'RUNNING' as ExecutionStatus };
      expect(computeResumePoint(modified)).toBe(42);
    });

    it('returns current_subversion if resume_from is null', () => {
      const state = createExecutionState('v1.53');
      const modified = { ...state, current_subversion: 15, status: 'RUNNING' as ExecutionStatus };
      expect(computeResumePoint(modified)).toBe(15);
    });

    it('throws if resume point is beyond total_subversions', () => {
      const state = createExecutionState('v1.53', { total_subversions: 100 });
      const modified = { ...state, resume_from: 100, status: 'RUNNING' as ExecutionStatus };
      expect(() => computeResumePoint(modified)).toThrow(/beyond|total/i);
    });

    it('advances past already-completed subversions', () => {
      const state = createExecutionState('v1.53', { total_subversions: 100 });
      const modified = {
        ...state,
        current_subversion: 5,
        status: 'RUNNING' as ExecutionStatus,
        completed_subversions: [
          { subversion: 5, started_at: '', completed_at: '', phase_results: {} },
          { subversion: 6, started_at: '', completed_at: '', phase_results: {} },
        ],
      };
      const result = computeResumePoint(modified);
      expect(result).toBe(7);
    });

    it('returns current_subversion when it is not completed', () => {
      const state = createExecutionState('v1.53', { total_subversions: 100 });
      const modified = {
        ...state,
        current_subversion: 10,
        status: 'RUNNING' as ExecutionStatus,
        completed_subversions: [
          { subversion: 8, started_at: '', completed_at: '', phase_results: {} },
          { subversion: 9, started_at: '', completed_at: '', phase_results: {} },
        ],
      };
      expect(computeResumePoint(modified)).toBe(10);
    });
  });

  // =========================================================================
  // resumeExecution
  // =========================================================================
  describe('resumeExecution', () => {
    it('returns canResume: false for missing state file', async () => {
      const result = await resumeExecution(join(tempDir, 'nonexistent.json'));
      expect(result.canResume).toBe(false);
      if (!result.canResume) {
        expect(result.reason).toMatch(/not found|invalid/i);
      }
    });

    it('returns canResume: false for DONE state', async () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = transition(state, 'COMPLETING', 'all done');
      state = transition(state, 'DONE', 'graduation');
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(false);
      if (!result.canResume) {
        expect(result.reason).toMatch(/DONE/);
      }
    });

    it('returns canResume: false for FAILED state', async () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'FAILED', 'error');
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(false);
      if (!result.canResume) {
        expect(result.reason).toMatch(/FAILED/);
      }
    });

    it('transitions PAUSED state to RUNNING and returns prepared state', async () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = transition(state, 'PAUSED', 'context exhaustion');
      state = { ...state, current_subversion: 25 };
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(true);
      if (result.canResume) {
        expect(result.state.status).toBe('RUNNING');
        expect(result.resumeFrom).toBe(25);
      }
    });

    it('transitions CHECKPOINTING state to RUNNING and returns prepared state', async () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = transition(state, 'CHECKPOINTING', 'checkpoint gate');
      state = { ...state, current_subversion: 10 };
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(true);
      if (result.canResume) {
        expect(result.state.status).toBe('RUNNING');
        expect(result.resumeFrom).toBe(10);
      }
    });

    it('returns RUNNING state as-is for crash recovery', async () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = { ...state, current_subversion: 42 };
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(true);
      if (result.canResume) {
        expect(result.state.status).toBe('RUNNING');
        expect(result.resumeFrom).toBe(42);
      }
    });

    it('uses resume_from when set', async () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = transition(state, 'PAUSED', 'context');
      state = { ...state, current_subversion: 50, resume_from: 50 };
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(true);
      if (result.canResume) {
        expect(result.resumeFrom).toBe(50);
        // resume_from should be consumed (cleared)
        expect(result.state.resume_from).toBeNull();
      }
    });

    it('sets current_subversion to computed resume point', async () => {
      let state = createExecutionState('v1.53');
      state = transition(state, 'RUNNING', 'start');
      state = transition(state, 'PAUSED', 'context');
      state = { ...state, current_subversion: 30, resume_from: 30 };
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(true);
      if (result.canResume) {
        expect(result.state.current_subversion).toBe(30);
      }
    });

    it('does not re-execute completed subversions', async () => {
      let state = createExecutionState('v1.53', { total_subversions: 10 });
      state = transition(state, 'RUNNING', 'start');
      state = {
        ...state,
        current_subversion: 5,
        completed_subversions: [
          { subversion: 0, started_at: '', completed_at: '', phase_results: {} },
          { subversion: 1, started_at: '', completed_at: '', phase_results: {} },
          { subversion: 2, started_at: '', completed_at: '', phase_results: {} },
          { subversion: 3, started_at: '', completed_at: '', phase_results: {} },
          { subversion: 4, started_at: '', completed_at: '', phase_results: {} },
        ],
      };
      await writeExecutionState(state, statePath);

      const result = await resumeExecution(statePath);
      expect(result.canResume).toBe(true);
      if (result.canResume) {
        expect(result.resumeFrom).toBe(5);
        expect(result.state.current_subversion).toBe(5);
      }
    });
  });
});
