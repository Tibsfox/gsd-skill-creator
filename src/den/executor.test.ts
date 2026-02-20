/**
 * TDD tests for the Executor agent.
 *
 * Tests Zod schemas, stateless functions, class wrapper, and factory.
 * Follows the coordinator.test.ts pattern with temp directory isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ExecutorConfigSchema,
  ExecutionContextSchema,
  ArtifactHandoffSchema,
  ProgressReportSchema,
  ExecutorEntrySchema,
  loadExecutionContext,
  reportProgress,
  handoffToVerifier,
  reportBlocker,
  appendExecutorEntry,
  readExecutorLog,
  Executor,
  createExecutor,
} from './executor.js';
import type { BusConfig } from './types.js';
import { initBus } from './bus.js';

// ============================================================================
// Fixtures
// ============================================================================

let tempDir: string;
let busDir: string;
let logPath: string;
let busConfig: BusConfig;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'den-executor-'));
  busDir = join(tempDir, 'bus');
  logPath = join(tempDir, 'logs', 'executor.jsonl');
  busConfig = {
    busDir,
    maxQueueDepth: 100,
    deliveryTimeoutMs: 5000,
    deadLetterRetentionDays: 3,
    archiveMaxMessages: 100,
    archiveMaxAgeDays: 7,
  };
  await initBus(busConfig);
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// ============================================================================
// Schema validation tests
// ============================================================================

describe('ExecutorConfigSchema', () => {
  it('parses valid config', () => {
    const config = ExecutorConfigSchema.parse({
      busConfig,
      logPath: '/tmp/executor.jsonl',
      agentId: 'executor',
    });
    expect(config.agentId).toBe('executor');
    expect(config.logPath).toBe('/tmp/executor.jsonl');
  });

  it('applies defaults for logPath and agentId', () => {
    const config = ExecutorConfigSchema.parse({ busConfig });
    expect(config.logPath).toBe('.planning/den/logs/executor.jsonl');
    expect(config.agentId).toBe('executor');
  });

  it('accepts config without busConfig (z.any pattern)', () => {
    // busConfig uses z.any() per coordinator.ts pattern -- no rejection on missing
    const config = ExecutorConfigSchema.parse({});
    expect(config.logPath).toBe('.planning/den/logs/executor.jsonl');
    expect(config.agentId).toBe('executor');
  });
});

describe('ExecutionContextSchema', () => {
  it('parses valid running context', () => {
    const ctx = ExecutionContextSchema.parse({
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: [],
      gitSha: null,
      tokensUsed: 0,
      status: 'running',
    });
    expect(ctx.status).toBe('running');
    expect(ctx.artifacts).toEqual([]);
    expect(ctx.gitSha).toBeNull();
  });

  it('parses valid complete context', () => {
    const ctx = ExecutionContextSchema.parse({
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: ['src/foo.ts', 'src/bar.ts'],
      gitSha: 'abc123f',
      tokensUsed: 15000,
      status: 'complete',
    });
    expect(ctx.status).toBe('complete');
    expect(ctx.artifacts).toHaveLength(2);
    expect(ctx.gitSha).toBe('abc123f');
  });

  it('rejects invalid status', () => {
    expect(() => ExecutionContextSchema.parse({
      phase: 'x', plan: 'y', artifacts: [], gitSha: null, tokensUsed: 0, status: 'invalid',
    })).toThrow();
  });

  it('rejects negative tokensUsed', () => {
    expect(() => ExecutionContextSchema.parse({
      phase: 'x', plan: 'y', artifacts: [], gitSha: null, tokensUsed: -1, status: 'running',
    })).toThrow();
  });
});

describe('ArtifactHandoffSchema', () => {
  it('parses valid handoff', () => {
    const handoff = ArtifactHandoffSchema.parse({
      artifacts: ['src/foo.ts'],
      gitSha: 'abc123f',
      phase: 'execute-7',
      plan: 'plan-003',
    });
    expect(handoff.gitSha).toBe('abc123f');
  });

  it('rejects empty gitSha', () => {
    expect(() => ArtifactHandoffSchema.parse({
      artifacts: [], gitSha: '', phase: 'x', plan: 'y',
    })).toThrow();
  });
});

describe('ProgressReportSchema', () => {
  it('parses valid progress report', () => {
    const report = ProgressReportSchema.parse({
      phase: 'execute-7',
      plan: 'plan-003',
      status: 'complete',
      artifacts: ['src/foo.ts'],
      gitSha: 'abc123f',
      tokensUsed: 15000,
      blockers: [],
    });
    expect(report.status).toBe('complete');
  });

  it('parses blocked report with blockers list', () => {
    const report = ProgressReportSchema.parse({
      phase: 'execute-7',
      plan: 'plan-003',
      status: 'blocked',
      artifacts: [],
      gitSha: null,
      tokensUsed: 5000,
      blockers: ['missing dependency'],
    });
    expect(report.blockers).toHaveLength(1);
  });

  it('rejects invalid status value', () => {
    expect(() => ProgressReportSchema.parse({
      phase: 'x', plan: 'y', status: 'running', artifacts: [], gitSha: null, tokensUsed: 0, blockers: [],
    })).toThrow();
  });
});

describe('ExecutorEntrySchema', () => {
  it('parses valid entry', () => {
    const entry = ExecutorEntrySchema.parse({
      timestamp: '20260220-134500',
      type: 'execution-start',
      phase: 'execute-7',
      plan: 'plan-003',
      detail: { task: 'init' },
    });
    expect(entry.type).toBe('execution-start');
  });

  it('rejects invalid type', () => {
    expect(() => ExecutorEntrySchema.parse({
      timestamp: '20260220-134500',
      type: 'invalid-type',
      phase: 'x',
      plan: 'y',
      detail: {},
    })).toThrow();
  });

  it('accepts all valid entry types', () => {
    const types = ['execution-start', 'progress', 'handoff', 'blocker', 'execution-complete'] as const;
    for (const type of types) {
      const entry = ExecutorEntrySchema.parse({
        timestamp: '20260220-134500',
        type,
        phase: 'execute-7',
        plan: 'plan-003',
        detail: {},
      });
      expect(entry.type).toBe(type);
    }
  });
});

// ============================================================================
// Stateless function tests
// ============================================================================

describe('loadExecutionContext', () => {
  it('creates running context with empty artifacts and null gitSha', () => {
    const ctx = loadExecutionContext('execute-7', 'plan-003');
    expect(ctx).toEqual({
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: [],
      gitSha: null,
      tokensUsed: 0,
      status: 'running',
    });
  });

  it('returns schema-valid context', () => {
    const ctx = loadExecutionContext('phase-1', 'plan-001');
    expect(() => ExecutionContextSchema.parse(ctx)).not.toThrow();
  });
});

describe('reportProgress', () => {
  it('sends STATUS message to coordinator via bus', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    const ctx = loadExecutionContext('execute-7', 'plan-003');
    const result = await reportProgress(config, ctx);

    // Returns the context as-is
    expect(result).toEqual(ctx);

    // Verify STATUS message was sent to priority-6 directory
    const p6Dir = join(busDir, 'priority-6');
    const files = await readdir(p6Dir);
    const statusFiles = files.filter(f => f.includes('STATUS') && f.includes('executor') && f.includes('coordinator'));
    expect(statusFiles.length).toBe(1);
  });

  it('sends progress payload with correct fields', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    const ctx = {
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: ['src/foo.ts'],
      gitSha: 'abc123f',
      tokensUsed: 15000,
      status: 'complete' as const,
    };
    await reportProgress(config, ctx);

    const p6Dir = join(busDir, 'priority-6');
    const files = await readdir(p6Dir);
    const content = await readFile(join(p6Dir, files[0]), 'utf-8');
    expect(content).toContain('PHASE:execute-7');
    expect(content).toContain('PLAN:plan-003');
    expect(content).toContain('STATUS:complete');
  });
});

describe('handoffToVerifier', () => {
  it('sends MOV message to verifier with artifacts and gitSha', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    const ctx = {
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: ['src/foo.ts', 'src/bar.ts'],
      gitSha: 'abc123f',
      tokensUsed: 15000,
      status: 'complete' as const,
    };

    const handoff = await handoffToVerifier(config, ctx);
    expect(handoff.artifacts).toEqual(['src/foo.ts', 'src/bar.ts']);
    expect(handoff.gitSha).toBe('abc123f');
    expect(handoff.phase).toBe('execute-7');
    expect(handoff.plan).toBe('plan-003');

    // Verify MOV message in priority-4 directory
    const p4Dir = join(busDir, 'priority-4');
    const files = await readdir(p4Dir);
    const movFiles = files.filter(f => f.includes('MOV') && f.includes('executor') && f.includes('verifier'));
    expect(movFiles.length).toBe(1);
  });

  it('throws when context status is not complete', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    const ctx = loadExecutionContext('execute-7', 'plan-003'); // status: 'running'

    await expect(handoffToVerifier(config, ctx))
      .rejects.toThrow(/status must be 'complete'/);
  });

  it('throws when gitSha is null', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    const ctx = {
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: ['src/foo.ts'],
      gitSha: null,
      tokensUsed: 15000,
      status: 'complete' as const,
    };

    await expect(handoffToVerifier(config, ctx))
      .rejects.toThrow(/gitSha.*required/);
  });

  it('includes artifact list in MOV payload', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    const ctx = {
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: ['src/foo.ts', 'src/bar.ts'],
      gitSha: 'deadbeef',
      tokensUsed: 30000,
      status: 'complete' as const,
    };

    await handoffToVerifier(config, ctx);
    const p4Dir = join(busDir, 'priority-4');
    const files = await readdir(p4Dir);
    const content = await readFile(join(p4Dir, files[0]), 'utf-8');
    expect(content).toContain('ARTIFACTS:src/foo.ts,src/bar.ts');
    expect(content).toContain('SHA:deadbeef');
  });
});

describe('reportBlocker', () => {
  it('sends priority 1 STATUS to coordinator', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    await reportBlocker(config, 'execute-7', 'plan-004', 'missing dependency');

    // Verify STATUS in priority-1 directory
    const p1Dir = join(busDir, 'priority-1');
    const files = await readdir(p1Dir);
    const statusFiles = files.filter(f => f.includes('STATUS') && f.includes('executor') && f.includes('coordinator'));
    expect(statusFiles.length).toBe(1);
  });

  it('includes blocker detail in payload', async () => {
    const config = { busConfig, logPath, agentId: 'executor' as const };
    await reportBlocker(config, 'execute-7', 'plan-004', 'missing dependency');

    const p1Dir = join(busDir, 'priority-1');
    const files = await readdir(p1Dir);
    const content = await readFile(join(p1Dir, files[0]), 'utf-8');
    expect(content).toContain('BLOCKER:missing dependency');
    expect(content).toContain('PHASE:execute-7');
    expect(content).toContain('PLAN:plan-004');
  });
});

// ============================================================================
// JSONL logging tests
// ============================================================================

describe('appendExecutorEntry / readExecutorLog', () => {
  it('round-trips a single entry', async () => {
    const entry = {
      timestamp: '20260220-134500',
      type: 'execution-start' as const,
      phase: 'execute-7',
      plan: 'plan-003',
      detail: { task: 'init' },
    };

    await appendExecutorEntry(logPath, entry);
    const entries = await readExecutorLog(logPath);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(entry);
  });

  it('appends multiple entries', async () => {
    await appendExecutorEntry(logPath, {
      timestamp: '20260220-134500',
      type: 'execution-start' as const,
      phase: 'x',
      plan: 'y',
      detail: {},
    });
    await appendExecutorEntry(logPath, {
      timestamp: '20260220-134501',
      type: 'progress' as const,
      phase: 'x',
      plan: 'y',
      detail: { step: 2 },
    });

    const entries = await readExecutorLog(logPath);
    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe('execution-start');
    expect(entries[1].type).toBe('progress');
  });

  it('returns empty array for non-existent log', async () => {
    const entries = await readExecutorLog(join(tempDir, 'does-not-exist.jsonl'));
    expect(entries).toEqual([]);
  });

  it('creates directory if it does not exist', async () => {
    const deepPath = join(tempDir, 'deep', 'nested', 'log.jsonl');
    await appendExecutorEntry(deepPath, {
      timestamp: '20260220-134500',
      type: 'handoff' as const,
      phase: 'x',
      plan: 'y',
      detail: {},
    });
    const entries = await readExecutorLog(deepPath);
    expect(entries).toHaveLength(1);
  });
});

// ============================================================================
// Executor class tests
// ============================================================================

describe('Executor class', () => {
  it('delegates loadContext to stateless function', () => {
    const exec = new Executor({ busConfig, logPath, agentId: 'executor' });
    const ctx = exec.loadContext('execute-7', 'plan-003');
    expect(ctx.phase).toBe('execute-7');
    expect(ctx.status).toBe('running');
  });

  it('delegates reportProgress to stateless function', async () => {
    const exec = new Executor({ busConfig, logPath, agentId: 'executor' });
    const ctx = exec.loadContext('execute-7', 'plan-003');
    const result = await exec.reportProgress(ctx);
    expect(result).toEqual(ctx);

    const p6Dir = join(busDir, 'priority-6');
    const files = await readdir(p6Dir);
    expect(files.length).toBe(1);
  });

  it('delegates handoffToVerifier to stateless function', async () => {
    const exec = new Executor({ busConfig, logPath, agentId: 'executor' });
    const ctx = {
      phase: 'execute-7',
      plan: 'plan-003',
      artifacts: ['src/a.ts'],
      gitSha: 'abc123',
      tokensUsed: 10000,
      status: 'complete' as const,
    };
    const handoff = await exec.handoffToVerifier(ctx);
    expect(handoff.gitSha).toBe('abc123');
  });

  it('delegates reportBlocker to stateless function', async () => {
    const exec = new Executor({ busConfig, logPath, agentId: 'executor' });
    await exec.reportBlocker('phase-1', 'plan-002', 'broken import');

    const p1Dir = join(busDir, 'priority-1');
    const files = await readdir(p1Dir);
    expect(files.length).toBe(1);
  });

  it('delegates appendEntry and readLog to stateless functions', async () => {
    const exec = new Executor({ busConfig, logPath, agentId: 'executor' });
    await exec.appendEntry({
      timestamp: '20260220-134500',
      type: 'execution-start' as const,
      phase: 'x',
      plan: 'y',
      detail: {},
    });
    const entries = await exec.readLog();
    expect(entries).toHaveLength(1);
  });
});

// ============================================================================
// Factory function tests
// ============================================================================

describe('createExecutor', () => {
  it('creates executor with default config', () => {
    const exec = createExecutor({ busConfig });
    expect(exec).toBeInstanceOf(Executor);
  });

  it('creates executor with custom config', () => {
    const exec = createExecutor({
      busConfig,
      logPath: '/tmp/custom.jsonl',
      agentId: 'executor',
    });
    expect(exec).toBeInstanceOf(Executor);
  });

  it('applies default logPath and agentId', () => {
    const exec = createExecutor({ busConfig });
    // Verify it works by loading a context
    const ctx = exec.loadContext('p1', 'plan-001');
    expect(ctx.status).toBe('running');
  });
});
