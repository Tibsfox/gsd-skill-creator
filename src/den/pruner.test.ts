/**
 * Tests for Den bus message pruning and archival.
 *
 * Validates pruning of acknowledged messages by count and age thresholds,
 * dead-letter pruning by age with sidecar cleanup, and PruneResult accounting.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { pruneAcknowledged, pruneDeadLetters } from './pruner.js';
import { formatTimestamp } from './encoder.js';
import type { BusConfig } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

/** Create a temp dir with bus structure and return a BusConfig */
async function createTestBus(): Promise<{ busDir: string; config: BusConfig }> {
  const busDir = await mkdtemp(join(tmpdir(), 'den-pruner-test-'));

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

/** Create an acknowledged message file with a specific timestamp */
async function seedAcknowledged(
  busDir: string,
  timestamp: string,
  index: number = 0,
): Promise<string> {
  const filename = `${timestamp}-STATUS-monitor-coordinator-${index}.msg`;
  const filePath = join(busDir, 'acknowledged', filename);
  await writeFile(filePath, `${timestamp}|6|STATUS|monitor|coordinator|0`, 'utf-8');
  return filePath;
}

/** Create a dead-letter message file with both .msg and .meta sidecar */
async function seedDeadLetter(
  busDir: string,
  timestamp: string,
  index: number = 0,
): Promise<string> {
  const filename = `${timestamp}-STATUS-monitor-coordinator-${index}.msg`;
  const metaFilename = `${timestamp}-STATUS-monitor-coordinator-${index}.meta`;
  const dir = join(busDir, 'dead-letter');
  const filePath = join(dir, filename);
  await writeFile(filePath, `${timestamp}|6|STATUS|monitor|coordinator|0`, 'utf-8');
  await writeFile(
    join(dir, metaFilename),
    JSON.stringify({ originalPath: `priority-6/${filename}`, reason: 'test', timestamp }),
    'utf-8',
  );
  return filePath;
}

/** Generate a timestamp N days in the past */
function daysAgo(n: number): string {
  const date = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return formatTimestamp(date);
}

/** Generate a timestamp N hours ago */
function hoursAgo(n: number): string {
  const date = new Date(Date.now() - n * 60 * 60 * 1000);
  return formatTimestamp(date);
}

// ============================================================================
// pruneAcknowledged
// ============================================================================

describe('pruneAcknowledged', () => {
  let busDir: string;
  let config: BusConfig;

  beforeEach(async () => {
    ({ busDir, config } = await createTestBus());
  });

  afterEach(async () => {
    await rm(busDir, { recursive: true, force: true });
  });

  it('prunes to keep only newest 100 when count exceeded', async () => {
    // Seed 150 acknowledged messages (newest to oldest by index)
    for (let i = 0; i < 150; i++) {
      // Spread timestamps across hours so they sort distinctly
      const ts = hoursAgo(150 - i); // i=0 is oldest, i=149 is newest
      await seedAcknowledged(busDir, ts, i);
    }

    const result = await pruneAcknowledged(config);

    expect(result.pruned).toBe(50);
    expect(result.remaining).toBe(100);
    expect(result.reasons).toContain('count');

    // Verify only 100 files remain
    const remaining = await readdir(join(busDir, 'acknowledged'));
    expect(remaining.length).toBe(100);
  });

  it('prunes messages older than archiveMaxAgeDays even if under count', async () => {
    // 80 messages total: 20 older than 7 days, 60 within 7 days
    for (let i = 0; i < 20; i++) {
      await seedAcknowledged(busDir, daysAgo(10), i); // 10 days old
    }
    for (let i = 0; i < 60; i++) {
      await seedAcknowledged(busDir, daysAgo(1), 20 + i); // 1 day old
    }

    const result = await pruneAcknowledged(config);

    expect(result.pruned).toBe(20);
    expect(result.remaining).toBe(60);
    expect(result.reasons).toContain('age');
  });

  it('applies both thresholds simultaneously', async () => {
    // 80 messages within 7 days + 20 older than 7 days = 100 total
    // The 20 old ones should be pruned by age
    for (let i = 0; i < 20; i++) {
      await seedAcknowledged(busDir, daysAgo(10), i);
    }
    for (let i = 0; i < 80; i++) {
      await seedAcknowledged(busDir, hoursAgo(1), 20 + i);
    }

    const result = await pruneAcknowledged(config);

    expect(result.pruned).toBe(20);
    expect(result.remaining).toBe(80);
    expect(result.reasons).toContain('age');
  });

  it('returns PruneResult with correct counts', async () => {
    // Seed 50 messages, all within limits
    for (let i = 0; i < 50; i++) {
      await seedAcknowledged(busDir, hoursAgo(1), i);
    }

    const result = await pruneAcknowledged(config);

    expect(result.pruned).toBe(0);
    expect(result.remaining).toBe(50);
    expect(result.reasons).toEqual([]);
  });

  it('does nothing when under both thresholds', async () => {
    // 50 messages, all within 7 days
    for (let i = 0; i < 50; i++) {
      await seedAcknowledged(busDir, hoursAgo(2), i);
    }

    const result = await pruneAcknowledged(config);

    expect(result.pruned).toBe(0);
    expect(result.remaining).toBe(50);

    // Verify all files still present
    const remaining = await readdir(join(busDir, 'acknowledged'));
    expect(remaining.length).toBe(50);
  });

  it('respects config overrides (archiveMaxMessages = 50)', async () => {
    const customConfig: BusConfig = { ...config, archiveMaxMessages: 50 };

    // Seed 80 recent messages
    for (let i = 0; i < 80; i++) {
      await seedAcknowledged(busDir, hoursAgo(1), i);
    }

    const result = await pruneAcknowledged(customConfig);

    expect(result.pruned).toBe(30);
    expect(result.remaining).toBe(50);
    expect(result.reasons).toContain('count');
  });
});

// ============================================================================
// pruneDeadLetters
// ============================================================================

describe('pruneDeadLetters', () => {
  let busDir: string;
  let config: BusConfig;

  beforeEach(async () => {
    ({ busDir, config } = await createTestBus());
  });

  afterEach(async () => {
    await rm(busDir, { recursive: true, force: true });
  });

  it('removes dead letters older than deadLetterRetentionDays', async () => {
    // 3 old dead letters (5 days ago, beyond 3-day retention)
    for (let i = 0; i < 3; i++) {
      await seedDeadLetter(busDir, daysAgo(5), i);
    }
    // 2 recent dead letters (1 day ago, within retention)
    for (let i = 0; i < 2; i++) {
      await seedDeadLetter(busDir, daysAgo(1), 3 + i);
    }

    const result = await pruneDeadLetters(config);

    expect(result.pruned).toBe(3);
    expect(result.remaining).toBe(2);
    expect(result.reasons).toContain('age');
  });

  it('removes both .msg and .meta sidecar files together', async () => {
    // Seed 2 old dead letters
    await seedDeadLetter(busDir, daysAgo(5), 0);
    await seedDeadLetter(busDir, daysAgo(5), 1);

    await pruneDeadLetters(config);

    const remaining = await readdir(join(busDir, 'dead-letter'));
    // Both .msg and .meta files should be removed
    expect(remaining.length).toBe(0);
  });

  it('preserves recent dead letters', async () => {
    // Seed 3 recent dead letters (within retention)
    for (let i = 0; i < 3; i++) {
      await seedDeadLetter(busDir, hoursAgo(1), i);
    }

    const result = await pruneDeadLetters(config);

    expect(result.pruned).toBe(0);
    expect(result.remaining).toBe(3);

    // Both .msg and .meta should remain for each
    const remaining = await readdir(join(busDir, 'dead-letter'));
    expect(remaining.length).toBe(6); // 3 .msg + 3 .meta
  });

  it('returns PruneResult with correct counts', async () => {
    await seedDeadLetter(busDir, daysAgo(5), 0);
    await seedDeadLetter(busDir, hoursAgo(1), 1);

    const result = await pruneDeadLetters(config);

    expect(result.pruned).toBe(1);
    expect(result.remaining).toBe(1);
    expect(result.reasons).toContain('age');
  });
});
