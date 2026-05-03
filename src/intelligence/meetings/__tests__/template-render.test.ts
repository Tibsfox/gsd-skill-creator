/**
 * C11 / T2 — Template + render snapshot.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MeetingRecordGenerator } from '../record.js';
import { buildPopulatedKB, makeMeeting } from './_fixtures.js';

let recordsRoot: string;

beforeEach(() => {
  recordsRoot = mkdtempSync(join(tmpdir(), 'c11-tr-'));
});

afterEach(() => {
  try {
    rmSync(recordsRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C11 / T2 — render template', () => {
  it('renders a complete meeting record with briefing + decisions', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(result).not.toBeNull();
    const md = readFileSync(result!.path, 'utf8');
    expect(md).toContain(`Meeting ${f.meeting.id}`);
    expect(md).toContain('GSD Skill Creator');
    expect(md).toContain('## AI briefing at meeting start');
    expect(md).toContain('Confidence: medium');
    expect(md).toContain('## Decisions');
    expect(md).toContain('Investigate DACP/chipset coupling spike');
    expect(md).toContain('Pick up orphaned silicon-perf draft');
    expect(md).toContain('Snapshot diff since v1.49');
    expect(md).toContain('## Discussion notes');
    expect(md).toContain('## Considered but deferred');
    expect(md).toContain('## Dismissed');
    expect(md).toContain('This record was auto-generated');
  });

  it('briefing absent → "_No AI briefing was generated_" placeholder', async () => {
    const f = buildPopulatedKB();
    f.kb._state.briefings.clear();
    const meeting = makeMeeting({
      id: f.meeting.id,
      briefing_at_start: null,
    });
    f.kb._state.meetings.set(meeting.id, meeting);
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(meeting.id);
    expect(result).not.toBeNull();
    const md = readFileSync(result!.path, 'utf8');
    expect(md).toContain('_No AI briefing was generated for this meeting._');
  });

  it('5 utterance entries → 5 paragraphs in Discussion notes', async () => {
    const f = buildPopulatedKB();
    f.kb._state.meetingLog.set(f.meeting.id, [
      { kind: 'utterance', body: 'Note 1', recorded_at: '2026-05-03T13:00:00Z' },
      { kind: 'utterance', body: 'Note 2', recorded_at: '2026-05-03T13:01:00Z' },
      { kind: 'utterance', body: 'Note 3', recorded_at: '2026-05-03T13:02:00Z' },
      { kind: 'utterance', body: 'Note 4', recorded_at: '2026-05-03T13:03:00Z' },
      { kind: 'utterance', body: 'Note 5', recorded_at: '2026-05-03T13:04:00Z' },
    ]);
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    const md = readFileSync(result!.path, 'utf8');
    for (const n of ['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5']) {
      expect(md).toContain(n);
    }
  });

  it('0-decision (no bundled or sent-now) → returns null', async () => {
    const f = buildPopulatedKB();
    f.kb._state.decisions.clear();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(result).toBeNull();
  });

  it('record contains the bundle reference link', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    const md = readFileSync(result!.path, 'utf8');
    // Bundle link uses meeting id as bundle id
    expect(md).toContain(`${f.meeting.id}.bundle.yaml`);
  });
});
