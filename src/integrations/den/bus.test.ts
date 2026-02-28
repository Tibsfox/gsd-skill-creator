/**
 * Tests for the Den filesystem-based message bus.
 *
 * Each test creates a temp directory and cleans up after.
 * Verifies: initBus, sendMessage, receiveMessages, acknowledgeMessage,
 * deadLetterMessage, listMessages, getMessagePath.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  initBus,
  sendMessage,
  receiveMessages,
  acknowledgeMessage,
  deadLetterMessage,
  listMessages,
  getMessagePath,
} from './bus.js';
import { encodeMessage } from './encoder.js';
import type { BusConfig, BusMessage } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a temp directory and return a BusConfig pointing to it */
async function makeTempConfig(): Promise<{ config: BusConfig; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'den-bus-test-'));
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

/** Create a test message with given parameters */
function makeMessage(overrides: Partial<{
  priority: number;
  opcode: string;
  src: string;
  dst: string;
  timestamp: string;
  payload: string[];
}> = {}): BusMessage {
  const payload = overrides.payload ?? ['test payload line'];
  return {
    header: {
      timestamp: overrides.timestamp ?? '20260220-130000',
      priority: overrides.priority ?? 1,
      opcode: (overrides.opcode ?? 'EXEC') as BusMessage['header']['opcode'],
      src: (overrides.src ?? 'coordinator') as BusMessage['header']['src'],
      dst: (overrides.dst ?? 'executor') as BusMessage['header']['dst'],
      length: payload.length,
    },
    payload,
  };
}

// ============================================================================
// initBus
// ============================================================================

describe('initBus', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
  });

  afterEach(async () => {
    await cleanup();
  });

  it('creates priority-0 through priority-7 directories', async () => {
    await initBus(config);
    for (let i = 0; i <= 7; i++) {
      const s = await stat(join(config.busDir, `priority-${i}`));
      expect(s.isDirectory()).toBe(true);
    }
  });

  it('creates acknowledged/ directory', async () => {
    await initBus(config);
    const s = await stat(join(config.busDir, 'acknowledged'));
    expect(s.isDirectory()).toBe(true);
  });

  it('creates dead-letter/ directory', async () => {
    await initBus(config);
    const s = await stat(join(config.busDir, 'dead-letter'));
    expect(s.isDirectory()).toBe(true);
  });

  it('is idempotent (calling twice does not error or duplicate)', async () => {
    await initBus(config);
    await expect(initBus(config)).resolves.toBeUndefined();

    // Still have exactly 10 directories
    const entries = await readdir(config.busDir);
    expect(entries.sort()).toEqual([
      'acknowledged',
      'dead-letter',
      'priority-0',
      'priority-1',
      'priority-2',
      'priority-3',
      'priority-4',
      'priority-5',
      'priority-6',
      'priority-7',
    ]);
  });

  it('uses config.busDir as root', async () => {
    await initBus(config);
    const s = await stat(config.busDir);
    expect(s.isDirectory()).toBe(true);
  });
});

// ============================================================================
// sendMessage
// ============================================================================

describe('sendMessage', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('writes message with priority 1 to priority-1/ directory', async () => {
    const msg = makeMessage({ priority: 1 });
    const path = await sendMessage(config, msg);
    expect(path).toContain('priority-1');
    const s = await stat(path);
    expect(s.isFile()).toBe(true);
  });

  it('filename follows {timestamp}-{opcode}-{src}-{dst}.msg format', async () => {
    const msg = makeMessage({
      timestamp: '20260220-140000',
      opcode: 'EXEC',
      src: 'coordinator',
      dst: 'executor',
    });
    const path = await sendMessage(config, msg);
    const filename = path.split('/').pop()!;
    expect(filename).toBe('20260220-140000-EXEC-coordinator-executor.msg');
  });

  it('file content matches encodeMessage(message) exactly', async () => {
    const msg = makeMessage();
    const path = await sendMessage(config, msg);
    const content = await readFile(path, 'utf-8');
    expect(content).toBe(encodeMessage(msg));
  });

  it('returns the full path to the written file', async () => {
    const msg = makeMessage();
    const path = await sendMessage(config, msg);
    expect(typeof path).toBe('string');
    expect(path.startsWith('/')).toBe(true);
    expect(path.endsWith('.msg')).toBe(true);
  });
});

// ============================================================================
// receiveMessages
// ============================================================================

describe('receiveMessages', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns priority-0 messages before priority-2 messages', async () => {
    const msg0 = makeMessage({ priority: 0, timestamp: '20260220-130002' });
    const msg2 = makeMessage({ priority: 2, timestamp: '20260220-130001' });

    await sendMessage(config, msg2);
    await sendMessage(config, msg0);

    const received = await receiveMessages(config);
    expect(received.length).toBe(2);
    expect(received[0].header.priority).toBe(0);
    expect(received[1].header.priority).toBe(2);
  });

  it('within same priority, returns in chronological order', async () => {
    const msg1 = makeMessage({ priority: 3, timestamp: '20260220-130001', dst: 'relay' });
    const msg2 = makeMessage({ priority: 3, timestamp: '20260220-130002', dst: 'monitor' });

    await sendMessage(config, msg1);
    await sendMessage(config, msg2);

    const received = await receiveMessages(config);
    expect(received.length).toBe(2);
    expect(received[0].header.timestamp).toBe('20260220-130001');
    expect(received[1].header.timestamp).toBe('20260220-130002');
  });

  it('with maxCount option, returns at most N messages', async () => {
    for (let i = 0; i < 10; i++) {
      const msg = makeMessage({
        priority: 1,
        timestamp: `20260220-1300${i.toString().padStart(2, '0')}`,
        dst: i % 2 === 0 ? 'executor' : 'relay',
      });
      await sendMessage(config, msg);
    }

    const received = await receiveMessages(config, { maxCount: 5 });
    expect(received.length).toBe(5);
  });

  it('with priority filter, returns only messages from that priority', async () => {
    const msg1 = makeMessage({ priority: 1, timestamp: '20260220-130001' });
    const msg2 = makeMessage({ priority: 2, timestamp: '20260220-130002', dst: 'relay' });
    const msg3 = makeMessage({ priority: 2, timestamp: '20260220-130003', dst: 'monitor' });

    await sendMessage(config, msg1);
    await sendMessage(config, msg2);
    await sendMessage(config, msg3);

    const received = await receiveMessages(config, { priority: 2 });
    expect(received.length).toBe(2);
    expect(received.every((m) => m.header.priority === 2)).toBe(true);
  });

  it('with dst filter, returns only messages for that destination', async () => {
    const msg1 = makeMessage({ priority: 1, dst: 'coordinator', timestamp: '20260220-130001' });
    const msg2 = makeMessage({ priority: 1, dst: 'executor', timestamp: '20260220-130002' });
    const msg3 = makeMessage({ priority: 2, dst: 'coordinator', timestamp: '20260220-130003' });

    await sendMessage(config, msg1);
    await sendMessage(config, msg2);
    await sendMessage(config, msg3);

    const received = await receiveMessages(config, { dst: 'coordinator' });
    expect(received.length).toBe(2);
    expect(received.every((m) => m.header.dst === 'coordinator')).toBe(true);
  });

  it('empty bus returns empty array', async () => {
    const received = await receiveMessages(config);
    expect(received).toEqual([]);
  });
});

// ============================================================================
// acknowledgeMessage
// ============================================================================

describe('acknowledgeMessage', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('moves file from priority-N/ to acknowledged/', async () => {
    const msg = makeMessage({ priority: 3 });
    const msgPath = await sendMessage(config, msg);

    await acknowledgeMessage(config, msgPath);

    const filename = msgPath.split('/').pop()!;
    const ackPath = join(config.busDir, 'acknowledged', filename);
    const s = await stat(ackPath);
    expect(s.isFile()).toBe(true);
  });

  it('original file no longer exists after acknowledge', async () => {
    const msg = makeMessage({ priority: 5 });
    const msgPath = await sendMessage(config, msg);

    await acknowledgeMessage(config, msgPath);

    await expect(stat(msgPath)).rejects.toThrow();
  });

  it('acknowledged file retains original content', async () => {
    const msg = makeMessage({ priority: 2 });
    const msgPath = await sendMessage(config, msg);
    const originalContent = await readFile(msgPath, 'utf-8');

    await acknowledgeMessage(config, msgPath);

    const filename = msgPath.split('/').pop()!;
    const ackPath = join(config.busDir, 'acknowledged', filename);
    const ackContent = await readFile(ackPath, 'utf-8');
    expect(ackContent).toBe(originalContent);
  });

  it('throws descriptive error for non-existent path', async () => {
    const fakePath = join(config.busDir, 'priority-0', 'nonexistent.msg');
    await expect(acknowledgeMessage(config, fakePath)).rejects.toThrow(/nonexistent\.msg/);
  });
});

// ============================================================================
// deadLetterMessage
// ============================================================================

describe('deadLetterMessage', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('moves file to dead-letter/', async () => {
    const msg = makeMessage({ priority: 1 });
    const msgPath = await sendMessage(config, msg);

    await deadLetterMessage(config, msgPath, 'unknown destination');

    const filename = msgPath.split('/').pop()!;
    const dlPath = join(config.busDir, 'dead-letter', filename);
    const s = await stat(dlPath);
    expect(s.isFile()).toBe(true);
  });

  it('creates .meta sidecar file with JSON metadata', async () => {
    const msg = makeMessage({ priority: 4 });
    const msgPath = await sendMessage(config, msg);

    await deadLetterMessage(config, msgPath, 'route not found');

    const filename = msgPath.split('/').pop()!;
    const metaPath = join(config.busDir, 'dead-letter', `${filename}.meta`);
    const metaContent = await readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaContent);

    expect(meta).toHaveProperty('originalPath', msgPath);
    expect(meta).toHaveProperty('reason', 'route not found');
    expect(meta).toHaveProperty('timestamp');
  });

  it('preserves reason string in meta file', async () => {
    const msg = makeMessage({ priority: 6 });
    const msgPath = await sendMessage(config, msg);
    const reason = 'agent executor is offline';

    await deadLetterMessage(config, msgPath, reason);

    const filename = msgPath.split('/').pop()!;
    const metaPath = join(config.busDir, 'dead-letter', `${filename}.meta`);
    const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
    expect(meta.reason).toBe(reason);
  });
});

// ============================================================================
// listMessages
// ============================================================================

describe('listMessages', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
    await initBus(config);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns sorted array of .msg filenames', async () => {
    const msg1 = makeMessage({ priority: 2, timestamp: '20260220-130002', dst: 'relay' });
    const msg2 = makeMessage({ priority: 2, timestamp: '20260220-130001', dst: 'monitor' });

    await sendMessage(config, msg1);
    await sendMessage(config, msg2);

    const files = await listMessages(config, 2);
    expect(files.length).toBe(2);
    // Sorted alphabetically = chronologically due to timestamp prefix
    expect(files[0]).toContain('130001');
    expect(files[1]).toContain('130002');
  });

  it('with priority filter, only lists that directory', async () => {
    const msg1 = makeMessage({ priority: 0, timestamp: '20260220-130001' });
    const msg2 = makeMessage({ priority: 3, timestamp: '20260220-130002', dst: 'relay' });

    await sendMessage(config, msg1);
    await sendMessage(config, msg2);

    const files = await listMessages(config, 0);
    expect(files.length).toBe(1);
    expect(files[0]).toContain('130001');
  });

  it('without priority filter, lists all priority directories', async () => {
    const msg1 = makeMessage({ priority: 1, timestamp: '20260220-130001' });
    const msg2 = makeMessage({ priority: 5, timestamp: '20260220-130002', dst: 'relay' });

    await sendMessage(config, msg1);
    await sendMessage(config, msg2);

    const files = await listMessages(config);
    expect(files.length).toBe(2);
  });
});

// ============================================================================
// getMessagePath
// ============================================================================

describe('getMessagePath', () => {
  let config: BusConfig;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ config, cleanup } = await makeTempConfig());
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns correct absolute path for priority dir and filename', () => {
    const path = getMessagePath(config, 3, 'test-message.msg');
    expect(path).toBe(join(config.busDir, 'priority-3', 'test-message.msg'));
  });
});
