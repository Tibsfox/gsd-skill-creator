/**
 * Tests for DACP bundle cleanup and orphan detection utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { cleanupBundles, detectOrphans } from './cleanup.js';
import { initBus } from '../../den/bus.js';
import { encodeMessage, messageFilename } from '../../den/encoder.js';
import type { BusConfig, BusMessage } from '../../den/types.js';

// ============================================================================
// Helpers
// ============================================================================

async function makeTempConfig(): Promise<{ config: BusConfig; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'dacp-cleanup-test-'));
  const busDir = join(dir, 'bus');
  const config: BusConfig = {
    busDir,
    maxQueueDepth: 100,
    deliveryTimeoutMs: 5000,
    deadLetterRetentionDays: 3,
    archiveMaxMessages: 100,
    archiveMaxAgeDays: 7,
  };
  return { config, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

function makeMessage(overrides: Partial<{
  priority: number;
  opcode: string;
  src: string;
  dst: string;
  timestamp: string;
  payload: string[];
}> = {}): BusMessage {
  const payload = overrides.payload ?? ['test payload'];
  return {
    header: {
      timestamp: overrides.timestamp ?? '20260220-130000',
      priority: overrides.priority ?? 3,
      opcode: (overrides.opcode ?? 'EXEC') as BusMessage['header']['opcode'],
      src: (overrides.src ?? 'coordinator') as BusMessage['header']['src'],
      dst: (overrides.dst ?? 'executor') as BusMessage['header']['dst'],
      length: payload.length,
    },
    payload,
  };
}

/**
 * Create both .msg and .bundle/ in acknowledged/ directory to simulate
 * an acknowledged DACP message.
 */
async function createAcknowledgedBundle(
  ackDir: string,
  timestamp: string,
): Promise<{ msgPath: string; bundlePath: string }> {
  const msg = makeMessage({ timestamp });
  const filename = messageFilename(msg.header);
  const stem = filename.replace(/\.msg$/, '');

  const msgPath = join(ackDir, filename);
  const bundlePath = join(ackDir, `${stem}.bundle`);

  await writeFile(msgPath, encodeMessage(msg), 'utf-8');
  await mkdir(bundlePath, { recursive: true });
  await writeFile(join(bundlePath, 'manifest.json'), '{}');

  return { msgPath, bundlePath };
}

// ============================================================================
// cleanupBundles
// ============================================================================

describe('cleanupBundles', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanup();
  });

  it('prunes acknowledged bundles older than maxAgeDays', async () => {
    const ackDir = join(config.busDir, 'acknowledged');

    // Old bundle (30 days ago timestamp)
    await createAcknowledgedBundle(ackDir, '20260120-130000');

    // Freeze time to make the old bundle look old
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-27T13:00:00Z'));

    const result = await cleanupBundles(config, 7);

    vi.useRealTimers();

    expect(result.bundlesPruned).toBeGreaterThanOrEqual(1);
  });

  it('preserves bundles newer than maxAgeDays', async () => {
    const ackDir = join(config.busDir, 'acknowledged');

    // Recent bundle (today)
    await createAcknowledgedBundle(ackDir, '20260227-120000');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-27T13:00:00Z'));

    const result = await cleanupBundles(config, 7);

    vi.useRealTimers();

    expect(result.bundlesPruned).toBe(0);
  });

  it('removes orphaned bundles from priority directories', async () => {
    // Create an orphaned .bundle/ in priority-3 (no companion .msg)
    const priDir = join(config.busDir, 'priority-3');
    const orphanBundle = join(priDir, '20260220-130000-EXEC-coordinator-executor.bundle');
    await mkdir(orphanBundle, { recursive: true });
    await writeFile(join(orphanBundle, 'manifest.json'), '{}');

    const result = await cleanupBundles(config, 7);

    expect(result.orphansDetected).toBeGreaterThanOrEqual(1);
  });

  it('reports approximate space recovered', async () => {
    const ackDir = join(config.busDir, 'acknowledged');

    // Old bundle
    await createAcknowledgedBundle(ackDir, '20260120-130000');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-27T13:00:00Z'));

    const result = await cleanupBundles(config, 7);

    vi.useRealTimers();

    expect(result.spaceRecovered).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// detectOrphans
// ============================================================================

describe('detectOrphans', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('finds .bundle/ dirs without companion .msg', async () => {
    const priDir = join(config.busDir, 'priority-3');
    const orphanBundle = join(priDir, '20260220-130000-EXEC-coordinator-executor.bundle');
    await mkdir(orphanBundle, { recursive: true });
    await writeFile(join(orphanBundle, 'manifest.json'), '{}');

    const orphans = await detectOrphans(config);
    expect(orphans.length).toBe(1);
    expect(orphans[0].bundlePath).toBe(orphanBundle);
    expect(orphans[0].reason).toBe('no_companion_msg');
  });

  it('does not flag .bundle/ dirs that have companion .msg', async () => {
    const priDir = join(config.busDir, 'priority-3');
    const stem = '20260220-130000-EXEC-coordinator-executor';
    const msgPath = join(priDir, `${stem}.msg`);
    const bundlePath = join(priDir, `${stem}.bundle`);

    const msg = makeMessage({ priority: 3 });
    await writeFile(msgPath, encodeMessage(msg), 'utf-8');
    await mkdir(bundlePath, { recursive: true });
    await writeFile(join(bundlePath, 'manifest.json'), '{}');

    const orphans = await detectOrphans(config);
    expect(orphans.length).toBe(0);
  });
});
