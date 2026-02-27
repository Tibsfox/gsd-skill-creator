/**
 * Tests for the DACP bus transport layer.
 *
 * Verifies: DACPTransport.send(), scan(), acknowledge(), hasBundleCompanion().
 * Uses temp directories following the same pattern as den/bus.test.ts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { DACPTransport } from './transport.js';
import { initBus, sendMessage } from '../../den/bus.js';
import { formatTimestamp, messageFilename } from '../../den/encoder.js';
import type { BusConfig, BusMessage } from '../../den/types.js';

// ============================================================================
// Helpers
// ============================================================================

async function makeTempConfig(): Promise<{ config: BusConfig; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'dacp-bus-test-'));
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

/** Create a pre-built bundle directory with test content */
async function makeBundleDir(baseDir: string): Promise<string> {
  const bundleDir = join(baseDir, 'test-bundle');
  await mkdir(bundleDir, { recursive: true });
  await writeFile(join(bundleDir, 'manifest.json'), JSON.stringify({ name: 'test' }));
  await writeFile(join(bundleDir, 'intent.md'), '# Test Intent');
  return bundleDir;
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
// DACPTransport
// ============================================================================

describe('DACPTransport', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;
  let transport: DACPTransport;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
    transport = new DACPTransport(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  // --------------------------------------------------------------------------
  // send()
  // --------------------------------------------------------------------------

  describe('send()', () => {
    it('creates both .msg and .bundle/ in the correct priority directory', async () => {
      const bundleDir = await makeBundleDir(config.busDir);

      const msgPath = await transport.send({
        priority: 3,
        opcode: 'EXEC',
        source: 'coordinator',
        target: 'executor',
        payload: ['test line'],
        bundleDir,
      });

      // .msg file must exist
      const msgStat = await stat(msgPath);
      expect(msgStat.isFile()).toBe(true);

      // .bundle/ dir must exist alongside with matching stem
      const stem = msgPath.replace(/\.msg$/, '');
      const bundlePath = `${stem}.bundle`;
      const bundleStat = await stat(bundlePath);
      expect(bundleStat.isDirectory()).toBe(true);

      // Bundle should contain copied files
      const bundleContents = await readdir(bundlePath);
      expect(bundleContents).toContain('manifest.json');
      expect(bundleContents).toContain('intent.md');
    });

    it('creates only .msg file when no bundleDir is provided (plain message)', async () => {
      const msgPath = await transport.send({
        priority: 1,
        opcode: 'STATUS',
        source: 'monitor',
        target: 'coordinator',
        payload: ['status ok'],
      });

      // .msg file must exist
      const msgStat = await stat(msgPath);
      expect(msgStat.isFile()).toBe(true);

      // .bundle/ must NOT exist
      const stem = msgPath.replace(/\.msg$/, '');
      const bundlePath = `${stem}.bundle`;
      await expect(stat(bundlePath)).rejects.toThrow();
    });

    it('uses consistent naming: {timestamp}-{opcode}-{src}-{dst}.bundle/', async () => {
      const bundleDir = await makeBundleDir(config.busDir);

      const msgPath = await transport.send({
        priority: 5,
        opcode: 'SEND',
        source: 'relay',
        target: 'executor',
        payload: ['data'],
        bundleDir,
      });

      // Both paths share the same stem
      const msgFilename = msgPath.split('/').pop()!;
      expect(msgFilename).toMatch(/^\d{8}-\d{6}-SEND-relay-executor\.msg$/);

      const stem = msgPath.replace(/\.msg$/, '');
      const bundlePath = `${stem}.bundle`;
      const bundleExists = await stat(bundlePath).then(() => true).catch(() => false);
      expect(bundleExists).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // scan()
  // --------------------------------------------------------------------------

  describe('scan()', () => {
    it('returns bundle-enhanced entries with bundlePath populated', async () => {
      const bundleDir = await makeBundleDir(config.busDir);

      await transport.send({
        priority: 2,
        opcode: 'EXEC',
        source: 'coordinator',
        target: 'executor',
        payload: ['line1'],
        bundleDir,
      });

      const entries = await transport.scan('executor');
      expect(entries.length).toBe(1);
      expect(entries[0].bundlePath).not.toBeNull();
      expect(entries[0].opcode).toBe('EXEC');
      expect(entries[0].source).toBe('coordinator');
      expect(entries[0].target).toBe('executor');
    });

    it('returns plain msg entries with bundlePath: null', async () => {
      await transport.send({
        priority: 4,
        opcode: 'STATUS',
        source: 'monitor',
        target: 'executor',
        payload: ['ok'],
      });

      const entries = await transport.scan('executor');
      expect(entries.length).toBe(1);
      expect(entries[0].bundlePath).toBeNull();
    });

    it('returns entries in priority order (priority-0 first)', async () => {
      // Send to different priorities
      await transport.send({
        priority: 7, opcode: 'NOP', source: 'monitor', target: 'executor', payload: ['low'],
      });
      await transport.send({
        priority: 0, opcode: 'HALT', source: 'coordinator', target: 'executor', payload: ['high'],
      });
      await transport.send({
        priority: 3, opcode: 'EXEC', source: 'planner', target: 'executor', payload: ['mid'],
      });

      const entries = await transport.scan('executor');
      expect(entries.length).toBe(3);
      expect(entries[0].priority).toBe(0);
      expect(entries[1].priority).toBe(3);
      expect(entries[2].priority).toBe(7);
    });

    it('filters by target agent', async () => {
      await transport.send({
        priority: 3, opcode: 'EXEC', source: 'coordinator', target: 'executor', payload: ['for exec'],
      });
      await transport.send({
        priority: 3, opcode: 'EXEC', source: 'coordinator', target: 'verifier', payload: ['for verifier'],
      });

      const entries = await transport.scan('executor');
      expect(entries.length).toBe(1);
      expect(entries[0].target).toBe('executor');
    });
  });

  // --------------------------------------------------------------------------
  // acknowledge()
  // --------------------------------------------------------------------------

  describe('acknowledge()', () => {
    it('moves both .msg and .bundle/ to acknowledged/ atomically', async () => {
      const bundleDir = await makeBundleDir(config.busDir);

      const msgPath = await transport.send({
        priority: 2,
        opcode: 'EXEC',
        source: 'coordinator',
        target: 'executor',
        payload: ['ack test'],
        bundleDir,
      });

      const stem = msgPath.replace(/\.msg$/, '');
      const bundlePath = `${stem}.bundle`;

      // Both exist in priority dir before ack
      expect(await stat(msgPath).then(() => true).catch(() => false)).toBe(true);
      expect(await stat(bundlePath).then(() => true).catch(() => false)).toBe(true);

      await transport.acknowledge(msgPath);

      // .msg moved to acknowledged/
      expect(await stat(msgPath).then(() => true).catch(() => false)).toBe(false);
      const ackDir = join(config.busDir, 'acknowledged');
      const ackFiles = await readdir(ackDir);
      const msgFilename = msgPath.split('/').pop()!;
      expect(ackFiles).toContain(msgFilename);

      // .bundle/ moved to acknowledged/
      const bundleDirname = bundlePath.split('/').pop()!;
      expect(ackFiles).toContain(bundleDirname);
      expect(await stat(bundlePath).then(() => true).catch(() => false)).toBe(false);
    });

    it('acknowledges plain .msg without bundle companion', async () => {
      const msgPath = await transport.send({
        priority: 4,
        opcode: 'STATUS',
        source: 'monitor',
        target: 'coordinator',
        payload: ['no bundle'],
      });

      await transport.acknowledge(msgPath);

      // .msg moved to acknowledged/
      expect(await stat(msgPath).then(() => true).catch(() => false)).toBe(false);
      const ackDir = join(config.busDir, 'acknowledged');
      const ackFiles = await readdir(ackDir);
      const msgFilename = msgPath.split('/').pop()!;
      expect(ackFiles).toContain(msgFilename);
    });
  });

  // --------------------------------------------------------------------------
  // hasBundleCompanion()
  // --------------------------------------------------------------------------

  describe('hasBundleCompanion()', () => {
    it('returns true when .bundle/ companion exists', async () => {
      const bundleDir = await makeBundleDir(config.busDir);

      const msgPath = await transport.send({
        priority: 3,
        opcode: 'EXEC',
        source: 'coordinator',
        target: 'executor',
        payload: ['companion test'],
        bundleDir,
      });

      const hasCompanion = await transport.hasBundleCompanion(msgPath);
      expect(hasCompanion).toBe(true);
    });

    it('returns false when no .bundle/ companion exists', async () => {
      const msgPath = await transport.send({
        priority: 3,
        opcode: 'EXEC',
        source: 'coordinator',
        target: 'executor',
        payload: ['no companion'],
      });

      const hasCompanion = await transport.hasBundleCompanion(msgPath);
      expect(hasCompanion).toBe(false);
    });
  });
});
