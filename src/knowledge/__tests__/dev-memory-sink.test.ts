import { describe, it, expect } from 'vitest';
import {
  DevMemorySink,
  createDevMemorySink,
  devPatternToMemoryRecord,
} from '../dev-memory-sink.js';
import type { PatternMemoryWriter } from '../memory-sink.js';
import type { MemoryRecord } from '../../memory/types.js';
import type { DevSessionObservation } from '../dev-observation-types.js';
import type { DevPattern } from '../dev-pattern-detector.js';

class MockWriter implements PatternMemoryWriter {
  readonly records = new Map<string, MemoryRecord>();
  async store(r: MemoryRecord): Promise<MemoryRecord> {
    this.records.set(r.id, r);
    return r;
  }
}

let n = 0;
function obs(o: Partial<DevSessionObservation> & { kind: DevSessionObservation['kind'] }): DevSessionObservation {
  return {
    id: `o${n++}`,
    timestamp: '2026-07-13T00:00:00.000Z',
    sessionId: 'sess-1',
    repo: 'gsd-skill-creator',
    ...o,
  } as DevSessionObservation;
}

describe('devPatternToMemoryRecord', () => {
  const pattern: DevPattern = {
    id: 'dev-pattern-abc',
    type: 'recurring-friction',
    description: 'Recurring friction on "a.ts" — 3 occurrences',
    repos: ['gsd-skill-creator'],
    evidenceCount: 3,
    confidence: 0.5,
    details: { key: 'a.ts' },
  };

  it('maps a non-correction pattern to an episodic record, never a lesson', () => {
    const r = devPatternToMemoryRecord(pattern);
    expect(r.type).toBe('episodic');
    expect(r.type).not.toBe('lesson');
    expect(r.tags).toContain('dev-session');
    expect(r.tags).toContain('pattern:dev-recurring-friction');
    expect(r.provenance.scope).toBe('project');
    expect(r.provenance.visibility).toBe('internal');
    expect(r.provenance.domains).toEqual(['gsd-skill-creator']);
    expect(r.content).not.toMatch(/learner|mastery|rubric/i);
  });

  it('maps a correction-cluster to a feedback record', () => {
    const r = devPatternToMemoryRecord({ ...pattern, type: 'correction-cluster' });
    expect(r.type).toBe('feedback');
  });

  it('derives a stable id from the pattern id (idempotent overwrite)', () => {
    expect(devPatternToMemoryRecord(pattern).id).toBe(devPatternToMemoryRecord(pattern).id);
  });
});

describe('DevMemorySink', () => {
  it('flushes nothing for an empty buffer', async () => {
    const w = new MockWriter();
    const sink = new DevMemorySink(w, { detect: () => [] });
    expect(await sink.flush()).toEqual([]);
    expect(w.records.size).toBe(0);
  });

  it('promotes non-correction patterns as episodic memories', async () => {
    const w = new MockWriter();
    const sink = createDevMemorySink(w);
    sink.addMany([
      obs({ kind: 'friction', summary: 'slow', file: 'a.ts' }),
      obs({ kind: 'friction', summary: 'slow', file: 'a.ts' }),
    ]);
    const stored = await sink.flush();
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.every((r) => r.type === 'episodic')).toBe(true);
    expect(w.records.size).toBe(stored.length);
  });

  it('QUARANTINE-gates corrections: not written by default', async () => {
    const w = new MockWriter();
    const sink = createDevMemorySink(w);
    sink.addMany([
      obs({ kind: 'correction', summary: 'x' }),
      obs({ kind: 'correction', summary: 'y' }),
    ]);
    const stored = await sink.flush();
    expect(stored.every((r) => r.type !== 'feedback')).toBe(true);
    expect(stored.some((r) => r.type === 'feedback')).toBe(false);
  });

  it('writes correction memories only when explicitly opted in', async () => {
    const w = new MockWriter();
    const sink = createDevMemorySink(w, { includeCorrections: true });
    sink.addMany([
      obs({ kind: 'correction', summary: 'x' }),
      obs({ kind: 'correction', summary: 'y' }),
    ]);
    const stored = await sink.flush();
    expect(stored.some((r) => r.type === 'feedback')).toBe(true);
  });

  it('HARD BOUNDARY: every stored record is episodic/feedback — never lesson or a skill/file write', async () => {
    const w = new MockWriter();
    const sink = createDevMemorySink(w, { includeCorrections: true });
    sink.addMany([
      obs({ kind: 'friction', summary: 's', file: 'a.ts' }),
      obs({ kind: 'friction', summary: 's', file: 'a.ts' }),
      obs({ kind: 'correction', summary: 'x' }),
      obs({ kind: 'correction', summary: 'y' }),
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
    ]);
    const stored = await sink.flush();
    expect(stored.length).toBeGreaterThan(0);
    for (const r of stored) {
      expect(['episodic', 'feedback']).toContain(r.type);
      expect(r.type).not.toBe('lesson');
    }
  });

  it('is idempotent — re-flushing the same observations overwrites, not duplicates', async () => {
    const w = new MockWriter();
    const sink = createDevMemorySink(w);
    const input = [
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
    ];
    sink.addMany(input);
    await sink.flush();
    const sizeAfterFirst = w.records.size;
    sink.clear();
    sink.addMany(input);
    await sink.flush();
    expect(w.records.size).toBe(sizeAfterFirst);
  });

  it('applies a minConfidence gate', async () => {
    const w = new MockWriter();
    const sink = createDevMemorySink(w, { minConfidence: 0.99 });
    sink.addMany([
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
    ]);
    expect(await sink.flush()).toEqual([]);
  });

  it('threads detector threshold options through the factory', async () => {
    const w = new MockWriter();
    const sink = createDevMemorySink(w, { minRecurrence: 3 });
    sink.addMany([
      obs({ kind: 'friction', summary: 's', file: 'a.ts' }),
      obs({ kind: 'friction', summary: 's', file: 'a.ts' }),
    ]);
    expect(await sink.flush()).toEqual([]);
  });
});
