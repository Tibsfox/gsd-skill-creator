/**
 * Tests for the Communication Log module (GSD Den COMMS visualization).
 *
 * Covers: CommsLogConfigSchema, TimelineEntrySchema, CommsTimelineSchema,
 * scanBusMessages, buildTimeline, filterTimeline, formatTimelineMarkdown,
 * CommsLog class, createCommsLog factory.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { encodeMessage, formatTimestamp } from './encoder.js';
import type { BusMessage } from './types.js';

import {
  CommsLogConfigSchema,
  TimelineEntrySchema,
  CommsTimelineSchema,
  scanBusMessages,
  buildTimeline,
  filterTimeline,
  formatTimelineMarkdown,
  CommsLog,
  createCommsLog,
} from './comms-log.js';

// ============================================================================
// Test helpers
// ============================================================================

/**
 * Create a valid BusMessage for testing.
 */
function makeMessage(overrides: {
  priority?: number;
  opcode?: string;
  src?: string;
  dst?: string;
  timestamp?: string;
  payload?: string[];
} = {}): BusMessage {
  const priority = overrides.priority ?? 6;
  const payload = overrides.payload ?? ['test payload line'];
  return {
    header: {
      timestamp: overrides.timestamp ?? '20260220-120000',
      priority,
      opcode: (overrides.opcode ?? 'STATUS') as 'STATUS',
      src: (overrides.src ?? 'coordinator') as 'coordinator',
      dst: (overrides.dst ?? 'executor') as 'executor',
      length: payload.length,
    },
    payload,
  } as BusMessage;
}

/**
 * Write a .msg file to the given priority directory.
 */
async function writeMsg(
  busDir: string,
  priority: number,
  filename: string,
  msg: BusMessage,
): Promise<void> {
  const dir = join(busDir, `priority-${priority}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), encodeMessage(msg), 'utf-8');
}

// ============================================================================
// CommsLogConfigSchema
// ============================================================================

describe('CommsLogConfigSchema', () => {
  it('applies default maxEntries', () => {
    const config = CommsLogConfigSchema.parse({ busConfig: {} });
    expect(config.maxEntries).toBe(200);
    expect(config.busConfig).toEqual({});
  });

  it('accepts overrides', () => {
    const config = CommsLogConfigSchema.parse({
      busConfig: { busDir: '/tmp/bus' },
      maxEntries: 50,
    });
    expect(config.maxEntries).toBe(50);
    expect(config.busConfig).toEqual({ busDir: '/tmp/bus' });
  });

  it('rejects non-positive maxEntries', () => {
    expect(() =>
      CommsLogConfigSchema.parse({ busConfig: {}, maxEntries: 0 }),
    ).toThrow();
    expect(() =>
      CommsLogConfigSchema.parse({ busConfig: {}, maxEntries: -1 }),
    ).toThrow();
  });
});

// ============================================================================
// TimelineEntrySchema
// ============================================================================

describe('TimelineEntrySchema', () => {
  it('parses a valid entry', () => {
    const entry = {
      timestamp: '20260220-120000',
      priority: 6,
      priorityName: 'STATUS',
      opcode: 'STATUS',
      src: 'coordinator',
      dst: 'executor',
      payloadSummary: 'test payload line',
      filename: '20260220-120000-STATUS-coordinator-executor.msg',
    };

    const result = TimelineEntrySchema.parse(entry);
    expect(result.timestamp).toBe('20260220-120000');
    expect(result.priority).toBe(6);
    expect(result.priorityName).toBe('STATUS');
    expect(result.opcode).toBe('STATUS');
    expect(result.src).toBe('coordinator');
    expect(result.dst).toBe('executor');
    expect(result.payloadSummary).toBe('test payload line');
    expect(result.filename).toBe('20260220-120000-STATUS-coordinator-executor.msg');
  });

  it('rejects invalid priority range', () => {
    expect(() =>
      TimelineEntrySchema.parse({
        timestamp: '20260220-120000',
        priority: 8,
        priorityName: 'INVALID',
        opcode: 'STATUS',
        src: 'coordinator',
        dst: 'executor',
        payloadSummary: 'test',
        filename: 'test.msg',
      }),
    ).toThrow();

    expect(() =>
      TimelineEntrySchema.parse({
        timestamp: '20260220-120000',
        priority: -1,
        priorityName: 'INVALID',
        opcode: 'STATUS',
        src: 'coordinator',
        dst: 'executor',
        payloadSummary: 'test',
        filename: 'test.msg',
      }),
    ).toThrow();
  });
});

// ============================================================================
// CommsTimelineSchema
// ============================================================================

describe('CommsTimelineSchema', () => {
  it('parses a valid timeline', () => {
    const timeline = {
      generatedAt: '20260220-150000',
      totalMessages: 2,
      entries: [
        {
          timestamp: '20260220-120000',
          priority: 6,
          priorityName: 'STATUS',
          opcode: 'STATUS',
          src: 'coordinator',
          dst: 'executor',
          payloadSummary: 'test payload',
          filename: 'msg1.msg',
        },
        {
          timestamp: '20260220-110000',
          priority: 0,
          priorityName: 'HALT',
          opcode: 'HALT',
          src: 'sentinel',
          dst: 'all',
          payloadSummary: 'emergency stop',
          filename: 'msg2.msg',
        },
      ],
      priorityBreakdown: { '0': 1, '6': 1 },
    };

    const result = CommsTimelineSchema.parse(timeline);
    expect(result.totalMessages).toBe(2);
    expect(result.entries).toHaveLength(2);
    expect(result.priorityBreakdown).toEqual({ '0': 1, '6': 1 });
  });
});

// ============================================================================
// scanBusMessages
// ============================================================================

describe('scanBusMessages', () => {
  let tmpDir: string;
  let busDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'comms-log-scan-'));
    busDir = join(tmpDir, 'bus');
    // Create all 8 priority directories + acknowledged
    for (let i = 0; i < 8; i++) {
      await mkdir(join(busDir, `priority-${i}`), { recursive: true });
    }
    await mkdir(join(busDir, 'acknowledged'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('scans messages across multiple priority directories', async () => {
    const msg1 = makeMessage({ priority: 2, opcode: 'CMP', src: 'verifier', dst: 'coordinator', timestamp: '20260220-100000' });
    const msg2 = makeMessage({ priority: 6, opcode: 'STATUS', src: 'monitor', dst: 'coordinator', timestamp: '20260220-110000' });
    const msg3 = makeMessage({ priority: 6, opcode: 'STATUS', src: 'executor', dst: 'coordinator', timestamp: '20260220-120000' });

    await writeMsg(busDir, 2, '20260220-100000-CMP-verifier-coordinator.msg', msg1);
    await writeMsg(busDir, 6, '20260220-110000-STATUS-monitor-coordinator.msg', msg2);
    await writeMsg(busDir, 6, '20260220-120000-STATUS-executor-coordinator.msg', msg3);

    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const results = await scanBusMessages(busConfig);

    expect(results).toHaveLength(3);
  });

  it('returns empty array for empty bus directory', async () => {
    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const results = await scanBusMessages(busConfig);

    expect(results).toHaveLength(0);
  });

  it('skips corrupt message files without throwing', async () => {
    // Write a valid message
    const msg1 = makeMessage({ priority: 6, timestamp: '20260220-100000' });
    await writeMsg(busDir, 6, '20260220-100000-STATUS-coordinator-executor.msg', msg1);

    // Write a corrupt file
    await writeFile(join(busDir, 'priority-6', 'corrupt.msg'), 'this is not a valid message', 'utf-8');

    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const results = await scanBusMessages(busConfig);

    // Only the valid message should be returned
    expect(results).toHaveLength(1);
    expect(results[0].filename).toContain('20260220-100000');
  });

  it('scans acknowledged directory', async () => {
    const msg = makeMessage({ priority: 6, timestamp: '20260220-100000' });
    const encoded = encodeMessage(msg);
    await writeFile(join(busDir, 'acknowledged', '20260220-100000-STATUS-coordinator-executor.msg'), encoded, 'utf-8');

    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const results = await scanBusMessages(busConfig);

    expect(results.length).toBeGreaterThanOrEqual(1);
    const ackMsg = results.find(r => r.filename.includes('20260220-100000'));
    expect(ackMsg).toBeDefined();
  });

  it('handles missing directories gracefully', async () => {
    // Use a completely non-existent bus directory
    const missingDir = join(tmpDir, 'nonexistent-bus');
    const busConfig = { busDir: missingDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const results = await scanBusMessages(busConfig);

    expect(results).toHaveLength(0);
  });
});

// ============================================================================
// buildTimeline
// ============================================================================

describe('buildTimeline', () => {
  it('sorts messages newest-first', () => {
    const messages = [
      { message: makeMessage({ timestamp: '20260220-100000' }), filename: 'a.msg' },
      { message: makeMessage({ timestamp: '20260220-130000' }), filename: 'c.msg' },
      { message: makeMessage({ timestamp: '20260220-110000' }), filename: 'b.msg' },
    ];

    const timeline = buildTimeline(messages);

    expect(timeline.entries[0].timestamp).toBe('20260220-130000');
    expect(timeline.entries[1].timestamp).toBe('20260220-110000');
    expect(timeline.entries[2].timestamp).toBe('20260220-100000');
  });

  it('computes priority breakdown correctly', () => {
    const messages = [
      { message: makeMessage({ priority: 0, opcode: 'HALT', timestamp: '20260220-100000' }), filename: 'a.msg' },
      { message: makeMessage({ priority: 6, timestamp: '20260220-110000' }), filename: 'b.msg' },
      { message: makeMessage({ priority: 6, timestamp: '20260220-120000' }), filename: 'c.msg' },
      { message: makeMessage({ priority: 2, opcode: 'CMP', timestamp: '20260220-130000' }), filename: 'd.msg' },
      { message: makeMessage({ priority: 6, timestamp: '20260220-140000' }), filename: 'e.msg' },
    ];

    const timeline = buildTimeline(messages);

    expect(timeline.totalMessages).toBe(5);
    expect(timeline.priorityBreakdown['0']).toBe(1);
    expect(timeline.priorityBreakdown['2']).toBe(1);
    expect(timeline.priorityBreakdown['6']).toBe(3);
  });

  it('truncates to maxEntries', () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      message: makeMessage({ timestamp: `20260220-${String(100000 + i * 10000).padStart(6, '0')}` }),
      filename: `msg-${i}.msg`,
    }));

    const timeline = buildTimeline(messages, 3);

    expect(timeline.entries).toHaveLength(3);
    expect(timeline.totalMessages).toBe(3);
  });

  it('produces (empty) for messages with no payload', () => {
    const msg = makeMessage({ payload: [] });
    // Override the length to 0 for consistency
    (msg.header as { length: number }).length = 0;
    (msg as { payload: string[] }).payload = [];

    const messages = [{ message: msg, filename: 'empty.msg' }];
    const timeline = buildTimeline(messages);

    expect(timeline.entries[0].payloadSummary).toBe('(empty)');
  });

  it('truncates payload to 80 chars', () => {
    const longPayload = 'A'.repeat(120);
    const msg = makeMessage({ payload: [longPayload] });
    const messages = [{ message: msg, filename: 'long.msg' }];

    const timeline = buildTimeline(messages);

    expect(timeline.entries[0].payloadSummary).toHaveLength(80);
  });

  it('has generatedAt timestamp', () => {
    const messages = [
      { message: makeMessage({ timestamp: '20260220-100000' }), filename: 'a.msg' },
    ];
    const timeline = buildTimeline(messages);

    expect(timeline.generatedAt).toMatch(/^\d{8}-\d{6}$/);
  });
});

// ============================================================================
// filterTimeline
// ============================================================================

describe('filterTimeline', () => {
  function makeTimeline() {
    return {
      generatedAt: '20260220-150000',
      totalMessages: 4,
      entries: [
        {
          timestamp: '20260220-140000',
          priority: 0,
          priorityName: 'HALT',
          opcode: 'HALT',
          src: 'sentinel',
          dst: 'all',
          payloadSummary: 'emergency halt',
          filename: 'halt.msg',
        },
        {
          timestamp: '20260220-130000',
          priority: 6,
          priorityName: 'STATUS',
          opcode: 'STATUS',
          src: 'monitor',
          dst: 'coordinator',
          payloadSummary: 'budget ok',
          filename: 'status1.msg',
        },
        {
          timestamp: '20260220-120000',
          priority: 6,
          priorityName: 'STATUS',
          opcode: 'STATUS',
          src: 'executor',
          dst: 'coordinator',
          payloadSummary: 'plan complete',
          filename: 'status2.msg',
        },
        {
          timestamp: '20260220-110000',
          priority: 2,
          priorityName: 'VERIFY',
          opcode: 'CMP',
          src: 'verifier',
          dst: 'coordinator',
          payloadSummary: 'verification pass',
          filename: 'verify.msg',
        },
      ],
      priorityBreakdown: { '0': 1, '2': 1, '6': 2 },
    };
  }

  it('returns all entries when no filters applied', () => {
    const timeline = makeTimeline();
    const filtered = filterTimeline(timeline, {});

    expect(filtered.entries).toHaveLength(4);
    expect(filtered.totalMessages).toBe(4);
  });

  it('filters by priority', () => {
    const timeline = makeTimeline();
    const filtered = filterTimeline(timeline, { priority: 6 });

    expect(filtered.entries).toHaveLength(2);
    expect(filtered.totalMessages).toBe(2);
    expect(filtered.entries.every(e => e.priority === 6)).toBe(true);
    expect(filtered.priorityBreakdown).toEqual({ '6': 2 });
  });

  it('filters by src', () => {
    const timeline = makeTimeline();
    const filtered = filterTimeline(timeline, { src: 'monitor' });

    expect(filtered.entries).toHaveLength(1);
    expect(filtered.entries[0].src).toBe('monitor');
  });

  it('filters by dst', () => {
    const timeline = makeTimeline();
    const filtered = filterTimeline(timeline, { dst: 'all' });

    expect(filtered.entries).toHaveLength(1);
    expect(filtered.entries[0].dst).toBe('all');
  });

  it('filters by src AND priority (AND semantics)', () => {
    const timeline = makeTimeline();
    const filtered = filterTimeline(timeline, { src: 'executor', priority: 6 });

    expect(filtered.entries).toHaveLength(1);
    expect(filtered.entries[0].src).toBe('executor');
    expect(filtered.entries[0].priority).toBe(6);
  });

  it('recalculates priority breakdown after filtering', () => {
    const timeline = makeTimeline();
    const filtered = filterTimeline(timeline, { dst: 'coordinator' });

    expect(filtered.entries).toHaveLength(3);
    expect(filtered.priorityBreakdown).toEqual({ '2': 1, '6': 2 });
  });
});

// ============================================================================
// formatTimelineMarkdown
// ============================================================================

describe('formatTimelineMarkdown', () => {
  it('produces markdown with expected headers and table', () => {
    const timeline = {
      generatedAt: '20260220-150000',
      totalMessages: 2,
      entries: [
        {
          timestamp: '20260220-130000',
          priority: 6,
          priorityName: 'STATUS',
          opcode: 'STATUS',
          src: 'monitor',
          dst: 'coordinator',
          payloadSummary: 'budget ok',
          filename: 'status.msg',
        },
        {
          timestamp: '20260220-120000',
          priority: 0,
          priorityName: 'HALT',
          opcode: 'HALT',
          src: 'sentinel',
          dst: 'all',
          payloadSummary: 'emergency stop',
          filename: 'halt.msg',
        },
      ],
      priorityBreakdown: { '0': 1, '6': 1 },
    };

    const md = formatTimelineMarkdown(timeline);

    expect(md).toContain('## Communication Log -- 20260220-150000');
    expect(md).toContain('**Total Messages:** 2');
    expect(md).toContain('Priority 0 (HALT): 1');
    expect(md).toContain('Priority 6 (STATUS): 1');
    expect(md).toContain('| Time | Pri | Opcode | From | To | Payload |');
    expect(md).toContain('| 20260220-130000 | 6 | STATUS | monitor | coordinator | budget ok |');
    expect(md).toContain('| 20260220-120000 | 0 | HALT | sentinel | all | emergency stop |');
  });

  it('produces correct number of table rows', () => {
    const timeline = {
      generatedAt: '20260220-150000',
      totalMessages: 3,
      entries: [
        { timestamp: '20260220-130000', priority: 6, priorityName: 'STATUS', opcode: 'STATUS', src: 'monitor', dst: 'coordinator', payloadSummary: 'msg1', filename: 'a.msg' },
        { timestamp: '20260220-120000', priority: 6, priorityName: 'STATUS', opcode: 'STATUS', src: 'executor', dst: 'coordinator', payloadSummary: 'msg2', filename: 'b.msg' },
        { timestamp: '20260220-110000', priority: 2, priorityName: 'VERIFY', opcode: 'CMP', src: 'verifier', dst: 'coordinator', payloadSummary: 'msg3', filename: 'c.msg' },
      ],
      priorityBreakdown: { '2': 1, '6': 2 },
    };

    const md = formatTimelineMarkdown(timeline);

    // Count table data rows (exclude header and separator)
    const tableLines = md.split('\n').filter(line => line.startsWith('|'));
    // Header + separator + 3 data rows = 5
    expect(tableLines).toHaveLength(5);
  });
});

// ============================================================================
// CommsLog class
// ============================================================================

describe('CommsLog class', () => {
  let tmpDir: string;
  let busDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'comms-log-class-'));
    busDir = join(tmpDir, 'bus');
    for (let i = 0; i < 8; i++) {
      await mkdir(join(busDir, `priority-${i}`), { recursive: true });
    }
    await mkdir(join(busDir, 'acknowledged'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('scan() delegates to scanBusMessages', async () => {
    const msg = makeMessage({ priority: 6, timestamp: '20260220-100000' });
    await writeMsg(busDir, 6, '20260220-100000-STATUS-coordinator-executor.msg', msg);

    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const commsLog = new CommsLog({ busConfig });
    const results = await commsLog.scan();

    expect(results).toHaveLength(1);
  });

  it('timeline() builds from scanned messages', async () => {
    const msg = makeMessage({ priority: 6, timestamp: '20260220-100000' });
    await writeMsg(busDir, 6, '20260220-100000-STATUS-coordinator-executor.msg', msg);

    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const commsLog = new CommsLog({ busConfig });
    const scanned = await commsLog.scan();
    const timeline = commsLog.timeline(scanned);

    expect(timeline.totalMessages).toBe(1);
    expect(timeline.entries).toHaveLength(1);
  });

  it('filter() delegates to filterTimeline', async () => {
    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const commsLog = new CommsLog({ busConfig });

    const timeline = {
      generatedAt: '20260220-150000',
      totalMessages: 2,
      entries: [
        { timestamp: '20260220-130000', priority: 6, priorityName: 'STATUS', opcode: 'STATUS', src: 'monitor', dst: 'coordinator', payloadSummary: 'msg1', filename: 'a.msg' },
        { timestamp: '20260220-120000', priority: 0, priorityName: 'HALT', opcode: 'HALT', src: 'sentinel', dst: 'all', payloadSummary: 'halt', filename: 'b.msg' },
      ],
      priorityBreakdown: { '0': 1, '6': 1 },
    };

    const filtered = commsLog.filter(timeline, { priority: 0 });
    expect(filtered.entries).toHaveLength(1);
    expect(filtered.entries[0].priorityName).toBe('HALT');
  });

  it('format() delegates to formatTimelineMarkdown', () => {
    const busConfig = { busDir, maxQueueDepth: 100, deliveryTimeoutMs: 5000, deadLetterRetentionDays: 3, archiveMaxMessages: 100, archiveMaxAgeDays: 7 };
    const commsLog = new CommsLog({ busConfig });

    const timeline = {
      generatedAt: '20260220-150000',
      totalMessages: 1,
      entries: [
        { timestamp: '20260220-130000', priority: 6, priorityName: 'STATUS', opcode: 'STATUS', src: 'monitor', dst: 'coordinator', payloadSummary: 'msg', filename: 'a.msg' },
      ],
      priorityBreakdown: { '6': 1 },
    };

    const md = commsLog.format(timeline);
    expect(md).toContain('## Communication Log');
    expect(md).toContain('| Time |');
  });
});

// ============================================================================
// createCommsLog factory
// ============================================================================

describe('createCommsLog', () => {
  it('creates with defaults', () => {
    const commsLog = createCommsLog({ busConfig: {} });
    expect(commsLog).toBeInstanceOf(CommsLog);
  });

  it('applies overrides', () => {
    const commsLog = createCommsLog({
      busConfig: { busDir: '/tmp/bus' },
      maxEntries: 50,
    });
    expect(commsLog).toBeInstanceOf(CommsLog);
  });

  it('is synchronous', () => {
    const result = createCommsLog({ busConfig: {} });
    expect(result).not.toBeInstanceOf(Promise);
  });
});
