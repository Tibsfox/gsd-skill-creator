/**
 * Tests for WorkflowRunner step-by-step executor.
 *
 * Covers:
 * - start() creates run with topological execution order
 * - start() writes initial WorkState.workflow
 * - resume() returns null when no workflow in WorkState
 * - resume() reads completed steps from JSONL (not just WorkState)
 * - resume() skips already-completed steps
 * - completeStep() appends to JSONL and updates WorkState
 * - completeStep() clears WorkState.workflow when all steps done
 * - failStep() appends to JSONL but keeps WorkState.workflow
 * - getStatus() returns correct completed/remaining/current
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowRunner } from './workflow-runner.js';
import type { WorkflowRunnerDeps } from './workflow-runner.js';
import type { WorkflowDefinition } from './types.js';
import type { WorkflowRunEntry } from './types.js';
import type { WorkState } from '../orchestrator/work-state/types.js';

// ============================================================================
// Mock helpers
// ============================================================================

function makeWorkflow(
  name: string,
  steps: WorkflowDefinition['steps'],
  extendsName: string | null = null,
): WorkflowDefinition {
  return { name, version: 1, extends: extendsName, steps };
}

function makeMockDeps(overrides: Partial<WorkflowRunnerDeps> = {}): WorkflowRunnerDeps {
  return {
    runStore: {
      append: vi.fn().mockResolvedValue(undefined),
      readAll: vi.fn().mockResolvedValue([]),
      getRunEntries: vi.fn().mockResolvedValue([]),
      getLatestRun: vi.fn().mockResolvedValue(null),
      getCompletedSteps: vi.fn().mockResolvedValue([]),
    } as any,
    workStateReader: {
      read: vi.fn().mockResolvedValue(null),
    } as any,
    workStateWriter: {
      save: vi.fn().mockResolvedValue(undefined),
    } as any,
    skillExists: vi.fn().mockResolvedValue(true),
    loadWorkflow: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

const linearWorkflow = makeWorkflow('deploy-flow', [
  { id: 'lint', skill: 'linter', needs: [] },
  { id: 'test', skill: 'tester', needs: ['lint'] },
  { id: 'deploy', skill: 'deployer', needs: ['test'] },
]);

// ============================================================================
// start()
// ============================================================================

describe('WorkflowRunner - start', () => {
  it('creates run with topological execution order', async () => {
    const deps = makeMockDeps({
      loadWorkflow: vi.fn().mockResolvedValue(linearWorkflow),
    });
    const runner = new WorkflowRunner(deps);

    const result = await runner.start('deploy-flow');
    expect(result.runId).toBeTruthy();
    expect(result.steps).toEqual(['lint', 'test', 'deploy']);
  });

  it('writes initial WorkState.workflow', async () => {
    const deps = makeMockDeps({
      loadWorkflow: vi.fn().mockResolvedValue(linearWorkflow),
    });
    const runner = new WorkflowRunner(deps);

    await runner.start('deploy-flow');

    expect(deps.workStateWriter.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: {
          name: 'deploy-flow',
          current_step: 'lint',
          completed_steps: [],
        },
      }),
    );
  });
});

// ============================================================================
// resume()
// ============================================================================

describe('WorkflowRunner - resume', () => {
  it('returns null when no workflow in WorkState', async () => {
    const deps = makeMockDeps();
    const runner = new WorkflowRunner(deps);

    const result = await runner.resume();
    expect(result).toBeNull();
  });

  it('reads completed steps from JSONL (not just WorkState)', async () => {
    const workState: WorkState = {
      version: 1,
      session_id: 'sess-1',
      saved_at: '2026-01-01T00:00:00Z',
      active_task: null,
      checkpoint: null,
      loaded_skills: [],
      queued_tasks: [],
      workflow: {
        name: 'deploy-flow',
        current_step: 'test',
        completed_steps: ['lint'],
      },
    };

    const deps = makeMockDeps({
      workStateReader: { read: vi.fn().mockResolvedValue(workState) } as any,
      loadWorkflow: vi.fn().mockResolvedValue(linearWorkflow),
      runStore: {
        append: vi.fn(),
        readAll: vi.fn(),
        getRunEntries: vi.fn(),
        // JSONL says lint AND test are completed (more granular than WorkState)
        getCompletedSteps: vi.fn().mockResolvedValue(['lint', 'test']),
        getLatestRun: vi.fn().mockResolvedValue({
          runId: 'run-abc',
          entries: [],
        }),
      } as any,
    });

    const runner = new WorkflowRunner(deps);
    const result = await runner.resume();

    expect(result).not.toBeNull();
    expect(result!.remainingSteps).toEqual(['deploy']);
    expect(result!.runId).toBe('run-abc');
  });

  it('skips already-completed steps', async () => {
    const workState: WorkState = {
      version: 1,
      session_id: 'sess-1',
      saved_at: '2026-01-01T00:00:00Z',
      active_task: null,
      checkpoint: null,
      loaded_skills: [],
      queued_tasks: [],
      workflow: {
        name: 'deploy-flow',
        current_step: 'deploy',
        completed_steps: ['lint', 'test'],
      },
    };

    const deps = makeMockDeps({
      workStateReader: { read: vi.fn().mockResolvedValue(workState) } as any,
      loadWorkflow: vi.fn().mockResolvedValue(linearWorkflow),
      runStore: {
        append: vi.fn(),
        readAll: vi.fn(),
        getRunEntries: vi.fn(),
        getCompletedSteps: vi.fn().mockResolvedValue(['lint', 'test']),
        getLatestRun: vi.fn().mockResolvedValue({
          runId: 'run-xyz',
          entries: [],
        }),
      } as any,
    });

    const runner = new WorkflowRunner(deps);
    const result = await runner.resume();

    expect(result!.remainingSteps).toEqual(['deploy']);
  });
});

// ============================================================================
// completeStep()
// ============================================================================

describe('WorkflowRunner - completeStep', () => {
  it('appends to JSONL and updates WorkState', async () => {
    const workState: WorkState = {
      version: 1,
      session_id: 'sess-1',
      saved_at: '2026-01-01T00:00:00Z',
      active_task: null,
      checkpoint: null,
      loaded_skills: [],
      queued_tasks: [],
      workflow: {
        name: 'deploy-flow',
        current_step: 'lint',
        completed_steps: [],
      },
    };

    const deps = makeMockDeps({
      workStateReader: { read: vi.fn().mockResolvedValue(workState) } as any,
      loadWorkflow: vi.fn().mockResolvedValue(linearWorkflow),
    });

    const runner = new WorkflowRunner(deps);
    await runner.completeStep('run-1', 'lint');

    // Should append completed entry
    expect(deps.runStore.append).toHaveBeenCalledWith(
      expect.objectContaining({
        run_id: 'run-1',
        step_id: 'lint',
        status: 'completed',
      }),
    );

    // Should update WorkState
    expect(deps.workStateWriter.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: expect.objectContaining({
          completed_steps: ['lint'],
          current_step: 'test',
        }),
      }),
    );
  });

  it('clears WorkState.workflow when all steps done', async () => {
    const workState: WorkState = {
      version: 1,
      session_id: 'sess-1',
      saved_at: '2026-01-01T00:00:00Z',
      active_task: null,
      checkpoint: null,
      loaded_skills: [],
      queued_tasks: [],
      workflow: {
        name: 'deploy-flow',
        current_step: 'deploy',
        completed_steps: ['lint', 'test'],
      },
    };

    const deps = makeMockDeps({
      workStateReader: { read: vi.fn().mockResolvedValue(workState) } as any,
      loadWorkflow: vi.fn().mockResolvedValue(linearWorkflow),
    });

    const runner = new WorkflowRunner(deps);
    await runner.completeStep('run-1', 'deploy');

    // Workflow is done, should set workflow to null
    expect(deps.workStateWriter.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workflow: null,
      }),
    );
  });
});

// ============================================================================
// failStep()
// ============================================================================

describe('WorkflowRunner - failStep', () => {
  it('appends to JSONL but keeps WorkState.workflow', async () => {
    const workState: WorkState = {
      version: 1,
      session_id: 'sess-1',
      saved_at: '2026-01-01T00:00:00Z',
      active_task: null,
      checkpoint: null,
      loaded_skills: [],
      queued_tasks: [],
      workflow: {
        name: 'deploy-flow',
        current_step: 'test',
        completed_steps: ['lint'],
      },
    };

    const deps = makeMockDeps({
      workStateReader: { read: vi.fn().mockResolvedValue(workState) } as any,
    });

    const runner = new WorkflowRunner(deps);
    await runner.failStep('run-1', 'test', 'test suite failed');

    // Should append failed entry
    expect(deps.runStore.append).toHaveBeenCalledWith(
      expect.objectContaining({
        run_id: 'run-1',
        step_id: 'test',
        status: 'failed',
        error: 'test suite failed',
      }),
    );

    // Should NOT clear workflow (keeps it for retry)
    expect(deps.workStateWriter.save).not.toHaveBeenCalled();
  });
});

// ============================================================================
// getStatus()
// ============================================================================

describe('WorkflowRunner - getStatus', () => {
  it('returns correct completed/remaining/current', async () => {
    const deps = makeMockDeps({
      loadWorkflow: vi.fn().mockResolvedValue(linearWorkflow),
      runStore: {
        append: vi.fn(),
        readAll: vi.fn().mockResolvedValue([
          { run_id: 'run-1', workflow_name: 'deploy-flow', step_id: 'lint', status: 'completed', started_at: '', completed_at: '', error: null },
          { run_id: 'run-1', workflow_name: 'deploy-flow', step_id: 'test', status: 'started', started_at: '', completed_at: null, error: null },
        ] satisfies WorkflowRunEntry[]),
        getRunEntries: vi.fn().mockImplementation(async (runId: string) => {
          return [
            { run_id: 'run-1', workflow_name: 'deploy-flow', step_id: 'lint', status: 'completed', started_at: '', completed_at: '', error: null },
            { run_id: 'run-1', workflow_name: 'deploy-flow', step_id: 'test', status: 'started', started_at: '', completed_at: null, error: null },
          ].filter(e => e.run_id === runId);
        }),
        getCompletedSteps: vi.fn().mockResolvedValue(['lint']),
        getLatestRun: vi.fn().mockResolvedValue({
          runId: 'run-1',
          entries: [],
        }),
      } as any,
      workStateReader: {
        read: vi.fn().mockResolvedValue({
          version: 1,
          session_id: null,
          saved_at: '',
          active_task: null,
          checkpoint: null,
          loaded_skills: [],
          queued_tasks: [],
          workflow: { name: 'deploy-flow', current_step: 'test', completed_steps: ['lint'] },
        }),
      } as any,
    });

    const runner = new WorkflowRunner(deps);
    const status = await runner.getStatus('run-1');

    expect(status.completed).toEqual(['lint']);
    expect(status.remaining).toEqual(['test', 'deploy']);
    expect(status.current).toBe('test');
  });
});
