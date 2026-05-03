/**
 * C11 / T6 — Concurrent update safety (D-25-22).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MeetingRecordGenerator, type OutcomeUpdate } from '../record.js';
import { buildPopulatedKB } from './_fixtures.js';

let recordsRoot: string;

beforeEach(() => {
  recordsRoot = mkdtempSync(join(tmpdir(), 'c11-cu-'));
});

afterEach(() => {
  try {
    rmSync(recordsRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

const out = (o: Partial<OutcomeUpdate>): OutcomeUpdate => ({
  state: 'in_progress',
  detail: 'pending',
  updated_at: '2026-05-03T14:00:00Z',
  ...o,
});

describe('C11 / T6 — concurrent update safety', () => {
  it('two simultaneous updates for different decisions both succeed', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);

    await Promise.all([
      gen.updateOutcome('d1', out({ state: 'complete', detail: 'D1 done' })),
      gen.updateOutcome('d2', out({ state: 'complete', detail: 'D2 done' })),
    ]);
    const after = readFileSync(result!.path, 'utf8');
    expect(after).toContain('D1 done');
    expect(after).toContain('D2 done');
  });

  it('10 simultaneous updates complete without exception', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await gen.generateOnCommit(f.meeting.id);

    // Mix of d1 and d2 updates
    const tasks: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      tasks.push(
        gen.updateOutcome('d1', out({ detail: `d1 update ${i}`, updated_at: `2026-05-03T14:0${i}:00Z` })),
      );
      tasks.push(
        gen.updateOutcome('d2', out({ detail: `d2 update ${i}`, updated_at: `2026-05-03T14:0${i}:00Z` })),
      );
    }
    await Promise.all(tasks);
    // Reaching here without throwing satisfies the safety requirement.
    expect(tasks.length).toBe(10);
  });

  it('alternating reads + updates return consistent record content', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);

    await gen.updateOutcome('d1', out({ detail: 'first' }));
    let read1 = readFileSync(result!.path, 'utf8');
    expect(read1).toContain('first');

    await gen.updateOutcome('d1', out({ detail: 'second' }));
    let read2 = readFileSync(result!.path, 'utf8');
    expect(read2).toContain('second');
    expect(read2).not.toContain('first'); // outcome line was replaced
  });
});
