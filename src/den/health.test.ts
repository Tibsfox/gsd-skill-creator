/**
 * Tests for Den bus health metrics collection.
 *
 * Validates queue depth counting per priority, oldest unacknowledged
 * message age calculation, dead letter counting, health threshold
 * evaluation, and human-readable report formatting.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { collectHealthMetrics, isHealthy, formatHealthReport } from './health.js';
import { encodeMessage, formatTimestamp } from './encoder.js';
import type { BusConfig, BusMessage, HealthMetrics } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

/** Create a temp dir and return a BusConfig pointing at it */
async function createTestBus(): Promise<{ busDir: string; config: BusConfig }> {
  const busDir = await mkdtemp(join(tmpdir(), 'den-health-test-'));

  // Create priority dirs 0-7, acknowledged, dead-letter
  for (let i = 0; i < 8; i++) {
    await mkdir(join(busDir, `priority-${i}`), { recursive: true });
  }
  await mkdir(join(busDir, 'acknowledged'), { recursive: true });
  await mkdir(join(busDir, 'dead-letter'), { recursive: true });

  const config: BusConfig = {
    busDir,
    maxQueueDepth: 100,
    deliveryTimeoutMs: 5000,
    deadLetterRetentionDays: 3,
    archiveMaxMessages: 100,
    archiveMaxAgeDays: 7,
  };

  return { busDir, config };
}

/** Seed a message file into a priority directory */
async function seedMessage(
  busDir: string,
  priority: number,
  timestamp: string,
  opcode: string = 'STATUS',
  src: string = 'monitor',
  dst: string = 'coordinator',
  payload: string[] = [],
): Promise<string> {
  const msg: BusMessage = {
    header: {
      timestamp,
      priority,
      opcode: opcode as BusMessage['header']['opcode'],
      src: src as BusMessage['header']['src'],
      dst: dst as BusMessage['header']['dst'],
      length: payload.length,
    },
    payload,
  };
  const filename = `${timestamp}-${opcode}-${src}-${dst}.msg`;
  const dir = join(busDir, `priority-${priority}`);
  const filePath = join(dir, filename);
  const content = encodeMessage(msg);
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

/** Seed a dead-letter message file */
async function seedDeadLetter(
  busDir: string,
  timestamp: string,
  opcode: string = 'STATUS',
  src: string = 'monitor',
  dst: string = 'coordinator',
  includeMeta: boolean = true,
): Promise<string> {
  const filename = `${timestamp}-${opcode}-${src}-${dst}.msg`;
  const dir = join(busDir, 'dead-letter');
  const filePath = join(dir, filename);
  await writeFile(filePath, `${timestamp}|6|${opcode}|${src}|${dst}|0`, 'utf-8');
  if (includeMeta) {
    await writeFile(
      filePath.replace('.msg', '.meta'),
      JSON.stringify({ originalPath: 'priority-6/' + filename, reason: 'test', timestamp }),
      'utf-8',
    );
  }
  return filePath;
}

// ============================================================================
// collectHealthMetrics
// ============================================================================

describe('collectHealthMetrics', () => {
  let busDir: string;
  let config: BusConfig;

  beforeEach(async () => {
    ({ busDir, config } = await createTestBus());
  });

  afterEach(async () => {
    await rm(busDir, { recursive: true, force: true });
  });

  it('returns all-zero metrics for an empty bus', async () => {
    const metrics = await collectHealthMetrics(config);

    expect(metrics.totalMessages).toBe(0);
    expect(metrics.oldestUnacknowledgedAge).toBeNull();
    expect(metrics.deadLetterCount).toBe(0);
    for (let i = 0; i < 8; i++) {
      expect(metrics.queueDepths[String(i)]).toBe(0);
    }
  });

  it('counts queue depths per priority correctly', async () => {
    // 3 messages in priority-0
    await seedMessage(busDir, 0, '20260220-100000');
    await seedMessage(busDir, 0, '20260220-100001', 'EXEC', 'coordinator', 'executor');
    await seedMessage(busDir, 0, '20260220-100002', 'HALT', 'monitor', 'all');

    // 2 messages in priority-2
    await seedMessage(busDir, 2, '20260220-100003');
    await seedMessage(busDir, 2, '20260220-100004', 'QUERY', 'planner', 'coordinator');

    const metrics = await collectHealthMetrics(config);

    expect(metrics.queueDepths['0']).toBe(3);
    expect(metrics.queueDepths['1']).toBe(0);
    expect(metrics.queueDepths['2']).toBe(2);
    expect(metrics.queueDepths['3']).toBe(0);
    expect(metrics.queueDepths['4']).toBe(0);
    expect(metrics.queueDepths['5']).toBe(0);
    expect(metrics.queueDepths['6']).toBe(0);
    expect(metrics.queueDepths['7']).toBe(0);
  });

  it('sums totalMessages across all priority dirs (not acknowledged or dead-letter)', async () => {
    await seedMessage(busDir, 0, '20260220-100000');
    await seedMessage(busDir, 3, '20260220-100001');
    await seedMessage(busDir, 7, '20260220-100002');

    // Also put something in acknowledged and dead-letter (should NOT count)
    await writeFile(
      join(busDir, 'acknowledged', '20260220-090000-ACK-monitor-coordinator.msg'),
      'dummy',
      'utf-8',
    );
    await writeFile(
      join(busDir, 'dead-letter', '20260220-090000-HALT-monitor-all.msg'),
      'dummy',
      'utf-8',
    );

    const metrics = await collectHealthMetrics(config);
    expect(metrics.totalMessages).toBe(3);
  });

  it('calculates oldestUnacknowledgedAge from oldest message timestamp', async () => {
    // Seed a message with timestamp 60 seconds ago
    const now = new Date();
    const sixtySecondsAgo = new Date(now.getTime() - 60_000);
    const ts = formatTimestamp(sixtySecondsAgo);
    await seedMessage(busDir, 4, ts);

    const metrics = await collectHealthMetrics(config);

    expect(metrics.oldestUnacknowledgedAge).not.toBeNull();
    // Allow clock tolerance: between 59s and 62s
    expect(metrics.oldestUnacknowledgedAge!).toBeGreaterThanOrEqual(59_000);
    expect(metrics.oldestUnacknowledgedAge!).toBeLessThanOrEqual(62_000);
  });

  it('counts only .msg files in dead-letter (not .meta)', async () => {
    await seedDeadLetter(busDir, '20260220-100000');
    await seedDeadLetter(busDir, '20260220-100001', 'EXEC', 'coordinator', 'executor');
    // Each seedDeadLetter creates both .msg and .meta
    // Should count only .msg files

    const metrics = await collectHealthMetrics(config);
    expect(metrics.deadLetterCount).toBe(2);
  });

  it('populates timestamp field with ISO format', async () => {
    const metrics = await collectHealthMetrics(config);
    // Should be parseable as an ISO date
    const parsed = new Date(metrics.timestamp);
    expect(parsed.getTime()).not.toBeNaN();
  });
});

// ============================================================================
// isHealthy
// ============================================================================

describe('isHealthy', () => {
  it('returns true when all metrics are zero', () => {
    const metrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      queueDepths: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
      totalMessages: 0,
      oldestUnacknowledgedAge: null,
      deadLetterCount: 0,
    };
    const config: BusConfig = {
      busDir: '/tmp/test',
      maxQueueDepth: 100,
      deliveryTimeoutMs: 5000,
      deadLetterRetentionDays: 3,
      archiveMaxMessages: 100,
      archiveMaxAgeDays: 7,
    };

    expect(isHealthy(metrics, config)).toBe(true);
  });

  it('returns false when any queue depth exceeds maxQueueDepth', () => {
    const metrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      queueDepths: { '0': 0, '1': 0, '2': 101, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
      totalMessages: 101,
      oldestUnacknowledgedAge: null,
      deadLetterCount: 0,
    };
    const config: BusConfig = {
      busDir: '/tmp/test',
      maxQueueDepth: 100,
      deliveryTimeoutMs: 5000,
      deadLetterRetentionDays: 3,
      archiveMaxMessages: 100,
      archiveMaxAgeDays: 7,
    };

    expect(isHealthy(metrics, config)).toBe(false);
  });

  it('returns false when dead letter count exceeds 10', () => {
    const metrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      queueDepths: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
      totalMessages: 0,
      oldestUnacknowledgedAge: null,
      deadLetterCount: 11,
    };
    const config: BusConfig = {
      busDir: '/tmp/test',
      maxQueueDepth: 100,
      deliveryTimeoutMs: 5000,
      deadLetterRetentionDays: 3,
      archiveMaxMessages: 100,
      archiveMaxAgeDays: 7,
    };

    expect(isHealthy(metrics, config)).toBe(false);
  });

  it('returns false when oldestUnacknowledgedAge exceeds deliveryTimeoutMs', () => {
    const metrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      queueDepths: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
      totalMessages: 1,
      oldestUnacknowledgedAge: 6000,
      deadLetterCount: 0,
    };
    const config: BusConfig = {
      busDir: '/tmp/test',
      maxQueueDepth: 100,
      deliveryTimeoutMs: 5000,
      deadLetterRetentionDays: 3,
      archiveMaxMessages: 100,
      archiveMaxAgeDays: 7,
    };

    expect(isHealthy(metrics, config)).toBe(false);
  });
});

// ============================================================================
// formatHealthReport
// ============================================================================

describe('formatHealthReport', () => {
  it('formats a one-line summary with queued, dead, and oldest age', () => {
    const metrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      queueDepths: { '0': 2, '1': 0, '2': 3, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
      totalMessages: 5,
      oldestUnacknowledgedAge: 1200,
      deadLetterCount: 0,
    };

    const report = formatHealthReport(metrics);
    expect(report).toBe('Bus: 5 queued, 0 dead, oldest: 1.2s');
  });

  it('shows "none" when no unacknowledged messages', () => {
    const metrics: HealthMetrics = {
      timestamp: new Date().toISOString(),
      queueDepths: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 },
      totalMessages: 0,
      oldestUnacknowledgedAge: null,
      deadLetterCount: 0,
    };

    const report = formatHealthReport(metrics);
    expect(report).toBe('Bus: 0 queued, 0 dead, oldest: none');
  });
});
