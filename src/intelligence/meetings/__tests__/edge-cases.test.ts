/**
 * C11 / T8 — Edge cases (PRD §Edge Cases).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MeetingRecordGenerator } from '../record.js';
import { buildPopulatedKB, makeMeeting } from './_fixtures.js';

let recordsRoot: string;

beforeEach(() => {
  recordsRoot = mkdtempSync(join(tmpdir(), 'c11-ec-'));
});

afterEach(() => {
  try {
    rmSync(recordsRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C11 / T8 — edge cases', () => {
  it('briefing was null → record states "_No AI briefing was generated_"', async () => {
    const f = buildPopulatedKB();
    const m = makeMeeting({ id: f.meeting.id, briefing_at_start: null });
    f.kb._state.meetings.set(m.id, m);
    f.kb._state.briefings.clear();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(m.id);
    const md = readFileSync(result!.path, 'utf8');
    expect(md).toContain('_No AI briefing was generated for this meeting._');
  });

  it('updateOutcome for decision NOT in record → silently logged, no error', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await gen.generateOnCommit(f.meeting.id);
    // d999 doesn't exist in KB at all → silent return
    await expect(
      gen.updateOutcome('d999', {
        state: 'complete',
        detail: 'd',
        updated_at: '2026-05-03T14:00:00Z',
      }),
    ).resolves.toBeUndefined();
  });

  it('updateOutcome for non-existent meeting → silently logged', async () => {
    const f = buildPopulatedKB();
    // Create a decision pointing at a non-existent meeting
    const orphan = {
      ...f.decisions[0],
      id: 'orphan-d',
      meeting_id: 'M-NONEXISTENT' as never,
    };
    f.kb._state.decisions.set(orphan.id, orphan);
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await expect(
      gen.updateOutcome('orphan-d', {
        state: 'complete',
        detail: 'd',
        updated_at: '2026-05-03T14:00:00Z',
      }),
    ).resolves.toBeUndefined();
  });

  it('record with zero discussion notes → "_No discussion notes captured_"', async () => {
    const f = buildPopulatedKB();
    f.kb._state.meetingLog.set(f.meeting.id, []);
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    const md = readFileSync(result!.path, 'utf8');
    expect(md).toContain('_No discussion notes captured._');
  });

  it('record with no dismissed findings → "_No findings dismissed during this meeting._"', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    const md = readFileSync(result!.path, 'utf8');
    expect(md).toContain('_No findings dismissed during this meeting._');
  });

  it('readRecord on missing meeting throws descriptive error', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await expect(gen.readRecord('M-not-here')).rejects.toThrow('not found');
  });
});
