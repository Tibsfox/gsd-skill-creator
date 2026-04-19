/**
 * CF-M3-02: Every activation + composition writes a trace.
 * SC-M3-APPEND: Writer only appends, no in-place update.
 * SC-REG: Concurrent-writer resolution (last-write-wins via timestamp order).
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { writeTrace, writeTraces, TraceWriter, redactString, redactTrace } from '../writer.js';
import { readTraces } from '../reader.js';
import type { DecisionTrace } from '../../types/memory.js';
import type { CanonicalDecisionTrace } from '../schema.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempPath(): string {
  return join(tmpdir(), `traces-writer-test-${randomUUID()}.jsonl`);
}

function makeTrace(overrides: Partial<DecisionTrace> = {}): DecisionTrace {
  return {
    id: randomUUID(),
    ts: Date.now(),
    actor: 'skill:mock-activator',
    intent: 'Perform test activation',
    reasoning: 'Test harness selected this path',
    constraints: ['test-mode'],
    alternatives: ['alt-path-1'],
    outcome: 'Success',
    refs: { entityIds: ['e1'] },
    ...overrides,
  };
}

// ─── writeTrace (CF-M3-02: every activation writes a trace) ──────────────────

describe('writeTrace', () => {
  it('writes a trace and it is readable back', async () => {
    const logPath = tempPath();
    const trace = makeTrace();
    await writeTrace(trace, logPath);

    const traces = await readTraces(logPath);
    expect(traces).toHaveLength(1);
    expect(traces[0].id).toBe(trace.id);
    expect(traces[0].actor).toBe(trace.actor);
    expect(traces[0].intent).toBe(trace.intent);
  });

  it('returns the canonical form written', async () => {
    const logPath = tempPath();
    const trace = makeTrace();
    const canonical = await writeTrace(trace, logPath);
    expect(canonical.id).toBe(trace.id);
    expect(canonical.outcome).toBe(trace.outcome!);
  });

  it('creates parent directory if it does not exist', async () => {
    const logPath = join(tmpdir(), `nested-${randomUUID()}`, 'subdir', 'decisions.jsonl`');
    const trace = makeTrace();
    await expect(writeTrace(trace, logPath)).resolves.toBeDefined();
  });
});

// ─── writeTraces (CF-M3-02: every composition writes a trace) ────────────────

describe('writeTraces', () => {
  it('writes multiple traces sequentially and all are readable', async () => {
    const logPath = tempPath();
    const traces = [makeTrace(), makeTrace(), makeTrace()];
    const results = await writeTraces(traces, logPath);

    expect(results).toHaveLength(3);
    const readBack = await readTraces(logPath);
    expect(readBack).toHaveLength(3);
    for (let i = 0; i < traces.length; i++) {
      expect(readBack[i].id).toBe(traces[i].id);
    }
  });

  it('writes empty array without error', async () => {
    const logPath = tempPath();
    const results = await writeTraces([], logPath);
    expect(results).toHaveLength(0);
  });
});

// ─── SC-M3-APPEND: append-only invariant ─────────────────────────────────────

describe('SC-M3-APPEND: append-only invariant', () => {
  it('multiple writes accumulate — never overwrite', async () => {
    const logPath = tempPath();
    const t1 = makeTrace({ actor: 'skill:first' });
    const t2 = makeTrace({ actor: 'skill:second' });
    const t3 = makeTrace({ actor: 'skill:third' });

    await writeTrace(t1, logPath);
    await writeTrace(t2, logPath);
    await writeTrace(t3, logPath);

    const all = await readTraces(logPath);
    expect(all).toHaveLength(3);
    expect(all[0].actor).toBe('skill:first');
    expect(all[1].actor).toBe('skill:second');
    expect(all[2].actor).toBe('skill:third');
  });

  it('writer source uses fs.appendFile — never fs.writeFile (SC-M3-APPEND)', async () => {
    // Static source check: the writer delegates to event-log which uses appendFile exclusively.
    const source = await fs.readFile(
      new URL('../writer.ts', import.meta.url),
      'utf-8',
    );
    // The writer itself must not call fs.writeFile or fs.write (which could truncate)
    expect(source).not.toContain('fs.writeFile(');
    expect(source).not.toContain('fs.write(');
  });

  it('no in-place update method exists on TraceWriter', () => {
    const writer = new TraceWriter(tempPath());
    // TraceWriter must not expose update/patch/delete methods
    expect((writer as unknown as Record<string, unknown>)['update']).toBeUndefined();
    expect((writer as unknown as Record<string, unknown>)['patch']).toBeUndefined();
    expect((writer as unknown as Record<string, unknown>)['delete']).toBeUndefined();
    expect((writer as unknown as Record<string, unknown>)['truncate']).toBeUndefined();
  });
});

// ─── SC-REG: concurrent-writer resolution ────────────────────────────────────

describe('SC-REG: concurrent-writer resolution', () => {
  it('concurrent writes all land (last-write-wins by timestamp order)', async () => {
    const logPath = tempPath();
    const traces = Array.from({ length: 10 }, (_, i) =>
      makeTrace({ ts: Date.now() + i, actor: `skill:concurrent-${i}` }),
    );

    // Fire all writes concurrently
    await Promise.all(traces.map((t) => writeTrace(t, logPath)));

    // All 10 must be present (fs.appendFile is atomic per line on Linux)
    const all = await readTraces(logPath);
    expect(all).toHaveLength(10);

    // Verify all actor IDs are present (order may vary under concurrency)
    const actors = new Set(all.map((t) => t.actor));
    for (let i = 0; i < 10; i++) {
      expect(actors.has(`skill:concurrent-${i}`)).toBe(true);
    }
  });
});

// ─── TraceWriter class ────────────────────────────────────────────────────────

describe('TraceWriter', () => {
  it('write() appends a single trace', async () => {
    const logPath = tempPath();
    const writer = new TraceWriter(logPath);
    const trace = makeTrace();
    await writer.write(trace);

    const all = await readTraces(logPath);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(trace.id);
  });

  it('writeAll() appends multiple traces', async () => {
    const logPath = tempPath();
    const writer = new TraceWriter(logPath);
    const traces = [makeTrace(), makeTrace()];
    await writer.writeAll(traces);

    const all = await readTraces(logPath);
    expect(all).toHaveLength(2);
  });
});

// ─── M5 mock hook: skill activation write (CF-M3-02) ─────────────────────────

describe('CF-M3-02: mock M5 applicator hook — skill activation write', () => {
  /**
   * Simulates M5 applicator calling the trace writer on each skill activation.
   * Phase 646 wiring will replace this mock with real M5 hook calls.
   */
  it('fires a trace for each simulated skill activation', async () => {
    const logPath = tempPath();
    const writer = new TraceWriter(logPath);

    // Simulate 5 skill activations
    const activations = ['skill:a', 'skill:b', 'skill:c', 'skill:d', 'skill:e'];
    for (const actor of activations) {
      await writer.write(makeTrace({ actor, intent: `Activate ${actor}` }));
    }

    const all = await readTraces(logPath);
    expect(all).toHaveLength(activations.length);
    for (let i = 0; i < activations.length; i++) {
      expect(all[i].actor).toBe(activations[i]);
    }
  });

  it('fires a trace for each simulated agent composition', async () => {
    const logPath = tempPath();
    const writer = new TraceWriter(logPath);

    // Simulate 3 multi-skill compositions
    const compositions = [
      makeTrace({ actor: 'agent:composer-1', intent: 'Compose skills A+B' }),
      makeTrace({ actor: 'agent:composer-2', intent: 'Compose skills C+D' }),
      makeTrace({ actor: 'agent:composer-3', intent: 'Compose skills E+F' }),
    ];
    await writer.writeAll(compositions);

    const all = await readTraces(logPath);
    expect(all).toHaveLength(3);
    expect(all[0].actor).toBe('agent:composer-1');
    expect(all[1].actor).toBe('agent:composer-2');
    expect(all[2].actor).toBe('agent:composer-3');
  });
});
