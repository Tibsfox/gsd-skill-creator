/**
 * Tests for the Pipeline executor.
 *
 * Verifies sequential execution of WAIT/MOVE/SKIP instructions:
 * WAIT blocks until lifecycle events fire, SKIP evaluates conditions
 * against filesystem/env/runtime vars, MOVE dispatches to activation handler.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LifecycleSync } from './lifecycle-sync.js';
import { PipelineExecutor } from './executor.js';
import type { Pipeline, MoveInstruction, SkipCondition } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal Pipeline from instructions. */
function makeList(instructions: Pipeline['instructions']): Pipeline {
  return {
    metadata: { name: 'test-list', priority: 50, confidence: 1, version: 1 },
    instructions,
  };
}

/** Create a MOVE instruction with defaults. */
function move(name: string): MoveInstruction {
  return { type: 'move', target: 'skill', name, mode: 'lite' };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PipelineExecutor', () => {
  // Track env var modifications so we can clean up
  const envVarsSet: string[] = [];
  afterEach(() => {
    for (const key of envVarsSet) {
      delete process.env[key];
    }
    envVarsSet.length = 0;
  });

  it('executes a list with only a MOVE instruction', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    const list = makeList([move('git-commit')]);
    const result = await executor.run(list);

    expect(result.executed).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.waited).toBe(0);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ name: 'git-commit' }));
  });

  it('WAIT blocks until lifecycle event fires', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    const list = makeList([
      { type: 'wait', event: 'phase-start' as const },
      move('git-commit'),
    ]);

    // Start execution (do NOT await yet)
    const runPromise = executor.run(list);

    // Emit the event after a short delay
    setTimeout(() => sync.emit('phase-start'), 50);

    const result = await runPromise;
    expect(result.waited).toBe(1);
    expect(result.executed).toBe(2); // WAIT + MOVE both count as executed
    expect(handler).toHaveBeenCalledOnce();
  });

  it('WAIT with timeout aborts execution if event never fires', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    const list = makeList([
      { type: 'wait', event: 'phase-start' as const, timeout: 0.2 }, // 0.2 seconds = 200ms
    ]);

    const result = await executor.run(list);
    expect(result.status).toBe('timeout');
  });

  it('SKIP with true condition skips next instruction', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const condEval = vi.fn().mockResolvedValue(true);
    const executor = new PipelineExecutor({
      lifecycleSync: sync,
      activationHandler: handler,
      conditionEvaluator: condEval,
    });

    const list = makeList([
      { type: 'skip', condition: { left: 'file:test', op: 'exists' as const } },
      move('skill-1'),
      move('skill-2'),
    ]);

    const result = await executor.run(list);
    expect(result.skipped).toBe(1); // skill-1 was skipped
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ name: 'skill-2' }));
  });

  it('SKIP with false condition does not skip', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const condEval = vi.fn().mockResolvedValue(false);
    const executor = new PipelineExecutor({
      lifecycleSync: sync,
      activationHandler: handler,
      conditionEvaluator: condEval,
    });

    const list = makeList([
      { type: 'skip', condition: { left: 'file:test', op: 'exists' as const } },
      move('skill-1'),
      move('skill-2'),
    ]);

    const result = await executor.run(list);
    expect(result.skipped).toBe(0);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('SKIP at end of list (nothing to skip) does not error', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const condEval = vi.fn().mockResolvedValue(true);
    const executor = new PipelineExecutor({
      lifecycleSync: sync,
      activationHandler: handler,
      conditionEvaluator: condEval,
    });

    const list = makeList([
      move('skill-1'),
      { type: 'skip', condition: { left: 'file:test', op: 'exists' as const } },
    ]);

    const result = await executor.run(list);
    expect(result.skipped).toBe(0); // Nothing after SKIP to skip
    expect(result.status).toBe('completed');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('multiple WAITs and MOVEs execute sequentially', async () => {
    const sync = new LifecycleSync();
    const callOrder: string[] = [];
    const handler = vi.fn().mockImplementation(async (instr: MoveInstruction) => {
      callOrder.push(instr.name);
    });
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    const list = makeList([
      { type: 'wait', event: 'phase-start' as const },
      move('skill-1'),
      { type: 'wait', event: 'tests-passing' as const },
      move('skill-2'),
    ]);

    const runPromise = executor.run(list);

    // Emit events sequentially with delays
    setTimeout(() => sync.emit('phase-start'), 30);
    setTimeout(() => sync.emit('tests-passing'), 80);

    const result = await runPromise;
    expect(result.waited).toBe(2);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(callOrder).toEqual(['skill-1', 'skill-2']);
  });

  it('built-in condition evaluator: file:path exists check', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    // Create a temp file
    const tmpFile = join(tmpdir(), `test-pipeline-exists-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await writeFile(tmpFile, 'test');

    try {
      const list = makeList([
        { type: 'skip', condition: { left: `file:${tmpFile}`, op: 'exists' as const } },
        move('skill-1'),
      ]);

      const result = await executor.run(list);
      expect(result.skipped).toBe(1); // File exists, condition true, next instruction skipped
      expect(handler).not.toHaveBeenCalled();
    } finally {
      await unlink(tmpFile).catch(() => {});
    }
  });

  it('built-in condition evaluator: file:path not-exists check', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    const list = makeList([
      { type: 'skip', condition: { left: 'file:/tmp/nonexistent-pipeline-9999999', op: 'not-exists' as const } },
      move('skill-1'),
    ]);

    const result = await executor.run(list);
    expect(result.skipped).toBe(1); // File does not exist, not-exists is true
    expect(handler).not.toHaveBeenCalled();
  });

  it('built-in condition evaluator: env:VAR equals check', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    process.env.PIPELINE_TEST_VAR = 'hello';
    envVarsSet.push('PIPELINE_TEST_VAR');

    const list = makeList([
      { type: 'skip', condition: { left: 'env:PIPELINE_TEST_VAR', op: 'equals' as const, right: 'hello' } },
      move('skill-1'),
    ]);

    const result = await executor.run(list);
    expect(result.skipped).toBe(1); // env var equals right operand
    expect(handler).not.toHaveBeenCalled();
  });

  it('built-in condition evaluator: env:VAR not-equals check', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({ lifecycleSync: sync, activationHandler: handler });

    process.env.PIPELINE_TEST_VAR = 'hello';
    envVarsSet.push('PIPELINE_TEST_VAR');

    const list = makeList([
      { type: 'skip', condition: { left: 'env:PIPELINE_TEST_VAR', op: 'not-equals' as const, right: 'world' } },
      move('skill-1'),
    ]);

    const result = await executor.run(list);
    expect(result.skipped).toBe(1); // hello !== world, not-equals is true
    expect(handler).not.toHaveBeenCalled();
  });

  it('built-in condition evaluator: var: runtime variables check', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const executor = new PipelineExecutor({
      lifecycleSync: sync,
      activationHandler: handler,
      runtimeVars: { phase: 'testing' },
    });

    const list = makeList([
      { type: 'skip', condition: { left: 'var:phase', op: 'equals' as const, right: 'testing' } },
      move('skill-1'),
    ]);

    const result = await executor.run(list);
    expect(result.skipped).toBe(1); // var:phase equals testing
    expect(handler).not.toHaveBeenCalled();
  });

  it('run() returns PipelineExecutionResult with full stats', async () => {
    const sync = new LifecycleSync();
    const handler = vi.fn().mockResolvedValue(undefined);
    const condEval = vi.fn().mockResolvedValue(true);
    const executor = new PipelineExecutor({
      lifecycleSync: sync,
      activationHandler: handler,
      conditionEvaluator: condEval,
    });

    const list = makeList([
      { type: 'wait', event: 'phase-start' as const },
      { type: 'skip', condition: { left: 'file:test', op: 'exists' as const } },
      move('skill-1'),
      move('skill-2'),
    ]);

    // Emit the event immediately so WAIT resolves
    setTimeout(() => sync.emit('phase-start'), 10);

    const result = await executor.run(list);
    expect(result).toMatchObject({
      status: 'completed',
      waited: 1,
      skipped: 1,       // SKIP true skips skill-1
      instructionCount: 4,
    });
    expect(result.executed).toBeGreaterThanOrEqual(2); // WAIT + SKIP at minimum
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.durationMs).toBe('number');
  });
});
