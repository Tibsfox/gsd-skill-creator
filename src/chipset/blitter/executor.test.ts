/**
 * Tests for Blitter executor: child process execution with timeout,
 * output capture, environment variable passing, and signal integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { BlitterOperation } from './types.js';
import { executeBlitterOp, BlitterExecutor } from './executor.js';
import { BlitterSignalBus } from './signals.js';
import type { CompletionSignal } from './types.js';

describe('executeBlitterOp', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'blitter-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('executes a successful bash script with stdout capture', async () => {
    const operation: BlitterOperation = {
      id: 'test:echo',
      script: '#!/bin/bash\necho "hello blitter"\nexit 0',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeBlitterOp(operation);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello blitter');
    expect(result.stderr).toBe('');
    expect(result.timedOut).toBe(false);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.operationId).toBe('test:echo');
  });

  it('captures stderr and nonzero exit code from failing script', async () => {
    const operation: BlitterOperation = {
      id: 'test:fail',
      script: '#!/bin/bash\necho "error output" >&2\nexit 42',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeBlitterOp(operation);

    expect(result.exitCode).toBe(42);
    expect(result.stderr).toContain('error output');
    expect(result.timedOut).toBe(false);
  });

  it('kills scripts that exceed timeout and reports timed-out status', async () => {
    const operation: BlitterOperation = {
      id: 'test:timeout',
      script: '#!/bin/bash\nsleep 10',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 500,
      env: {},
    };

    const result = await executeBlitterOp(operation);

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).not.toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(400);
    expect(result.durationMs).toBeLessThan(5000);
  }, 10000);

  it('passes environment variables from operation to child process', async () => {
    const operation: BlitterOperation = {
      id: 'test:env',
      script: '#!/bin/bash\necho "$MY_VAR"',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: { MY_VAR: 'blitter-test-value' },
    };

    const result = await executeBlitterOp(operation);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('blitter-test-value');
  });

  it('executes node scripts via node interpreter', async () => {
    const operation: BlitterOperation = {
      id: 'test:node',
      script: 'console.log("node blitter");',
      scriptType: 'node',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeBlitterOp(operation);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('node blitter');
  });

  it('captures both stdout and stderr from same script', async () => {
    const operation: BlitterOperation = {
      id: 'test:both-streams',
      script: '#!/bin/bash\necho "out"\necho "err" >&2\nexit 0',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeBlitterOp(operation);

    expect(result.stdout).toContain('out');
    expect(result.stderr).toContain('err');
    expect(result.exitCode).toBe(0);
  });
});

describe('BlitterExecutor', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'blitter-exec-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('execute method returns BlitterResult shape', async () => {
    const executor = new BlitterExecutor();
    const operation: BlitterOperation = {
      id: 'test:class-exec',
      script: '#!/bin/bash\necho "class test"',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executor.execute(operation);

    expect(result).toHaveProperty('operationId', 'test:class-exec');
    expect(result).toHaveProperty('exitCode', 0);
    expect(result).toHaveProperty('stdout');
    expect(result).toHaveProperty('stderr');
    expect(result).toHaveProperty('durationMs');
    expect(result).toHaveProperty('timedOut', false);
  });

  it('emits completion signal to bus on success', async () => {
    const bus = new BlitterSignalBus();
    const received: CompletionSignal[] = [];
    bus.on('completion', (signal) => received.push(signal));

    const executor = new BlitterExecutor(bus);
    const operation: BlitterOperation = {
      id: 'test:signal-success',
      script: '#!/bin/bash\necho "ok"\nexit 0',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    await executor.execute(operation);

    expect(received).toHaveLength(1);
    expect(received[0].status).toBe('success');
    expect(received[0].operationId).toBe('test:signal-success');
  });

  it('emits completion signal with failure status', async () => {
    const bus = new BlitterSignalBus();
    const received: CompletionSignal[] = [];
    bus.on('completion', (signal) => received.push(signal));

    const executor = new BlitterExecutor(bus);
    const operation: BlitterOperation = {
      id: 'test:signal-fail',
      script: '#!/bin/bash\nexit 1',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    await executor.execute(operation);

    expect(received).toHaveLength(1);
    expect(received[0].status).toBe('failure');
  });

  it('emits completion signal with timeout status', async () => {
    const bus = new BlitterSignalBus();
    const received: CompletionSignal[] = [];
    bus.on('completion', (signal) => received.push(signal));

    const executor = new BlitterExecutor(bus);
    const operation: BlitterOperation = {
      id: 'test:signal-timeout',
      script: '#!/bin/bash\nsleep 10',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 500,
      env: {},
    };

    await executor.execute(operation);

    expect(received).toHaveLength(1);
    expect(received[0].status).toBe('timeout');
  }, 10000);
});
