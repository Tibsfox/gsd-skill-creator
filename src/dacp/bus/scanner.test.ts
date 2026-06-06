/**
 * Tests for the DACP bus scanner that detects .bundle/ directories
 * alongside .msg files in priority directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { tmpdir } from 'node:os';

import { scanForBundles, scanPriorityDirWithBundles } from './scanner.js';
import { initBus, sendMessage } from '../../den/bus.js';
import { encodeMessage, messageFilename } from '../../den/encoder.js';
import type { BusConfig, BusMessage } from '../../den/types.js';
import {
  CapturingAuditSink,
  defaultLoaderContext,
  LoaderContextDenied,
  type LoaderContext,
} from '../../security/loader-context.js';

// ============================================================================
// Helpers
// ============================================================================

async function makeTempConfig(): Promise<{ config: BusConfig; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'dacp-scanner-test-'));
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

/** Create a .msg file and optionally a companion .bundle/ dir */
async function writeMsgAndBundle(
  priorityDir: string,
  msg: BusMessage,
  withBundle: boolean,
): Promise<{ msgPath: string; bundlePath: string | null }> {
  const filename = messageFilename(msg.header);
  const msgPath = join(priorityDir, filename);
  await writeFile(msgPath, encodeMessage(msg), 'utf-8');

  let bundlePath: string | null = null;
  if (withBundle) {
    const stem = filename.replace(/\.msg$/, '');
    bundlePath = join(priorityDir, `${stem}.bundle`);
    await mkdir(bundlePath, { recursive: true });
    await writeFile(join(bundlePath, 'manifest.json'), '{}');
  }

  return { msgPath, bundlePath };
}

// ============================================================================
// scanForBundles
// ============================================================================

describe('scanForBundles', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('finds .bundle/ dirs alongside .msg files', async () => {
    const priDir = join(config.busDir, 'priority-3');
    const msg = makeMessage({ priority: 3 });
    await writeMsgAndBundle(priDir, msg, true);

    const entries = await scanForBundles(config);
    expect(entries.length).toBe(1);
    expect(entries[0].bundlePath).not.toBeNull();
    expect(entries[0].opcode).toBe('EXEC');
  });

  it('returns plain msgs when no bundles exist', async () => {
    const priDir = join(config.busDir, 'priority-3');
    const msg = makeMessage({ priority: 3 });
    await writeMsgAndBundle(priDir, msg, false);

    const entries = await scanForBundles(config);
    expect(entries.length).toBe(1);
    expect(entries[0].bundlePath).toBeNull();
  });

  it('scans priority dirs in order (0 before 7)', async () => {
    const msg0 = makeMessage({ priority: 0, opcode: 'HALT', timestamp: '20260220-130001' });
    const msg7 = makeMessage({ priority: 7, opcode: 'NOP', timestamp: '20260220-130000' });

    await writeMsgAndBundle(join(config.busDir, 'priority-0'), msg0, false);
    await writeMsgAndBundle(join(config.busDir, 'priority-7'), msg7, false);

    const entries = await scanForBundles(config);
    expect(entries.length).toBe(2);
    expect(entries[0].priority).toBe(0);
    expect(entries[1].priority).toBe(7);
  });
});

// ============================================================================
// scanPriorityDirWithBundles
// ============================================================================

describe('scanPriorityDirWithBundles', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('pairs .msg and .bundle/ by stem name', async () => {
    const priDir = join(config.busDir, 'priority-2');
    const msg = makeMessage({ priority: 2 });
    const { msgPath, bundlePath } = await writeMsgAndBundle(priDir, msg, true);

    const entries = await scanPriorityDirWithBundles(priDir, 2);
    expect(entries.length).toBe(1);
    expect(entries[0].msgPath).toBe(msgPath);
    expect(entries[0].bundlePath).toBe(bundlePath);
  });

  it('handles mixed content (some msgs have bundles, some dont)', async () => {
    const priDir = join(config.busDir, 'priority-3');

    const msgWithBundle = makeMessage({ timestamp: '20260220-130000' });
    const msgWithout = makeMessage({ timestamp: '20260220-130001', opcode: 'STATUS', src: 'monitor' });

    await writeMsgAndBundle(priDir, msgWithBundle, true);
    await writeMsgAndBundle(priDir, msgWithout, false);

    const entries = await scanPriorityDirWithBundles(priDir, 3);
    expect(entries.length).toBe(2);

    const withBundle = entries.find(e => e.bundlePath !== null);
    const withoutBundle = entries.find(e => e.bundlePath === null);

    expect(withBundle).toBeDefined();
    expect(withoutBundle).toBeDefined();
  });

  it('ignores non-.msg and non-.bundle entries', async () => {
    const priDir = join(config.busDir, 'priority-3');
    const msg = makeMessage({ priority: 3 });
    await writeMsgAndBundle(priDir, msg, false);

    // Write some junk entries
    await writeFile(join(priDir, 'random.txt'), 'junk');
    await writeFile(join(priDir, 'notes.log'), 'junk');
    await mkdir(join(priDir, 'random-dir'), { recursive: true });

    const entries = await scanPriorityDirWithBundles(priDir, 3);
    expect(entries.length).toBe(1);
    expect(entries[0].opcode).toBe('EXEC');
  });
});

// ============================================================================
// LoaderContext chokepoint integration (v1.49.892 — two-site hoisted-check)
// ============================================================================

describe('LoaderContext chokepoint integration (v1.49.892)', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('emits an audit record for the busDir at scanForBundles + one per priority subdir scanned', async () => {
    const msg = makeMessage({ priority: 3 });
    await writeMsgAndBundle(join(config.busDir, 'priority-3'), msg, false);

    const sink = new CapturingAuditSink();
    await scanForBundles(config, undefined, defaultLoaderContext(sink));

    // 1 outer (busDir) + 8 inner (priority-0..priority-7) = 9
    expect(sink.records.length).toBe(9);
    expect(sink.records[0].source).toBe('dacp/bus/scanner');
    expect(sink.records[0].op).toBe('read-dir');
    expect(sink.records[0].target).toBe(config.busDir);
    expect(sink.records.every((r) => r.allowed === true)).toBe(true);
  });

  it('throws LoaderContextDenied at scanForBundles when busDir is not in allowList', async () => {
    const sink = new CapturingAuditSink();
    const restrictedCtx: LoaderContext = {
      allowList: ['/nowhere/at/all'],
      audit: sink,
    };
    await expect(scanForBundles(config, undefined, restrictedCtx)).rejects.toBeInstanceOf(
      LoaderContextDenied,
    );
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0].allowed).toBe(false);
    expect(sink.records[0].target).toBe(config.busDir);
  });

  it('throws LoaderContextDenied at scanPriorityDirWithBundles when dirPath is not in allowList (direct caller)', async () => {
    const sink = new CapturingAuditSink();
    const restrictedCtx: LoaderContext = {
      allowList: ['/somewhere/else'],
      audit: sink,
    };
    const priDir = join(config.busDir, 'priority-3');
    await expect(
      scanPriorityDirWithBundles(priDir, 3, restrictedCtx),
    ).rejects.toBeInstanceOf(LoaderContextDenied);
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0].target).toBe(priDir);
  });

  it('legacy permissive mode when ctx is undefined (no audit, no denial)', async () => {
    const msg = makeMessage({ priority: 3 });
    await writeMsgAndBundle(join(config.busDir, 'priority-3'), msg, false);

    const entries = await scanForBundles(config);
    expect(entries.length).toBe(1);
  });

  it('admits busDir via prefix-pattern in allowList', async () => {
    const msg = makeMessage({ priority: 3 });
    await writeMsgAndBundle(join(config.busDir, 'priority-3'), msg, false);

    const sink = new CapturingAuditSink();
    // Prefix-pattern uses the platform path separator so the inner
    // priority-N subdir audits (busDir/priority-3, etc.) match on Windows
    // (backslash) as well as POSIX (forward slash). matchesAllowList does a
    // raw string startsWith — a literal '/' would never match a backslash
    // child path on win32.
    const prefixCtx: LoaderContext = {
      allowList: [`${config.busDir}${sep}`],
      audit: sink,
    };
    const entries = await scanForBundles(config, undefined, prefixCtx);
    expect(entries.length).toBe(1);
    expect(sink.records.every((r) => r.allowed === true)).toBe(true);
  });

  it('denial at outer scanForBundles propagates BEFORE the priority loop runs', async () => {
    const sink = new CapturingAuditSink();
    const restrictedCtx: LoaderContext = {
      allowList: ['/explicitly/only/this'],
      audit: sink,
    };
    await expect(scanForBundles(config, undefined, restrictedCtx)).rejects.toBeInstanceOf(
      LoaderContextDenied,
    );
    // Only the outer busDir audit record — no priority subdir was scanned.
    expect(sink.records).toHaveLength(1);
  });
});
