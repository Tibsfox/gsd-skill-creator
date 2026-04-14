/**
 * Unified System Event Log Tests
 *
 * Backlog 999.3: centralized event log for full run reconstruction.
 * Tests pure event building, serialization, filtering, and append-only IO.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  buildEvent,
  serializeEvent,
  parseEventLine,
  matchesFilter,
  computeStats,
  writeEvent,
  readEvents,
  queryEvents,
  getEventStats,
  listEventLogs,
  EVENT_LOG_VERSION,
  type SystemEvent,
  type CreateEventInput,
  type EventFilter,
} from './event-log.js';

// ============================================================================
// Event Building (Pure)
// ============================================================================

describe('buildEvent', () => {
  it('generates unique id and timestamp', () => {
    const input: CreateEventInput = {
      category: 'execution',
      severity: 'info',
      agentId: 'polecat-1',
      convoyId: 'convoy-alpha',
      message: 'Work item started',
    };

    const event = buildEvent(input);
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.category).toBe('execution');
    expect(event.severity).toBe('info');
    expect(event.agentId).toBe('polecat-1');
    expect(event.convoyId).toBe('convoy-alpha');
    expect(event.message).toBe('Work item started');
  });

  it('defaults details to empty object', () => {
    const event = buildEvent({
      category: 'system',
      severity: 'info',
      message: 'Daemon started',
    });

    expect(event.details).toEqual({});
  });

  it('preserves provided details', () => {
    const event = buildEvent({
      category: 'budget',
      severity: 'warn',
      message: 'Budget warning',
      details: { usedPercent: 85, convoyId: 'c1' },
    });

    expect(event.details).toEqual({ usedPercent: 85, convoyId: 'c1' });
  });

  it('generates different ids for sequential calls', () => {
    const e1 = buildEvent({ category: 'system', severity: 'info', message: 'a' });
    const e2 = buildEvent({ category: 'system', severity: 'info', message: 'b' });
    expect(e1.id).not.toBe(e2.id);
  });
});

// ============================================================================
// Serialization (Pure)
// ============================================================================

describe('serializeEvent', () => {
  it('produces a single line of JSON', () => {
    const event: SystemEvent = {
      id: 'test-id',
      timestamp: '2026-04-04T12:00:00Z',
      category: 'execution',
      severity: 'info',
      message: 'Test event',
      details: {},
    };

    const line = serializeEvent(event);
    expect(line).toMatch(/^\{.*\}\n$/);
    expect(line.split('\n').filter(Boolean)).toHaveLength(1);
  });

  it('produces valid JSON that roundtrips', () => {
    const event: SystemEvent = {
      id: 'roundtrip-id',
      timestamp: '2026-04-04T12:00:00Z',
      category: 'routing',
      severity: 'debug',
      agentId: 'mayor-1',
      convoyId: 'convoy-test',
      message: 'Dispatched work item',
      details: { beadId: 'bead-abc', priority: 'P1' },
    };

    const line = serializeEvent(event);
    const parsed = JSON.parse(line);
    expect(parsed.id).toBe('roundtrip-id');
    expect(parsed.details.beadId).toBe('bead-abc');
  });
});

describe('parseEventLine', () => {
  it('parses valid JSON line', () => {
    const json = '{"id":"x","timestamp":"t","category":"system","severity":"info","message":"hi","details":{}}';
    const event = parseEventLine(json);
    expect(event).not.toBeNull();
    expect(event!.id).toBe('x');
  });

  it('returns null for empty line', () => {
    expect(parseEventLine('')).toBeNull();
    expect(parseEventLine('   ')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseEventLine('not json')).toBeNull();
    expect(parseEventLine('{broken')).toBeNull();
  });
});

// ============================================================================
// Filtering (Pure)
// ============================================================================

describe('matchesFilter', () => {
  const event: SystemEvent = {
    id: 'test',
    timestamp: '2026-04-04T12:00:00Z',
    category: 'execution',
    severity: 'warn',
    agentId: 'polecat-1',
    convoyId: 'convoy-1',
    message: 'Test',
    details: {},
  };

  it('matches when filter is empty', () => {
    expect(matchesFilter(event, {})).toBe(true);
  });

  it('filters by category', () => {
    expect(matchesFilter(event, { category: 'execution' })).toBe(true);
    expect(matchesFilter(event, { category: 'routing' })).toBe(false);
  });

  it('filters by minimum severity', () => {
    expect(matchesFilter(event, { minSeverity: 'debug' })).toBe(true);
    expect(matchesFilter(event, { minSeverity: 'warn' })).toBe(true);
    expect(matchesFilter(event, { minSeverity: 'error' })).toBe(false);
    expect(matchesFilter(event, { minSeverity: 'critical' })).toBe(false);
  });

  it('filters by agent ID', () => {
    expect(matchesFilter(event, { agentId: 'polecat-1' })).toBe(true);
    expect(matchesFilter(event, { agentId: 'polecat-2' })).toBe(false);
  });

  it('filters by time range', () => {
    expect(matchesFilter(event, { after: '2026-04-04T11:00:00Z' })).toBe(true);
    expect(matchesFilter(event, { after: '2026-04-04T13:00:00Z' })).toBe(false);
    expect(matchesFilter(event, { before: '2026-04-04T13:00:00Z' })).toBe(true);
    expect(matchesFilter(event, { before: '2026-04-04T11:00:00Z' })).toBe(false);
  });

  it('combines multiple filter criteria', () => {
    expect(matchesFilter(event, { category: 'execution', agentId: 'polecat-1' })).toBe(true);
    expect(matchesFilter(event, { category: 'execution', agentId: 'polecat-2' })).toBe(false);
  });
});

// ============================================================================
// Statistics (Pure)
// ============================================================================

describe('computeStats', () => {
  it('computes stats from events', () => {
    const events: SystemEvent[] = [
      { id: '1', timestamp: '2026-04-04T10:00:00Z', category: 'execution', severity: 'info', agentId: 'a1', message: 'x', details: {} },
      { id: '2', timestamp: '2026-04-04T11:00:00Z', category: 'execution', severity: 'warn', agentId: 'a1', message: 'y', details: {} },
      { id: '3', timestamp: '2026-04-04T12:00:00Z', category: 'routing', severity: 'info', agentId: 'a2', message: 'z', details: {} },
    ];

    const stats = computeStats(events);
    expect(stats.totalEvents).toBe(3);
    expect(stats.byCategory).toEqual({ execution: 2, routing: 1 });
    expect(stats.bySeverity).toEqual({ info: 2, warn: 1 });
    expect(stats.uniqueAgents).toEqual(['a1', 'a2']);
    expect(stats.earliest).toBe('2026-04-04T10:00:00Z');
    expect(stats.latest).toBe('2026-04-04T12:00:00Z');
  });

  it('handles empty event list', () => {
    const stats = computeStats([]);
    expect(stats.totalEvents).toBe(0);
    expect(stats.uniqueAgents).toEqual([]);
    expect(stats.earliest).toBeUndefined();
  });
});

// ============================================================================
// IO — Append-Only Log
// ============================================================================

describe('event log IO', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'eventlog-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('writes and reads events', async () => {
    const e1 = await writeEvent(tmpDir, {
      category: 'execution',
      severity: 'info',
      agentId: 'polecat-1',
      convoyId: 'convoy-1',
      message: 'Started work',
    });

    const e2 = await writeEvent(tmpDir, {
      category: 'execution',
      severity: 'info',
      agentId: 'polecat-1',
      convoyId: 'convoy-1',
      message: 'Completed work',
    });

    const events = await readEvents(tmpDir, 'convoy-1');
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe(e1.id);
    expect(events[1].id).toBe(e2.id);
  });

  it('uses append-only writes (file grows, never shrinks)', async () => {
    await writeEvent(tmpDir, {
      category: 'system', severity: 'info', message: 'Event 1',
    });

    const logPath = join(tmpDir, 'events', 'system.jsonl');
    const size1 = (await readFile(logPath, 'utf-8')).length;

    await writeEvent(tmpDir, {
      category: 'system', severity: 'info', message: 'Event 2',
    });

    const size2 = (await readFile(logPath, 'utf-8')).length;
    expect(size2).toBeGreaterThan(size1);
  });

  it('separates convoy and system events', async () => {
    await writeEvent(tmpDir, {
      category: 'execution', severity: 'info', convoyId: 'convoy-1', message: 'Convoy event',
    });
    await writeEvent(tmpDir, {
      category: 'system', severity: 'info', message: 'System event',
    });

    const convoyEvents = await readEvents(tmpDir, 'convoy-1');
    const systemEvents = await readEvents(tmpDir);

    expect(convoyEvents).toHaveLength(1);
    expect(convoyEvents[0].message).toBe('Convoy event');
    expect(systemEvents).toHaveLength(1);
    expect(systemEvents[0].message).toBe('System event');
  });

  it('returns empty array for nonexistent log', async () => {
    const events = await readEvents(tmpDir, 'nonexistent');
    expect(events).toEqual([]);
  });
});

// ============================================================================
// Query
// ============================================================================

describe('queryEvents', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'eventlog-query-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('filters events by category', async () => {
    await writeEvent(tmpDir, { category: 'execution', severity: 'info', convoyId: 'c1', message: 'exec' });
    await writeEvent(tmpDir, { category: 'routing', severity: 'info', convoyId: 'c1', message: 'route' });
    await writeEvent(tmpDir, { category: 'execution', severity: 'warn', convoyId: 'c1', message: 'exec2' });

    const results = await queryEvents(tmpDir, 'c1', { category: 'execution' });
    expect(results).toHaveLength(2);
    expect(results.every((e) => e.category === 'execution')).toBe(true);
  });

  it('respects limit (returns most recent)', async () => {
    for (let i = 0; i < 5; i++) {
      await writeEvent(tmpDir, { category: 'system', severity: 'info', message: `Event ${i}` });
    }

    const results = await queryEvents(tmpDir, undefined, { limit: 2 });
    expect(results).toHaveLength(2);
    expect(results[0].message).toBe('Event 3');
    expect(results[1].message).toBe('Event 4');
  });
});

// ============================================================================
// Stats & Listing
// ============================================================================

describe('getEventStats', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'eventlog-stats-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns stats for a convoy log', async () => {
    await writeEvent(tmpDir, { category: 'execution', severity: 'info', convoyId: 'c1', agentId: 'a1', message: 'x' });
    await writeEvent(tmpDir, { category: 'routing', severity: 'warn', convoyId: 'c1', agentId: 'a2', message: 'y' });

    const stats = await getEventStats(tmpDir, 'c1');
    expect(stats.totalEvents).toBe(2);
    expect(stats.byCategory).toEqual({ execution: 1, routing: 1 });
    expect(stats.uniqueAgents).toEqual(['a1', 'a2']);
  });
});

describe('listEventLogs', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'eventlog-list-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('lists convoy event logs', async () => {
    await writeEvent(tmpDir, { category: 'execution', severity: 'info', convoyId: 'alpha', message: 'x' });
    await writeEvent(tmpDir, { category: 'execution', severity: 'info', convoyId: 'beta', message: 'y' });
    await writeEvent(tmpDir, { category: 'system', severity: 'info', message: 'z' }); // system log

    const logs = await listEventLogs(tmpDir);
    expect(logs).toEqual(['alpha', 'beta']); // system.jsonl excluded
  });

  it('returns empty for no logs', async () => {
    const logs = await listEventLogs(tmpDir);
    expect(logs).toEqual([]);
  });
});

// ============================================================================
// Meta
// ============================================================================

describe('constants', () => {
  it('exports event log version', () => {
    expect(EVENT_LOG_VERSION).toBe(1);
  });
});
