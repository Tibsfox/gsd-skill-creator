/**
 * Scheduler tests for the autonomy execution engine.
 *
 * Tests the queue-based subversion scheduler that drives the
 * 4-phase execution cycle (prepare/execute/verify/journal).
 *
 * Uses mock callbacks and temp directories for state persistence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createScheduler,
  type SubversionCallbacks,
  type PhaseResult,
  type SchedulerOptions,
} from './scheduler.js';
import { createExecutionState, transition } from './state-machine.js';
import { readExecutionState } from './persistence.js';
import type { ExecutionState } from './types.js';

/** Create mock callbacks where all phases succeed */
function createSuccessCallbacks(): SubversionCallbacks {
  return {
    prepare: vi.fn(async () => ({ success: true })),
    execute: vi.fn(async () => ({ success: true })),
    verify: vi.fn(async () => ({ success: true })),
    journal: vi.fn(async () => ({ success: true })),
  };
}

/** Create mock callbacks where a specific phase fails at a specific subversion */
function createFailingCallbacks(
  failPhase: keyof SubversionCallbacks,
  failAtSubversion: number,
): SubversionCallbacks {
  return {
    prepare: vi.fn(async (sub: number) =>
      failPhase === 'prepare' && sub === failAtSubversion
        ? { success: false }
        : { success: true },
    ),
    execute: vi.fn(async (sub: number) =>
      failPhase === 'execute' && sub === failAtSubversion
        ? { success: false }
        : { success: true },
    ),
    verify: vi.fn(async (sub: number) =>
      failPhase === 'verify' && sub === failAtSubversion
        ? { success: false }
        : { success: true },
    ),
    journal: vi.fn(async (sub: number) =>
      failPhase === 'journal' && sub === failAtSubversion
        ? { success: false }
        : { success: true },
    ),
  };
}

describe('scheduler', () => {
  let tempDir: string;
  let statePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'autonomy-sched-'));
    statePath = join(tempDir, 'execution-state.json');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // =========================================================================
  // Basic execution
  // =========================================================================
  describe('basic execution', () => {
    it('transitions INITIALIZED to RUNNING before starting', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      const result = await scheduler.run(state);
      // Should have transitioned through RUNNING
      expect(result.transitions.some(t => t.to === 'RUNNING')).toBe(true);
    });

    it('executes all subversions for total_subversions=3', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 3 });

      const result = await scheduler.run(state);
      expect(result.completed_subversions).toHaveLength(3);
    });

    it('calls each phase exactly 3 times for 3 subversions', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 3 });

      await scheduler.run(state);

      expect(callbacks.prepare).toHaveBeenCalledTimes(3);
      expect(callbacks.execute).toHaveBeenCalledTimes(3);
      expect(callbacks.verify).toHaveBeenCalledTimes(3);
      expect(callbacks.journal).toHaveBeenCalledTimes(3);
    });

    it('calls phases in order: prepare, execute, verify, journal', async () => {
      const callOrder: string[] = [];
      const callbacks: SubversionCallbacks = {
        prepare: vi.fn(async () => { callOrder.push('prepare'); return { success: true }; }),
        execute: vi.fn(async () => { callOrder.push('execute'); return { success: true }; }),
        verify: vi.fn(async () => { callOrder.push('verify'); return { success: true }; }),
        journal: vi.fn(async () => { callOrder.push('journal'); return { success: true }; }),
      };
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      await scheduler.run(state);

      expect(callOrder).toEqual(['prepare', 'execute', 'verify', 'journal']);
    });

    it('passes correct subversion number to callbacks', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 3 });

      await scheduler.run(state);

      expect(callbacks.prepare).toHaveBeenNthCalledWith(1, 0);
      expect(callbacks.prepare).toHaveBeenNthCalledWith(2, 1);
      expect(callbacks.prepare).toHaveBeenNthCalledWith(3, 2);
    });
  });

  // =========================================================================
  // State transitions
  // =========================================================================
  describe('state transitions', () => {
    it('transitions to COMPLETING when all subversions done', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 2 });

      const result = await scheduler.run(state);
      expect(result.status).toBe('COMPLETING');
    });

    it('increments current_subversion after each subversion', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 3 });

      const result = await scheduler.run(state);
      expect(result.current_subversion).toBe(3);
    });

    it('sets current_phase to null after subversion completes', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      const result = await scheduler.run(state);
      expect(result.current_phase).toBeNull();
    });
  });

  // =========================================================================
  // SubversionRecord tracking
  // =========================================================================
  describe('SubversionRecord', () => {
    it('records SubversionRecord with correct subversion number', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 2 });

      const result = await scheduler.run(state);
      expect(result.completed_subversions[0].subversion).toBe(0);
      expect(result.completed_subversions[1].subversion).toBe(1);
    });

    it('records phase_results for each subversion', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      const result = await scheduler.run(state);
      const record = result.completed_subversions[0];
      expect(record.phase_results).toEqual({
        prepare: true,
        execute: true,
        verify: true,
        journal: true,
      });
    });

    it('records started_at and completed_at timestamps', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      const result = await scheduler.run(state);
      const record = result.completed_subversions[0];
      expect(record.started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(record.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('records artifacts from phase results', async () => {
      const callbacks: SubversionCallbacks = {
        prepare: vi.fn(async () => ({ success: true })),
        execute: vi.fn(async () => ({ success: true, artifacts: ['output.ts'] })),
        verify: vi.fn(async () => ({ success: true })),
        journal: vi.fn(async () => ({ success: true, artifacts: ['journal.md'] })),
      };
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      const result = await scheduler.run(state);
      const record = result.completed_subversions[0];
      expect(record.artifacts_produced).toContain('output.ts');
      expect(record.artifacts_produced).toContain('journal.md');
    });
  });

  // =========================================================================
  // Persistence
  // =========================================================================
  describe('persistence', () => {
    it('writes state to disk after each subversion', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 2 });

      await scheduler.run(state);

      // Read back from disk
      const persisted = await readExecutionState(statePath);
      expect(persisted.success).toBe(true);
      if (persisted.success) {
        expect(persisted.data.completed_subversions).toHaveLength(2);
      }
    });
  });

  // =========================================================================
  // Failure handling
  // =========================================================================
  describe('failure handling', () => {
    it('transitions to FAILED when verify phase fails', async () => {
      const callbacks = createFailingCallbacks('verify', 1);
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 3 });

      const result = await scheduler.run(state);
      expect(result.status).toBe('FAILED');
    });

    it('stops execution after failure', async () => {
      const callbacks = createFailingCallbacks('verify', 1);
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 3 });

      const result = await scheduler.run(state);
      // Only subversion 0 should complete (failure at subversion 1 during verify)
      expect(result.completed_subversions).toHaveLength(1);
    });

    it('sets last_error on failure', async () => {
      const callbacks = createFailingCallbacks('prepare', 0);
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      const result = await scheduler.run(state);
      expect(result.last_error).toBeTruthy();
      expect(result.last_error).toMatch(/prepare|failed/i);
    });

    it('persists failed state to disk', async () => {
      const callbacks = createFailingCallbacks('execute', 0);
      const scheduler = createScheduler({ statePath, callbacks });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      await scheduler.run(state);

      const persisted = await readExecutionState(statePath);
      expect(persisted.success).toBe(true);
      if (persisted.success) {
        expect(persisted.data.status).toBe('FAILED');
      }
    });
  });

  // =========================================================================
  // Resume support
  // =========================================================================
  describe('resume', () => {
    it('continues from current_subversion without re-transitioning for RUNNING state', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });

      // Simulate a RUNNING state at subversion 2 (already completed 0 and 1)
      let state = createExecutionState('v1.53', { total_subversions: 3 });
      state = transition(state, 'RUNNING', 'initial start');
      state = {
        ...state,
        current_subversion: 2,
        completed_subversions: [
          { subversion: 0, started_at: '', completed_at: '', phase_results: { prepare: true, execute: true, verify: true, journal: true } },
          { subversion: 1, started_at: '', completed_at: '', phase_results: { prepare: true, execute: true, verify: true, journal: true } },
        ],
      };

      const result = await scheduler.run(state);
      // Should only execute subversion 2
      expect(callbacks.prepare).toHaveBeenCalledTimes(1);
      expect(callbacks.prepare).toHaveBeenCalledWith(2);
      expect(result.completed_subversions).toHaveLength(3);
    });

    it('does not add duplicate INITIALIZED->RUNNING transition for already-RUNNING state', async () => {
      const callbacks = createSuccessCallbacks();
      const scheduler = createScheduler({ statePath, callbacks });

      let state = createExecutionState('v1.53', { total_subversions: 1 });
      state = transition(state, 'RUNNING', 'previous start');
      const transitionCountBefore = state.transitions.length;

      const result = await scheduler.run(state);
      // Should NOT have added another RUNNING transition at the start
      const runningTransitions = result.transitions.filter(t => t.from === 'INITIALIZED' && t.to === 'RUNNING');
      expect(runningTransitions).toHaveLength(1);
    });
  });

  // =========================================================================
  // onSubversionComplete hook
  // =========================================================================
  describe('onSubversionComplete', () => {
    it('calls onSubversionComplete after each subversion', async () => {
      const callbacks = createSuccessCallbacks();
      const onComplete = vi.fn(async () => {});
      const scheduler = createScheduler({
        statePath,
        callbacks,
        onSubversionComplete: onComplete,
      });
      const state = createExecutionState('v1.53', { total_subversions: 3 });

      await scheduler.run(state);
      expect(onComplete).toHaveBeenCalledTimes(3);
    });

    it('passes subversion number and current state to onSubversionComplete', async () => {
      const callbacks = createSuccessCallbacks();
      const onComplete = vi.fn(async () => {});
      const scheduler = createScheduler({
        statePath,
        callbacks,
        onSubversionComplete: onComplete,
      });
      const state = createExecutionState('v1.53', { total_subversions: 2 });

      await scheduler.run(state);

      // First call: subversion 0
      expect(onComplete.mock.calls[0][0]).toBe(0);
      expect(onComplete.mock.calls[0][1]).toHaveProperty('status', 'RUNNING');
      // Second call: subversion 1
      expect(onComplete.mock.calls[1][0]).toBe(1);
    });

    it('does not call onSubversionComplete for failed subversions', async () => {
      const callbacks = createFailingCallbacks('prepare', 0);
      const onComplete = vi.fn(async () => {});
      const scheduler = createScheduler({
        statePath,
        callbacks,
        onSubversionComplete: onComplete,
      });
      const state = createExecutionState('v1.53', { total_subversions: 1 });

      await scheduler.run(state);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
