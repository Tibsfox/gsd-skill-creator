/**
 * CF-M3-04: Growth bounded per settings; rollover to annual files.
 *
 * Validates:
 *   - readTraces filters by time window, actor, entityIds, intentContains
 *   - shouldRollover returns true when entry count >= maxEntries
 *   - annualRolloverPath derives correct filename
 *   - TraceReader class API
 *   - limit option caps results
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { writeTraces } from '../writer.js';
import {
  readTraces,
  shouldRollover,
  annualRolloverPath,
  TraceReader,
  DEFAULT_MAX_ENTRIES,
} from '../reader.js';
import type { DecisionTrace } from '../../types/memory.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempPath(): string {
  return join(tmpdir(), `traces-reader-test-${randomUUID()}.jsonl`);
}

function makeTrace(overrides: Partial<DecisionTrace> = {}): DecisionTrace {
  return {
    id: randomUUID(),
    ts: Date.now(),
    actor: 'skill:reader-test',
    intent: 'Read and filter traces correctly',
    reasoning: 'Test filter logic',
    constraints: [],
    alternatives: [],
    refs: {},
    ...overrides,
  };
}

// ─── readTraces — no filter ──────────────────────────────────────────────────

describe('readTraces — no filter', () => {
  it('returns empty array for non-existent log', async () => {
    const logPath = join(tmpdir(), `nonexistent-${randomUUID()}.jsonl`);
    const traces = await readTraces(logPath);
    expect(traces).toHaveLength(0);
  });

  it('returns all traces when no filter applied', async () => {
    const logPath = tempPath();
    const traces = [makeTrace(), makeTrace(), makeTrace()];
    await writeTraces(traces, logPath);

    const read = await readTraces(logPath);
    expect(read).toHaveLength(3);
  });
});

// ─── Time window filter ──────────────────────────────────────────────────────

describe('readTraces — time window filter', () => {
  it('filters by tsFrom', async () => {
    const logPath = tempPath();
    const t1 = makeTrace({ ts: 1000 });
    const t2 = makeTrace({ ts: 2000 });
    const t3 = makeTrace({ ts: 3000 });
    await writeTraces([t1, t2, t3], logPath);

    const result = await readTraces(logPath, { tsFrom: 2000 });
    expect(result).toHaveLength(2);
    expect(result[0].ts).toBe(2000);
    expect(result[1].ts).toBe(3000);
  });

  it('filters by tsTo', async () => {
    const logPath = tempPath();
    const t1 = makeTrace({ ts: 1000 });
    const t2 = makeTrace({ ts: 2000 });
    const t3 = makeTrace({ ts: 3000 });
    await writeTraces([t1, t2, t3], logPath);

    const result = await readTraces(logPath, { tsTo: 2000 });
    expect(result).toHaveLength(2);
    expect(result[0].ts).toBe(1000);
    expect(result[1].ts).toBe(2000);
  });

  it('filters by tsFrom and tsTo (window)', async () => {
    const logPath = tempPath();
    const traces = [
      makeTrace({ ts: 100 }),
      makeTrace({ ts: 500 }),
      makeTrace({ ts: 1000 }),
      makeTrace({ ts: 1500 }),
    ];
    await writeTraces(traces, logPath);

    const result = await readTraces(logPath, { tsFrom: 500, tsTo: 1000 });
    expect(result).toHaveLength(2);
    expect(result[0].ts).toBe(500);
    expect(result[1].ts).toBe(1000);
  });
});

// ─── Actor filter ─────────────────────────────────────────────────────────────

describe('readTraces — actor filter', () => {
  it('returns only traces from the specified actor', async () => {
    const logPath = tempPath();
    const traces = [
      makeTrace({ actor: 'skill:alpha' }),
      makeTrace({ actor: 'skill:beta' }),
      makeTrace({ actor: 'skill:alpha' }),
    ];
    await writeTraces(traces, logPath);

    const result = await readTraces(logPath, { actor: 'skill:alpha' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.actor === 'skill:alpha')).toBe(true);
  });

  it('returns empty array when no traces match actor', async () => {
    const logPath = tempPath();
    await writeTraces([makeTrace({ actor: 'skill:alpha' })], logPath);

    const result = await readTraces(logPath, { actor: 'skill:gamma' });
    expect(result).toHaveLength(0);
  });
});

// ─── Entity ref filter ────────────────────────────────────────────────────────

describe('readTraces — entityIds filter', () => {
  it('returns traces that reference at least one of the given entity IDs', async () => {
    const logPath = tempPath();
    const traces = [
      makeTrace({ refs: { entityIds: ['e1', 'e2'] } }),
      makeTrace({ refs: { entityIds: ['e3', 'e4'] } }),
      makeTrace({ refs: { entityIds: ['e2', 'e5'] } }),
    ];
    await writeTraces(traces, logPath);

    const result = await readTraces(logPath, { entityIds: ['e2'] });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.refs.entityIds?.includes('e2'))).toBe(true);
  });
});

// ─── Intent substring filter ─────────────────────────────────────────────────

describe('readTraces — intentContains filter', () => {
  it('returns only traces whose intent contains the substring (case-insensitive)', async () => {
    const logPath = tempPath();
    const traces = [
      makeTrace({ intent: 'Sort a list of skills by score' }),
      makeTrace({ intent: 'Build a data pipeline' }),
      makeTrace({ intent: 'SORT records by timestamp' }),
    ];
    await writeTraces(traces, logPath);

    const result = await readTraces(logPath, { intentContains: 'sort' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.intent.toLowerCase().includes('sort'))).toBe(true);
  });
});

// ─── Limit (CF-M3-04: growth bounded) ────────────────────────────────────────

describe('readTraces — limit (CF-M3-04)', () => {
  it('caps results to the specified limit (newest-first slice)', async () => {
    const logPath = tempPath();
    const traces = Array.from({ length: 20 }, (_, i) =>
      makeTrace({ ts: i * 100, actor: `skill:t${i}` }),
    );
    await writeTraces(traces, logPath);

    const result = await readTraces(logPath, { limit: 5 });
    expect(result).toHaveLength(5);
    // Limit slices the tail (newest entries)
    expect(result[result.length - 1].actor).toBe('skill:t19');
  });

  it('returns all when limit exceeds entry count', async () => {
    const logPath = tempPath();
    const traces = [makeTrace(), makeTrace()];
    await writeTraces(traces, logPath);

    const result = await readTraces(logPath, { limit: 100 });
    expect(result).toHaveLength(2);
  });
});

// ─── shouldRollover (CF-M3-04) ───────────────────────────────────────────────

describe('shouldRollover (CF-M3-04)', () => {
  it('returns false when entry count is below maxEntries', async () => {
    const logPath = tempPath();
    const traces = [makeTrace(), makeTrace()];
    await writeTraces(traces, logPath);

    const rollover = await shouldRollover(logPath, 10);
    expect(rollover).toBe(false);
  });

  it('returns true when entry count equals maxEntries', async () => {
    const logPath = tempPath();
    const traces = Array.from({ length: 5 }, () => makeTrace());
    await writeTraces(traces, logPath);

    const rollover = await shouldRollover(logPath, 5);
    expect(rollover).toBe(true);
  });

  it('returns true when entry count exceeds maxEntries', async () => {
    const logPath = tempPath();
    const traces = Array.from({ length: 8 }, () => makeTrace());
    await writeTraces(traces, logPath);

    const rollover = await shouldRollover(logPath, 5);
    expect(rollover).toBe(true);
  });

  it('returns false for empty / non-existent log', async () => {
    const logPath = join(tmpdir(), `rollover-empty-${randomUUID()}.jsonl`);
    const rollover = await shouldRollover(logPath, 1);
    expect(rollover).toBe(false);
  });

  it('DEFAULT_MAX_ENTRIES is a positive integer', () => {
    expect(Number.isInteger(DEFAULT_MAX_ENTRIES)).toBe(true);
    expect(DEFAULT_MAX_ENTRIES).toBeGreaterThan(0);
  });
});

// ─── annualRolloverPath ───────────────────────────────────────────────────────

describe('annualRolloverPath', () => {
  it('replaces .jsonl suffix with -YYYY.jsonl', () => {
    const base = '.planning/traces/decisions.jsonl';
    expect(annualRolloverPath(base, 2026)).toBe('.planning/traces/decisions-2026.jsonl');
    expect(annualRolloverPath(base, 2030)).toBe('.planning/traces/decisions-2030.jsonl');
  });

  it('works for nested paths', () => {
    const base = '/tmp/some/path/log.jsonl';
    expect(annualRolloverPath(base, 2025)).toBe('/tmp/some/path/log-2025.jsonl');
  });
});

// ─── TraceReader class ────────────────────────────────────────────────────────

describe('TraceReader', () => {
  it('read() delegates to readTraces with correct path', async () => {
    const logPath = tempPath();
    const traces = [makeTrace({ actor: 'skill:reader-class' })];
    await writeTraces(traces, logPath);

    const reader = new TraceReader(logPath);
    const result = await reader.read({ actor: 'skill:reader-class' });
    expect(result).toHaveLength(1);
  });

  it('shouldRollover() uses configured maxEntries', async () => {
    const logPath = tempPath();
    const traces = Array.from({ length: 3 }, () => makeTrace());
    await writeTraces(traces, logPath);

    const reader = new TraceReader(logPath, 3);
    expect(await reader.shouldRollover()).toBe(true);
  });

  it('rolloverPath() returns annual path for given year', () => {
    const reader = new TraceReader('.planning/traces/decisions.jsonl');
    expect(reader.rolloverPath(2026)).toBe('.planning/traces/decisions-2026.jsonl');
  });

  it('fromCanonical static method converts canonical to DecisionTrace', () => {
    const canonical = {
      id: randomUUID(),
      ts: 1000,
      actor: 'skill:x',
      intent: 'test',
      reasoning: 'r',
      constraints: [],
      alternatives: [],
      outcome: '',
      refs: { teachId: '', entityIds: [] },
    };
    const trace = TraceReader.fromCanonical(canonical);
    expect(trace.outcome).toBeUndefined();
    expect(trace.refs.teachId).toBeUndefined();
    expect(trace.refs.entityIds).toBeUndefined();
  });
});
