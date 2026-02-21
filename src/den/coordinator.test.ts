/**
 * Tests for the Den Coordinator agent.
 *
 * Verifies: DecisionEntry schema validation, JSONL decision logging,
 * readiness check aggregation (GO/NO-GO/timeout/empty), phase transition
 * message generation, escalation chain routing (levels 0-4), Coordinator
 * class wrapper, and createCoordinator factory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  CoordinatorConfigSchema,
  DecisionEntrySchema,
  ReadinessResponseSchema,
  ReadinessResultSchema,
  PhaseTransitionResultSchema,
  EscalationRequestSchema,
  EscalationResultSchema,
  appendDecision,
  readDecisionLog,
  readinessCheck,
  phaseTransition,
  escalate,
  Coordinator,
  createCoordinator,
} from './coordinator.js';
import { initBus } from './bus.js';
import type { BusConfig, AgentId } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a temp directory and return a BusConfig pointing to it */
async function makeTempConfig(): Promise<{ config: BusConfig; tmpDir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'den-coordinator-test-'));
  const busDir = join(dir, 'bus');
  const config: BusConfig = {
    busDir,
    maxQueueDepth: 100,
    deliveryTimeoutMs: 5000,
    deadLetterRetentionDays: 3,
    archiveMaxMessages: 100,
    archiveMaxAgeDays: 7,
  };
  return { config, tmpDir: dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

// ============================================================================
// DecisionEntry schema
// ============================================================================

describe('DecisionEntrySchema', () => {
  it('validates a correct decision entry', () => {
    const entry = {
      timestamp: '20260220-130000',
      type: 'readiness-check',
      phase: '256',
      result: 'GO',
      detail: { positions: 4 },
    };
    const parsed = DecisionEntrySchema.parse(entry);
    expect(parsed.type).toBe('readiness-check');
    expect(parsed.result).toBe('GO');
  });

  it('rejects invalid type value', () => {
    const entry = {
      timestamp: '20260220-130000',
      type: 'invalid-type',
      phase: '256',
      result: 'GO',
      detail: {},
    };
    expect(() => DecisionEntrySchema.parse(entry)).toThrow();
  });
});

// ============================================================================
// Decision logging (JSONL)
// ============================================================================

describe('appendDecision / readDecisionLog', () => {
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'den-log-test-'));
    cleanup = () => rm(tmpDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('appendDecision writes JSONL and readDecisionLog reads it back', async () => {
    const logPath = join(tmpDir, 'decisions.jsonl');

    const entry1 = {
      timestamp: '20260220-130000',
      type: 'readiness-check' as const,
      phase: '256',
      result: 'GO',
      detail: { positions: 4 },
    };
    const entry2 = {
      timestamp: '20260220-130100',
      type: 'phase-transition' as const,
      phase: '256',
      result: 'completed',
      detail: { from: '255', to: '256' },
    };

    await appendDecision(logPath, entry1);
    await appendDecision(logPath, entry2);

    const entries = await readDecisionLog(logPath);
    expect(entries.length).toBe(2);
    expect(entries[0].type).toBe('readiness-check');
    expect(entries[1].type).toBe('phase-transition');
  });

  it('readDecisionLog returns empty array for non-existent file', async () => {
    const logPath = join(tmpDir, 'nonexistent.jsonl');
    const entries = await readDecisionLog(logPath);
    expect(entries.length).toBe(0);
  });
});

// ============================================================================
// Readiness check
// ============================================================================

describe('readinessCheck', () => {
  let config: BusConfig;
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, tmpDir, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns GO when all positions respond GO', async () => {
    const positions: AgentId[] = ['planner', 'configurator', 'monitor', 'verifier'];
    const collector = async () => positions.map((p) => ({
      position: p,
      decision: 'GO' as const,
      reason: 'ready',
    }));

    const result = await readinessCheck(config, positions, '256', { responseCollector: collector });

    expect(result.result).toBe('GO');
    expect(result.responses.length).toBe(4);
    expect(result.timedOut.length).toBe(0);
  });

  it('returns NO-GO when any position responds NO-GO', async () => {
    const positions: AgentId[] = ['planner', 'configurator', 'monitor', 'verifier'];
    const collector = async () => [
      { position: 'planner' as AgentId, decision: 'GO' as const, reason: 'ready' },
      { position: 'configurator' as AgentId, decision: 'GO' as const, reason: 'ready' },
      { position: 'monitor' as AgentId, decision: 'NO-GO' as const, reason: 'budget exceeded' },
      { position: 'verifier' as AgentId, decision: 'GO' as const, reason: 'ready' },
    ];

    const result = await readinessCheck(config, positions, '256', { responseCollector: collector });

    expect(result.result).toBe('NO-GO');
    expect(result.responses.length).toBe(4);
    expect(result.timedOut.length).toBe(0);
  });

  it('returns NO-GO when positions timeout', async () => {
    const positions: AgentId[] = ['planner', 'configurator', 'monitor'];
    const collector = async () => [
      { position: 'planner' as AgentId, decision: 'GO' as const, reason: 'ready' },
      { position: 'configurator' as AgentId, decision: 'GO' as const, reason: 'ready' },
      // monitor does not respond -- simulated timeout
    ];

    const result = await readinessCheck(config, positions, '256', { responseCollector: collector });

    expect(result.result).toBe('NO-GO');
    expect(result.responses.length).toBe(2);
    expect(result.timedOut).toContain('monitor');
  });

  it('returns GO with empty positions (vacuously true)', async () => {
    const positions: AgentId[] = [];
    const collector = async () => [] as Array<{ position: AgentId; decision: 'GO' | 'NO-GO'; reason: string }>;

    const result = await readinessCheck(config, positions, '256', { responseCollector: collector });

    expect(result.result).toBe('GO');
    expect(result.responses.length).toBe(0);
    expect(result.timedOut.length).toBe(0);
  });

  it('logs result when logPath is provided', async () => {
    const logPath = join(tmpDir, 'decisions.jsonl');
    const positions: AgentId[] = ['planner'];
    const collector = async () => [
      { position: 'planner' as AgentId, decision: 'GO' as const, reason: 'ready' },
    ];

    await readinessCheck(config, positions, '256', { responseCollector: collector, logPath });

    const entries = await readDecisionLog(logPath);
    expect(entries.length).toBe(1);
    expect(entries[0].type).toBe('readiness-check');
    expect(entries[0].result).toBe('GO');
  });

  it('sends CMP messages to each position on the bus', async () => {
    const positions: AgentId[] = ['planner', 'monitor'];
    const collector = async () => positions.map((p) => ({
      position: p,
      decision: 'GO' as const,
      reason: 'ready',
    }));

    await readinessCheck(config, positions, '256', { responseCollector: collector });

    // Check that CMP messages were sent to priority-1
    const p1Dir = join(config.busDir, 'priority-1');
    const files = await readdir(p1Dir);
    const cmpFiles = files.filter((f) => f.includes('CMP'));
    expect(cmpFiles.length).toBe(2);
  });
});

// ============================================================================
// Phase transition
// ============================================================================

describe('phaseTransition', () => {
  let config: BusConfig;
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, tmpDir, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('sends EXEC + 2 STATUS messages', async () => {
    const result = await phaseTransition(config, '255', '256', 'executor');

    // Check EXEC in priority-1
    const p1Dir = join(config.busDir, 'priority-1');
    const p1Files = (await readdir(p1Dir)).filter((f) => f.endsWith('.msg'));
    expect(p1Files.length).toBe(1);
    expect(p1Files[0]).toContain('EXEC');

    // Check STATUS in priority-6 (chronicler + monitor)
    const p6Dir = join(config.busDir, 'priority-6');
    const p6Files = (await readdir(p6Dir)).filter((f) => f.endsWith('.msg'));
    expect(p6Files.length).toBe(2);
  });

  it('returns correct paths and transition info', async () => {
    const result = await phaseTransition(config, '255', '256', 'executor', { plan: '01' });

    expect(result.fromPhase).toBe('255');
    expect(result.toPhase).toBe('256');
    expect(result.target).toBe('executor');
    expect(typeof result.execMessagePath).toBe('string');
    expect(result.notificationPaths.length).toBe(2);
  });

  it('logs transition when logPath is provided', async () => {
    const logPath = join(tmpDir, 'decisions.jsonl');
    await phaseTransition(config, '255', '256', 'executor', { logPath });

    const entries = await readDecisionLog(logPath);
    expect(entries.length).toBe(1);
    expect(entries[0].type).toBe('phase-transition');
  });
});

// ============================================================================
// Escalation chain
// ============================================================================

describe('escalate', () => {
  let config: BusConfig;
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, tmpDir, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('level 0 returns self-resolve with no messages', async () => {
    const request = {
      level: 0 as const,
      issue: 'minor formatting',
      positionsInvolved: ['planner' as AgentId],
      urgency: 'when_convenient' as const,
    };

    const result = await escalate(config, request);

    expect(result.level).toBe(0);
    expect(result.action).toBe('self-resolve');
    expect(result.messagesGenerated.length).toBe(0);
  });

  it('level 1 sends CMP to coordinator', async () => {
    const request = {
      level: 1 as const,
      issue: 'plan conflict',
      positionsInvolved: ['planner' as AgentId, 'configurator' as AgentId],
      urgency: 'soon' as const,
    };

    const result = await escalate(config, request);

    expect(result.level).toBe(1);
    expect(result.action).toBe('coordinator-evaluate');
    expect(result.messagesGenerated.length).toBe(1);

    // Verify CMP message exists
    const p1Dir = join(config.busDir, 'priority-1');
    const files = (await readdir(p1Dir)).filter((f) => f.endsWith('.msg'));
    expect(files.length).toBe(1);
    expect(files[0]).toContain('CMP');
  });

  it('level 2 logs conflict resolution', async () => {
    const logPath = join(tmpDir, 'decisions.jsonl');
    const request = {
      level: 2 as const,
      issue: 'resource contention',
      positionsInvolved: ['monitor' as AgentId, 'verifier' as AgentId],
      recommendation: 'prioritize verifier',
      urgency: 'soon' as const,
    };

    const result = await escalate(config, request, { logPath });

    expect(result.level).toBe(2);
    expect(result.action).toBe('coordinator-resolve');

    const entries = await readDecisionLog(logPath);
    expect(entries.length).toBe(1);
    expect(entries[0].type).toBe('conflict');
  });

  it('level 3 sends SEND to relay', async () => {
    const request = {
      level: 3 as const,
      issue: 'requires user input',
      positionsInvolved: ['planner' as AgentId],
      urgency: 'blocking' as const,
    };

    const result = await escalate(config, request);

    expect(result.level).toBe(3);
    expect(result.action).toBe('user-via-relay');
    expect(result.messagesGenerated.length).toBe(1);

    // Verify SEND message to relay in priority-1
    const p1Dir = join(config.busDir, 'priority-1');
    const files = (await readdir(p1Dir)).filter((f) => f.endsWith('.msg'));
    expect(files.length).toBe(1);
    expect(files[0]).toContain('SEND');
    expect(files[0]).toContain('relay');
  });

  it('level 4 sends HALT to all', async () => {
    const request = {
      level: 4 as const,
      issue: 'critical failure',
      positionsInvolved: ['executor' as AgentId],
      urgency: 'blocking' as const,
    };

    const result = await escalate(config, request);

    expect(result.level).toBe(4);
    expect(result.action).toBe('emergency');
    expect(result.messagesGenerated.length).toBe(1);

    // Verify HALT message to all in priority-0
    const p0Dir = join(config.busDir, 'priority-0');
    const files = (await readdir(p0Dir)).filter((f) => f.endsWith('.msg'));
    expect(files.length).toBe(1);
    expect(files[0]).toContain('HALT');
    expect(files[0]).toContain('all');
  });

  it('logs escalation when logPath is provided', async () => {
    const logPath = join(tmpDir, 'decisions.jsonl');
    const request = {
      level: 1 as const,
      issue: 'needs review',
      positionsInvolved: ['planner' as AgentId],
      urgency: 'soon' as const,
    };

    await escalate(config, request, { logPath });

    const entries = await readDecisionLog(logPath);
    expect(entries.length).toBe(1);
    expect(entries[0].type).toBe('escalation');
  });
});

// ============================================================================
// Coordinator class
// ============================================================================

describe('Coordinator', () => {
  let config: BusConfig;
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, tmpDir, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('wraps stateless functions correctly', async () => {
    const logPath = join(tmpDir, 'coordinator.jsonl');
    const coordConfig = {
      busConfig: config,
      logPath,
      positions: ['planner', 'monitor'] as AgentId[],
    };

    const coord = new Coordinator(coordConfig);

    // runReadinessCheck
    const collector = async () => [
      { position: 'planner' as AgentId, decision: 'GO' as const, reason: 'ready' },
      { position: 'monitor' as AgentId, decision: 'GO' as const, reason: 'ready' },
    ];

    const readiness = await coord.runReadinessCheck('256', collector);
    expect(readiness.result).toBe('GO');

    // runPhaseTransition
    const transition = await coord.runPhaseTransition('255', '256', 'executor');
    expect(transition.fromPhase).toBe('255');

    // getDecisionLog
    const log = await coord.getDecisionLog();
    expect(log.length).toBe(2); // readiness + transition
  });
});

// ============================================================================
// createCoordinator factory
// ============================================================================

describe('createCoordinator', () => {
  let config: BusConfig;
  let tmpDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, tmpDir, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('creates log directory and returns Coordinator instance', async () => {
    const logPath = join(tmpDir, 'logs', 'coordinator.jsonl');
    const coord = await createCoordinator({
      busConfig: config,
      logPath,
      positions: ['planner', 'monitor'] as AgentId[],
    });

    expect(coord).toBeInstanceOf(Coordinator);

    // Log directory should exist
    const logDir = join(tmpDir, 'logs');
    const entries = await readdir(logDir);
    // Directory exists (may be empty)
    expect(entries).toBeDefined();
  });
});
