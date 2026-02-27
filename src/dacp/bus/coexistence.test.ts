/**
 * Integration tests proving .msg and .bundle/ coexist without conflict.
 *
 * These tests import DIRECTLY from den/ modules and verify that existing
 * bus operations ignore .bundle/ directories entirely. No DACP code is
 * used in the core assertions -- bundles are placed manually to prove
 * coexistence is inherent to the bus design.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  initBus,
  sendMessage,
  receiveMessages,
  acknowledgeMessage,
  deadLetterMessage,
  listMessages,
} from '../../den/bus.js';
import { encodeMessage, messageFilename, encodeHeader } from '../../den/encoder.js';
import { dispatchCycle } from '../../den/dispatcher.js';
import type { BusConfig, BusMessage } from '../../den/types.js';

// ============================================================================
// Helpers
// ============================================================================

async function makeTempConfig(): Promise<{ config: BusConfig; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'dacp-coexist-test-'));
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
 * Create a .bundle/ directory in a priority dir to simulate DACP presence.
 * This is done manually (not via DACPTransport) to prove coexistence is
 * inherent to the bus design.
 */
async function placeBundleDir(priorityDir: string, stem: string): Promise<string> {
  const bundlePath = join(priorityDir, `${stem}.bundle`);
  await mkdir(bundlePath, { recursive: true });
  await writeFile(join(bundlePath, 'manifest.json'), JSON.stringify({ test: true }));
  await writeFile(join(bundlePath, 'intent.md'), '# Test Bundle');
  return bundlePath;
}

// ============================================================================
// Coexistence Tests
// ============================================================================

describe('Bus Coexistence: .msg and .bundle/ in same directories', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('receiveMessages() returns only .msg content when .bundle/ dirs also exist', async () => {
    const priDir = join(config.busDir, 'priority-3');

    // Send 2 real messages
    const msg1 = makeMessage({ timestamp: '20260220-130000' });
    const msg2 = makeMessage({ timestamp: '20260220-130001', opcode: 'STATUS', src: 'monitor' });
    await sendMessage(config, msg1);
    await sendMessage(config, msg2);

    // Place 2 bundle dirs (manually, simulating DACP)
    await placeBundleDir(priDir, '20260220-130000-EXEC-coordinator-executor');
    await placeBundleDir(priDir, '20260220-130001-STATUS-monitor-executor');

    // receiveMessages should only return the 2 .msg files
    const messages = await receiveMessages(config, { priority: 3 });
    expect(messages.length).toBe(2);
    expect(messages[0].header.opcode).toBe('EXEC');
    expect(messages[1].header.opcode).toBe('STATUS');
  });

  it('listMessages() returns only .msg filenames when .bundle/ dirs coexist', async () => {
    const priDir = join(config.busDir, 'priority-1');

    // Send a real message
    const msg = makeMessage({ priority: 1, timestamp: '20260220-140000' });
    const msgPath = await sendMessage(config, msg);

    // Place a bundle dir alongside
    const stem = msgPath.split('/').pop()!.replace(/\.msg$/, '');
    await placeBundleDir(priDir, stem);

    const filenames = await listMessages(config, 1);
    expect(filenames.length).toBe(1);
    expect(filenames[0]).toMatch(/\.msg$/);
    expect(filenames.every((f) => !f.includes('.bundle'))).toBe(true);
  });

  it('acknowledgeMessage() moves .msg to acknowledged/ without touching companion .bundle/', async () => {
    const priDir = join(config.busDir, 'priority-2');

    const msg = makeMessage({ priority: 2, timestamp: '20260220-150000' });
    const msgPath = await sendMessage(config, msg);

    // Place bundle companion
    const stem = msgPath.split('/').pop()!.replace(/\.msg$/, '');
    const bundlePath = await placeBundleDir(priDir, stem);

    // Acknowledge only the .msg via den/bus
    await acknowledgeMessage(config, msgPath);

    // .msg should be in acknowledged/
    const ackFiles = await readdir(join(config.busDir, 'acknowledged'));
    const msgFilename = msgPath.split('/').pop()!;
    expect(ackFiles).toContain(msgFilename);

    // .bundle/ should REMAIN in priority dir (den/bus doesn't know about bundles)
    const priFiles = await readdir(priDir);
    expect(priFiles).toContain(`${stem}.bundle`);
  });

  it('dispatchCycle() processes only .msg files, ignoring .bundle/ dirs', async () => {
    const priDir = join(config.busDir, 'priority-3');

    // Send a message to executor
    const msg = makeMessage({ timestamp: '20260220-160000' });
    const msgPath = await sendMessage(config, msg);

    // Place bundle companion
    const stem = msgPath.split('/').pop()!.replace(/\.msg$/, '');
    await placeBundleDir(priDir, stem);

    let handlerCalled = 0;
    const handlers = {
      executor: async (m: BusMessage) => {
        handlerCalled++;
        expect(m.header.opcode).toBe('EXEC');
      },
    };

    const result = await dispatchCycle(config, handlers);

    expect(result.processed).toBe(1);
    expect(result.acknowledged).toBe(1);
    expect(handlerCalled).toBe(1);
  });

  it('sendMessage() (den/bus) still works correctly when .bundle/ dirs exist in target directory', async () => {
    const priDir = join(config.busDir, 'priority-3');

    // Place a pre-existing bundle dir
    await placeBundleDir(priDir, '20260220-100000-EXEC-planner-executor');

    // Now send a regular message via den/bus
    const msg = makeMessage({ timestamp: '20260220-170000' });
    const msgPath = await sendMessage(config, msg);

    // Message should be written successfully
    const priFiles = await readdir(priDir);
    const msgFilename = msgPath.split('/').pop()!;
    expect(priFiles).toContain(msgFilename);
    expect(priFiles.filter((f) => f.endsWith('.msg')).length).toBe(1);
    expect(priFiles.filter((f) => f.endsWith('.bundle')).length).toBe(1);
  });

  it('ISA header encoding is identical with and without DACP bundles present', () => {
    const msg = makeMessage({ timestamp: '20260220-180000', priority: 2 });

    // Encode the header
    const headerLine = encodeHeader(msg.header);

    // Verify exact pipe-delimited ISA format
    expect(headerLine).toBe('20260220-180000|2|EXEC|coordinator|executor|1');

    // Format: TIMESTAMP|PRIORITY|OPCODE|SRC|DST|LENGTH
    const parts = headerLine.split('|');
    expect(parts.length).toBe(6);
    expect(parts[0]).toBe('20260220-180000');
    expect(parts[1]).toBe('2');
    expect(parts[2]).toBe('EXEC');
    expect(parts[3]).toBe('coordinator');
    expect(parts[4]).toBe('executor');
    expect(parts[5]).toBe('1');
  });

  it('message filename format is preserved unchanged', () => {
    const msg = makeMessage({ timestamp: '20260220-190000' });
    const filename = messageFilename(msg.header);

    expect(filename).toBe('20260220-190000-EXEC-coordinator-executor.msg');
    expect(filename).toMatch(/^\d{8}-\d{6}-[A-Z]+-\w+-\w+\.msg$/);
  });

  it('deadLetterMessage() moves only .msg to dead-letter/, ignoring companion .bundle/', async () => {
    const priDir = join(config.busDir, 'priority-4');

    const msg = makeMessage({ priority: 4, timestamp: '20260220-200000' });
    const msgPath = await sendMessage(config, msg);

    // Place bundle companion
    const stem = msgPath.split('/').pop()!.replace(/\.msg$/, '');
    const bundlePath = await placeBundleDir(priDir, stem);

    // Dead-letter the .msg via den/bus
    await deadLetterMessage(config, msgPath, 'test reason');

    // .msg and .meta should be in dead-letter/
    const dlFiles = await readdir(join(config.busDir, 'dead-letter'));
    const msgFilename = msgPath.split('/').pop()!;
    expect(dlFiles).toContain(msgFilename);
    expect(dlFiles).toContain(`${msgFilename}.meta`);

    // .bundle/ should REMAIN in priority dir
    const priFiles = await readdir(priDir);
    expect(priFiles).toContain(`${stem}.bundle`);
  });
});
