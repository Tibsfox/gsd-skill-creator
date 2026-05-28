/**
 * Tests for Offload executor: child process execution with timeout,
 * output capture, environment variable passing, and signal integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { OffloadOperation } from './types.js';
import { executeOffloadOp, OffloadExecutor } from './executor.js';
import { SignalBus } from './signals.js';
import type { CompletionSignal } from './types.js';
import {
  ProcessContextDenied,
  CapturingProcessAuditSink,
  type ProcessContext,
} from '../../security/process-context.js';

describe('executeOffloadOp', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'offload-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('executes a successful bash script with stdout capture', async () => {
    const operation: OffloadOperation = {
      id: 'test:echo',
      script: '#!/bin/bash\necho "hello offload"\nexit 0',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeOffloadOp(operation);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello offload');
    expect(result.stderr).toBe('');
    expect(result.timedOut).toBe(false);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.operationId).toBe('test:echo');
  });

  it('captures stderr and nonzero exit code from failing script', async () => {
    const operation: OffloadOperation = {
      id: 'test:fail',
      script: '#!/bin/bash\necho "error output" >&2\nexit 42',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeOffloadOp(operation);

    expect(result.exitCode).toBe(42);
    expect(result.stderr).toContain('error output');
    expect(result.timedOut).toBe(false);
  });

  it.skipIf(process.platform === 'win32')('kills scripts that exceed timeout and reports timed-out status', async () => {
    const operation: OffloadOperation = {
      id: 'test:timeout',
      script: '#!/bin/bash\nsleep 10',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 500,
      env: {},
    };

    const result = await executeOffloadOp(operation);

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).not.toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(400);
    expect(result.durationMs).toBeLessThan(5000);
  }, 10000);

  it('passes environment variables from operation to child process', async () => {
    const operation: OffloadOperation = {
      id: 'test:env',
      script: '#!/bin/bash\necho "$MY_VAR"',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: { MY_VAR: 'offload-test-value' },
    };

    const result = await executeOffloadOp(operation);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('offload-test-value');
  });

  it('executes node scripts via node interpreter', async () => {
    const operation: OffloadOperation = {
      id: 'test:node',
      script: 'console.log("node offload");',
      scriptType: 'node',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeOffloadOp(operation);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('node offload');
  });

  it('captures both stdout and stderr from same script', async () => {
    const operation: OffloadOperation = {
      id: 'test:both-streams',
      script: '#!/bin/bash\necho "out"\necho "err" >&2\nexit 0',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 10000,
      env: {},
    };

    const result = await executeOffloadOp(operation);

    expect(result.stdout).toContain('out');
    expect(result.stderr).toContain('err');
    expect(result.exitCode).toBe(0);
  });
});

describe('OffloadExecutor', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'offload-exec-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('execute method returns OffloadResult shape', async () => {
    const executor = new OffloadExecutor();
    const operation: OffloadOperation = {
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
    const bus = new SignalBus();
    const received: CompletionSignal[] = [];
    bus.on('completion', (signal) => received.push(signal));

    const executor = new OffloadExecutor(bus);
    const operation: OffloadOperation = {
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
    const bus = new SignalBus();
    const received: CompletionSignal[] = [];
    bus.on('completion', (signal) => received.push(signal));

    const executor = new OffloadExecutor(bus);
    const operation: OffloadOperation = {
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

  it.skipIf(process.platform === 'win32')('emits completion signal with timeout status', async () => {
    const bus = new SignalBus();
    const received: CompletionSignal[] = [];
    bus.on('completion', (signal) => received.push(signal));

    const executor = new OffloadExecutor(bus);
    const operation: OffloadOperation = {
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

describe('ProcessContext wire (v1.49.859)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'offload-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('throws ProcessContextDenied when ctx denies the interpreter spawn', async () => {
    // Security wire v1.49.859: hoisted ensureProcessAllowed throws BEFORE
    // the spawn happens. The empty allowList rejects the bash interpreter;
    // the rejection propagates through the async-function throw machinery.
    const sink = new CapturingProcessAuditSink();
    const restrictiveCtx: ProcessContext = { allowList: [], audit: sink };
    const operation: OffloadOperation = {
      id: 'test:denied',
      script: 'echo never-runs',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 5000,
      env: {},
    };
    await expect(executeOffloadOp(operation, restrictiveCtx)).rejects.toThrow(
      ProcessContextDenied,
    );
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.target).toBe('bash');
    expect(sink.records[0]?.allowed).toBe(false);
  });

  it('executes when ctx allows the interpreter', async () => {
    const sink = new CapturingProcessAuditSink();
    const permissiveCtx: ProcessContext = { allowList: ['bash'], audit: sink };
    const operation: OffloadOperation = {
      id: 'test:allowed',
      script: '#!/bin/bash\necho ok',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 5000,
      env: {},
    };
    const result = await executeOffloadOp(operation, permissiveCtx);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.allowed).toBe(true);
  });

  it('propagates ProcessContextDenied through OffloadExecutor.execute', async () => {
    const executor = new OffloadExecutor();
    const sink = new CapturingProcessAuditSink();
    const restrictiveCtx: ProcessContext = { allowList: [], audit: sink };
    const operation: OffloadOperation = {
      id: 'test:wrapper-denied',
      script: 'echo never-runs',
      scriptType: 'bash',
      workingDir: tempDir,
      timeout: 5000,
      env: {},
    };
    await expect(executor.execute(operation, restrictiveCtx)).rejects.toThrow(
      ProcessContextDenied,
    );
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.allowed).toBe(false);
  });
});
