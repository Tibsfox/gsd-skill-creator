/**
 * C11 / T3 — Daily sequence numbering (D-25-23).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { MeetingRecordGenerator } from '../record.js';
import { buildPopulatedKB, makeMeeting } from './_fixtures.js';

let recordsRoot: string;

beforeEach(() => {
  recordsRoot = mkdtempSync(join(tmpdir(), 'c11-seq-'));
});

afterEach(() => {
  try {
    rmSync(recordsRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C11 / T3 — daily sequence numbering', () => {
  it('empty dir → first meeting of the day gets 0001', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(basename(result!.path)).toBe('M-2026-05-03-0001.md');
  });

  it('existing 0001 + 0002 → next is 0003', async () => {
    writeFileSync(join(recordsRoot, 'M-2026-05-03-0001.md'), '# stub 1');
    writeFileSync(join(recordsRoot, 'M-2026-05-03-0002.md'), '# stub 2');
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(basename(result!.path)).toBe('M-2026-05-03-0003.md');
  });

  it('cross-day: yesterday existing 0007 → today still 0001', async () => {
    writeFileSync(join(recordsRoot, 'M-2026-05-02-0007.md'), '# stub yesterday');
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(basename(result!.path)).toBe('M-2026-05-03-0001.md');
  });

  it('records are written to the recordsRoot dir', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(result!.path.startsWith(recordsRoot)).toBe(true);
  });

  it('uses committed_at when available, falls back to started_at', async () => {
    const f = buildPopulatedKB();
    const m = makeMeeting({
      id: f.meeting.id,
      committed_at: null,
      started_at: '2026-05-04T10:00:00Z',
    });
    f.kb._state.meetings.set(m.id, m);
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(m.id);
    expect(basename(result!.path)).toBe('M-2026-05-04-0001.md');
  });
});
