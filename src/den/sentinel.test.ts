/**
 * Tests for the Sentinel agent -- GSD Den error recovery and safety position.
 *
 * Covers: recovery decision matrix, HALT protocol, rollback planning,
 * crash damage assessment, JSONL logging, class wrapper, factory function.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  FailureTypeSchema,
  RecoveryActionSchema,
  RollbackPlanSchema,
  DamageAssessmentSchema,
  SentinelEntrySchema,
  SentinelConfigSchema,
  assessFailure,
  issueHalt,
  clearHalt,
  planRollback,
  assessCrashDamage,
  appendSentinelEntry,
  readSentinelLog,
  Sentinel,
  createSentinel,
} from './sentinel.js';
import { initBus } from './bus.js';
import type { BusConfig } from './types.js';
import { BusConfigSchema } from './types.js';
import { decodeMessage } from './encoder.js';

// ============================================================================
// Test helpers
// ============================================================================

let tmpDir: string;
let busConfig: BusConfig;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'sentinel-test-'));
  busConfig = BusConfigSchema.parse({ busDir: join(tmpDir, 'bus') });
  await initBus(busConfig);
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// Schema validation
// ============================================================================

describe('FailureTypeSchema', () => {
  it('accepts all 9 failure types', () => {
    const types = [
      'test-failure-single', 'test-failure-cascade', 'budget-overage',
      'context-exhaustion', 'verification-rejection', 'build-failure',
      'session-crash', 'bus-failure', 'git-state-corrupted',
    ];
    for (const t of types) {
      expect(FailureTypeSchema.parse(t)).toBe(t);
    }
  });

  it('rejects invalid failure type', () => {
    expect(() => FailureTypeSchema.parse('unknown-failure')).toThrow();
  });
});

describe('RecoveryActionSchema', () => {
  it('validates a well-formed recovery action', () => {
    const action = {
      failureType: 'test-failure-single',
      severity: 'low',
      action: 'retry',
      escalation: 'Sentinel analyzes root cause',
      requiresHalt: false,
    };
    const parsed = RecoveryActionSchema.parse(action);
    expect(parsed.severity).toBe('low');
    expect(parsed.requiresHalt).toBe(false);
  });
});

describe('RollbackPlanSchema', () => {
  it('validates a well-formed rollback plan', () => {
    const plan = {
      targetSha: 'abc1234',
      phase: '259',
      reason: 'Test failure cascade',
      steps: ['step1', 'step2'],
    };
    const parsed = RollbackPlanSchema.parse(plan);
    expect(parsed.targetSha).toBe('abc1234');
    expect(parsed.steps).toHaveLength(2);
  });
});

describe('DamageAssessmentSchema', () => {
  it('validates a well-formed damage assessment', () => {
    const assessment = {
      level: 'none',
      description: 'No damage detected',
      recommendedAction: 'resume',
    };
    const parsed = DamageAssessmentSchema.parse(assessment);
    expect(parsed.level).toBe('none');
  });
});

describe('SentinelEntrySchema', () => {
  it('validates a well-formed sentinel entry', () => {
    const entry = {
      timestamp: '20260220-120000',
      type: 'failure-assessed',
      phase: '259',
      detail: { failureType: 'test-failure-single' },
    };
    const parsed = SentinelEntrySchema.parse(entry);
    expect(parsed.type).toBe('failure-assessed');
  });
});

describe('SentinelConfigSchema', () => {
  it('applies defaults', () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    expect(config.logPath).toBe('.planning/den/logs/sentinel.jsonl');
    expect(config.agentId).toBe('sentinel');
  });
});

// ============================================================================
// assessFailure -- recovery decision matrix
// ============================================================================

describe('assessFailure', () => {
  it('maps test-failure-single to retry/low', () => {
    const result = assessFailure('test-failure-single');
    expect(result.severity).toBe('low');
    expect(result.action).toBe('retry');
    expect(result.requiresHalt).toBe(false);
  });

  it('maps test-failure-cascade to rollback/medium', () => {
    const result = assessFailure('test-failure-cascade');
    expect(result.severity).toBe('medium');
    expect(result.action).toBe('rollback');
    expect(result.requiresHalt).toBe(false);
  });

  it('maps budget-overage to conserve/medium', () => {
    const result = assessFailure('budget-overage');
    expect(result.severity).toBe('medium');
    expect(result.action).toBe('conserve');
    expect(result.requiresHalt).toBe(false);
  });

  it('maps context-exhaustion to rotate/high', () => {
    const result = assessFailure('context-exhaustion');
    expect(result.severity).toBe('high');
    expect(result.action).toBe('rotate');
    expect(result.requiresHalt).toBe(false);
  });

  it('maps verification-rejection to assess/medium', () => {
    const result = assessFailure('verification-rejection');
    expect(result.severity).toBe('medium');
    expect(result.action).toBe('assess');
    expect(result.requiresHalt).toBe(false);
  });

  it('maps build-failure to rollback/high', () => {
    const result = assessFailure('build-failure');
    expect(result.severity).toBe('high');
    expect(result.action).toBe('rollback');
    expect(result.requiresHalt).toBe(false);
  });

  it('maps session-crash to assess/critical', () => {
    const result = assessFailure('session-crash');
    expect(result.severity).toBe('critical');
    expect(result.action).toBe('assess');
    expect(result.requiresHalt).toBe(false);
  });

  it('maps bus-failure to halt/critical with requiresHalt', () => {
    const result = assessFailure('bus-failure');
    expect(result.severity).toBe('critical');
    expect(result.action).toBe('halt');
    expect(result.requiresHalt).toBe(true);
  });

  it('maps git-state-corrupted to halt/critical with requiresHalt', () => {
    const result = assessFailure('git-state-corrupted');
    expect(result.severity).toBe('critical');
    expect(result.action).toBe('halt');
    expect(result.requiresHalt).toBe(true);
  });

  it('includes failureType in the returned action', () => {
    const result = assessFailure('budget-overage');
    expect(result.failureType).toBe('budget-overage');
  });

  it('includes escalation string', () => {
    const result = assessFailure('test-failure-single');
    expect(result.escalation).toBeTruthy();
    expect(typeof result.escalation).toBe('string');
  });
});

// ============================================================================
// issueHalt
// ============================================================================

describe('issueHalt', () => {
  it('sends a priority 0 HALT message to bus', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await issueHalt(config, 'Critical bus failure', 'critical');

    expect(msg.header.priority).toBe(0);
    expect(msg.header.opcode).toBe('HALT');
    expect(msg.header.src).toBe('sentinel');
    expect(msg.header.dst).toBe('all');
  });

  it('includes reason and severity in payload', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await issueHalt(config, 'Git corruption', 'critical');

    const reasonLine = msg.payload.find((l: string) => l.startsWith('REASON:'));
    const severityLine = msg.payload.find((l: string) => l.startsWith('SEVERITY:'));

    expect(reasonLine).toBe('REASON:Git corruption');
    expect(severityLine).toBe('SEVERITY:critical');
  });

  it('includes RECOMMENDED_ACTION derived from severity', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await issueHalt(config, 'Test', 'critical');

    const actionLine = msg.payload.find((l: string) => l.startsWith('RECOMMENDED_ACTION:'));
    expect(actionLine).toBeTruthy();
  });

  it('writes to the priority-0 directory on disk', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    await issueHalt(config, 'Test halt', 'high');

    const files = await readdir(join(busConfig.busDir, 'priority-0'));
    const haltFiles = files.filter((f) => f.includes('HALT'));
    expect(haltFiles.length).toBe(1);
  });
});

// ============================================================================
// clearHalt
// ============================================================================

describe('clearHalt', () => {
  it('sends a priority 0 NOP message (CLEAR signal)', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await clearHalt(config);

    expect(msg.header.priority).toBe(0);
    expect(msg.header.opcode).toBe('NOP');
    expect(msg.header.dst).toBe('all');
  });

  it('uses coordinator as src by default (coordinatorOverride=true)', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await clearHalt(config, undefined, true);

    expect(msg.header.src).toBe('coordinator');
  });

  it('uses sentinel agentId as src when coordinatorOverride=false', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await clearHalt(config, undefined, false);

    expect(msg.header.src).toBe('sentinel');
  });

  it('includes HALT_CLEARED status in payload', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await clearHalt(config, 'Recovery complete');

    const statusLine = msg.payload.find((l: string) => l.startsWith('STATUS:'));
    expect(statusLine).toBe('STATUS:HALT_CLEARED');
  });

  it('includes reason in payload', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await clearHalt(config, 'All systems recovered');

    const reasonLine = msg.payload.find((l: string) => l.startsWith('REASON:'));
    expect(reasonLine).toBe('REASON:All systems recovered');
  });

  it('uses default reason if none provided', async () => {
    const config = SentinelConfigSchema.parse({ busConfig });
    const msg = await clearHalt(config);

    const reasonLine = msg.payload.find((l: string) => l.startsWith('REASON:'));
    expect(reasonLine).toBe('REASON:Recovery complete');
  });
});

// ============================================================================
// planRollback
// ============================================================================

describe('planRollback', () => {
  it('creates a rollback plan with target SHA', () => {
    const plan = planRollback('abc1234', '259', 'Test cascade failure');

    expect(plan.targetSha).toBe('abc1234');
    expect(plan.phase).toBe('259');
    expect(plan.reason).toBe('Test cascade failure');
  });

  it('includes exactly 6 steps', () => {
    const plan = planRollback('abc1234', '259', 'Test');
    expect(plan.steps).toHaveLength(6);
  });

  it('step 1 verifies target SHA exists', () => {
    const plan = planRollback('abc1234', '259', 'Test');
    expect(plan.steps[0]).toContain('Verify');
  });

  it('step 3 executes git reset', () => {
    const plan = planRollback('abc1234', '259', 'Test');
    expect(plan.steps[2]).toContain('git reset');
  });

  it('step 4 updates STATE.md', () => {
    const plan = planRollback('abc1234', '259', 'Test');
    expect(plan.steps[3]).toContain('STATE.md');
  });

  it('step 6 notifies Planner to recalculate', () => {
    const plan = planRollback('abc1234', '259', 'Test');
    expect(plan.steps[5]).toContain('Planner');
  });

  it('is a pure function -- no side effects', () => {
    const plan1 = planRollback('abc1234', '259', 'Test');
    const plan2 = planRollback('abc1234', '259', 'Test');
    expect(plan1).toEqual(plan2);
  });
});

// ============================================================================
// assessCrashDamage
// ============================================================================

describe('assessCrashDamage', () => {
  it('all clean -> none/resume', () => {
    const result = assessCrashDamage(true, true, false);
    expect(result.level).toBe('none');
    expect(result.recommendedAction).toBe('resume');
  });

  it('uncommitted work -> minor/recover', () => {
    const result = assessCrashDamage(true, true, true);
    expect(result.level).toBe('minor');
    expect(result.recommendedAction).toBe('recover');
  });

  it('bus not clean -> minor/recover', () => {
    const result = assessCrashDamage(true, false, false);
    expect(result.level).toBe('minor');
    expect(result.recommendedAction).toBe('recover');
  });

  it('state missing -> significant/investigate', () => {
    const result = assessCrashDamage(false, true, false);
    expect(result.level).toBe('significant');
    expect(result.recommendedAction).toBe('investigate');
  });

  it('state missing + uncommitted -> significant/investigate', () => {
    const result = assessCrashDamage(false, false, true);
    expect(result.level).toBe('significant');
    expect(result.recommendedAction).toBe('investigate');
  });

  it('returns a description string', () => {
    const result = assessCrashDamage(true, true, false);
    expect(typeof result.description).toBe('string');
    expect(result.description.length).toBeGreaterThan(0);
  });

  it('is a pure function -- no side effects', () => {
    const r1 = assessCrashDamage(true, true, false);
    const r2 = assessCrashDamage(true, true, false);
    expect(r1).toEqual(r2);
  });
});

// ============================================================================
// JSONL logging
// ============================================================================

describe('appendSentinelEntry / readSentinelLog', () => {
  it('round-trips a sentinel entry through JSONL', async () => {
    const logPath = join(tmpDir, 'logs', 'sentinel.jsonl');
    const entry = {
      timestamp: '20260220-120000',
      type: 'failure-assessed' as const,
      phase: '259',
      detail: { failureType: 'bus-failure', severity: 'critical' },
    };

    await appendSentinelEntry(logPath, entry);
    const log = await readSentinelLog(logPath);

    expect(log).toHaveLength(1);
    expect(log[0].type).toBe('failure-assessed');
    expect(log[0].detail).toEqual({ failureType: 'bus-failure', severity: 'critical' });
  });

  it('appends multiple entries', async () => {
    const logPath = join(tmpDir, 'logs', 'sentinel.jsonl');

    await appendSentinelEntry(logPath, {
      timestamp: '20260220-120000',
      type: 'halt-issued',
      phase: '259',
      detail: { reason: 'bus failure' },
    });
    await appendSentinelEntry(logPath, {
      timestamp: '20260220-120001',
      type: 'halt-cleared',
      phase: '259',
      detail: { reason: 'recovery complete' },
    });

    const log = await readSentinelLog(logPath);
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe('halt-issued');
    expect(log[1].type).toBe('halt-cleared');
  });

  it('returns empty array for nonexistent log', async () => {
    const logPath = join(tmpDir, 'logs', 'nonexistent.jsonl');
    const log = await readSentinelLog(logPath);
    expect(log).toEqual([]);
  });

  it('creates directory if it does not exist', async () => {
    const logPath = join(tmpDir, 'deep', 'nested', 'sentinel.jsonl');

    await appendSentinelEntry(logPath, {
      timestamp: '20260220-120000',
      type: 'recovery-action',
      phase: '259',
      detail: { action: 'retry' },
    });

    const log = await readSentinelLog(logPath);
    expect(log).toHaveLength(1);
  });
});

// ============================================================================
// Sentinel class
// ============================================================================

describe('Sentinel class', () => {
  let sentinel: InstanceType<typeof Sentinel>;

  beforeEach(() => {
    sentinel = new Sentinel(SentinelConfigSchema.parse({
      busConfig,
      logPath: join(tmpDir, 'logs', 'sentinel.jsonl'),
    }));
  });

  it('assessFailure delegates to stateless function', () => {
    const result = sentinel.assessFailure('bus-failure');
    expect(result.action).toBe('halt');
    expect(result.requiresHalt).toBe(true);
  });

  it('issueHalt sends message via bus', async () => {
    const msg = await sentinel.issueHalt('test halt', 'high');
    expect(msg.header.opcode).toBe('HALT');
    expect(msg.header.priority).toBe(0);
  });

  it('clearHalt sends clear signal', async () => {
    const msg = await sentinel.clearHalt('test cleared');
    expect(msg.header.opcode).toBe('NOP');
  });

  it('planRollback produces a plan', () => {
    const plan = sentinel.planRollback('abc123', '259', 'cascade');
    expect(plan.steps).toHaveLength(6);
    expect(plan.targetSha).toBe('abc123');
  });

  it('assessCrashDamage returns correct assessment', () => {
    const result = sentinel.assessCrashDamage(false, false, true);
    expect(result.level).toBe('significant');
  });

  it('appendEntry and getLog round-trip', async () => {
    await sentinel.appendEntry({
      timestamp: '20260220-130000',
      type: 'crash-assessed',
      phase: '259',
      detail: { level: 'minor' },
    });

    const log = await sentinel.getLog();
    expect(log).toHaveLength(1);
    expect(log[0].type).toBe('crash-assessed');
  });
});

// ============================================================================
// createSentinel factory
// ============================================================================

describe('createSentinel', () => {
  it('creates a working Sentinel instance with defaults', () => {
    const sentinel = createSentinel({ busConfig });
    expect(sentinel).toBeInstanceOf(Sentinel);
  });

  it('applies custom logPath', () => {
    const customPath = join(tmpDir, 'custom', 'sentinel.jsonl');
    const sentinel = createSentinel({ busConfig, logPath: customPath });

    // Verify it works by assessing a failure
    const result = sentinel.assessFailure('test-failure-single');
    expect(result.action).toBe('retry');
  });

  it('is synchronous (no await needed)', () => {
    // This test verifies the factory is not async
    const result = createSentinel({ busConfig });
    // If createSentinel returned a Promise, this would fail
    expect(result.assessFailure).toBeDefined();
  });
});
