/**
 * Tests for graceful degradation when DACP bundles are absent or missing.
 *
 * Proves that DACP-aware agents handle plain .msg files (no bundle companion)
 * without errors, and that scanning works correctly in mixed environments.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { tryLoadBundle, isBundleAvailable } from './degradation.js';
import { DACPTransport } from './transport.js';
import { initBus, sendMessage } from '../../den/bus.js';
import { encodeMessage, messageFilename } from '../../den/encoder.js';
import type { BusConfig, BusMessage } from '../../den/types.js';

// ============================================================================
// Helpers
// ============================================================================

async function makeTempConfig(): Promise<{ config: BusConfig; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'dacp-degrade-test-'));
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

// ============================================================================
// tryLoadBundle
// ============================================================================

describe('tryLoadBundle', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns bundle path when companion .bundle/ exists', async () => {
    const priDir = join(config.busDir, 'priority-3');

    // Create a .msg file
    const msg = makeMessage({ priority: 3 });
    const filename = messageFilename(msg.header);
    const msgPath = join(priDir, filename);
    await writeFile(msgPath, encodeMessage(msg), 'utf-8');

    // Create companion .bundle/ dir
    const stem = filename.replace(/\.msg$/, '');
    const bundlePath = join(priDir, `${stem}.bundle`);
    await mkdir(bundlePath, { recursive: true });
    await writeFile(join(bundlePath, 'manifest.json'), '{}');

    const result = await tryLoadBundle(msgPath);
    expect(result).toBe(bundlePath);
  });

  it('returns null when no .bundle/ companion exists (plain .msg)', async () => {
    const priDir = join(config.busDir, 'priority-3');

    // Create only a .msg file (no bundle)
    const msg = makeMessage({ priority: 3 });
    const filename = messageFilename(msg.header);
    const msgPath = join(priDir, filename);
    await writeFile(msgPath, encodeMessage(msg), 'utf-8');

    const result = await tryLoadBundle(msgPath);
    expect(result).toBeNull();
  });

  it('returns null when .bundle/ dir is empty or malformed', async () => {
    const priDir = join(config.busDir, 'priority-3');

    // Create .msg file
    const msg = makeMessage({ priority: 3 });
    const filename = messageFilename(msg.header);
    const msgPath = join(priDir, filename);
    await writeFile(msgPath, encodeMessage(msg), 'utf-8');

    // Create .bundle as a FILE instead of directory (malformed)
    const stem = filename.replace(/\.msg$/, '');
    const bundlePath = join(priDir, `${stem}.bundle`);
    await writeFile(bundlePath, 'not a directory');

    const result = await tryLoadBundle(msgPath);
    expect(result).toBeNull();
  });
});

// ============================================================================
// isBundleAvailable
// ============================================================================

describe('isBundleAvailable', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns true for .msg with .bundle/ companion', async () => {
    const priDir = join(config.busDir, 'priority-3');

    const msg = makeMessage({ priority: 3 });
    const filename = messageFilename(msg.header);
    const msgPath = join(priDir, filename);
    await writeFile(msgPath, encodeMessage(msg), 'utf-8');

    const stem = filename.replace(/\.msg$/, '');
    const bundlePath = join(priDir, `${stem}.bundle`);
    await mkdir(bundlePath, { recursive: true });

    const available = await isBundleAvailable(msgPath);
    expect(available).toBe(true);
  });

  it('returns false for plain .msg without bundle', async () => {
    const priDir = join(config.busDir, 'priority-3');

    const msg = makeMessage({ priority: 3 });
    const filename = messageFilename(msg.header);
    const msgPath = join(priDir, filename);
    await writeFile(msgPath, encodeMessage(msg), 'utf-8');

    const available = await isBundleAvailable(msgPath);
    expect(available).toBe(false);
  });
});

// ============================================================================
// DACP scan graceful degradation
// ============================================================================

describe('DACP scan graceful degradation', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('scan handles bus with only plain .msg (no bundles at all)', async () => {
    const transport = new DACPTransport(config);

    // Send plain messages (no bundleDir)
    await transport.send({
      priority: 3, opcode: 'EXEC', source: 'coordinator', target: 'executor', payload: ['cmd1'],
    });
    await transport.send({
      priority: 5, opcode: 'STATUS', source: 'monitor', target: 'executor', payload: ['ok'],
    });

    const entries = await transport.scan('executor');
    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.bundlePath === null)).toBe(true);
  });

  it('scan works when some messages have bundles and some do not', async () => {
    const transport = new DACPTransport(config);
    const bundleSource = join(config.busDir, 'test-bundle');
    await mkdir(bundleSource, { recursive: true });
    await writeFile(join(bundleSource, 'manifest.json'), '{}');

    // One with bundle
    await transport.send({
      priority: 3, opcode: 'EXEC', source: 'coordinator', target: 'executor',
      payload: ['with bundle'], bundleDir: bundleSource,
    });

    // One without bundle
    await transport.send({
      priority: 5, opcode: 'STATUS', source: 'monitor', target: 'executor',
      payload: ['no bundle'],
    });

    const entries = await transport.scan('executor');
    expect(entries.length).toBe(2);

    const withBundle = entries.find((e) => e.bundlePath !== null);
    const withoutBundle = entries.find((e) => e.bundlePath === null);

    expect(withBundle).toBeDefined();
    expect(withoutBundle).toBeDefined();
    expect(withBundle!.opcode).toBe('EXEC');
    expect(withoutBundle!.opcode).toBe('STATUS');
  });
});
