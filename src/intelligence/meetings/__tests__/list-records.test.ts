/**
 * C11 / T7 — listRecords (D-25-24, header-only read).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MeetingRecordGenerator } from '../record.js';
import { buildPopulatedKB } from './_fixtures.js';

let recordsRoot: string;

beforeEach(() => {
  recordsRoot = mkdtempSync(join(tmpdir(), 'c11-lr-'));
});

afterEach(() => {
  try {
    rmSync(recordsRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C11 / T7 — listRecords', () => {
  it('returns summaries for all records in dir', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await gen.generateOnCommit(f.meeting.id);

    // Manually drop a second record
    writeFileSync(
      join(recordsRoot, 'M-2026-05-03-0002.md'),
      `# Meeting M-other-record — gsd-skill-creator\n\n**Started:** 2026-05-03T15:00:00Z\n**Committed:** 2026-05-03T15:30:00Z\n\n## Decisions\n\n### 1. Some decision\n\n- **Outcome:** ✓ complete · done\n  *(Updated 2026-05-03T16:00:00Z)*\n\n---\n\n*This record was auto-generated...*\n`,
    );

    const records = await gen.listRecords('gsd-skill-creator');
    expect(records.length).toBeGreaterThanOrEqual(2);
  });

  it('outcome counts (complete / in_progress / blocked) match', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);

    // Update d1 → complete; d2 → blocked
    await gen.updateOutcome('d1', {
      state: 'complete',
      detail: 'done',
      updated_at: '2026-05-03T14:00:00Z',
    });
    await gen.updateOutcome('d2', {
      state: 'blocked',
      detail: 'blocked',
      updated_at: '2026-05-03T14:00:00Z',
    });

    const records = await gen.listRecords('gsd-skill-creator');
    const summary = records.find((r) => r.path === result!.path);
    expect(summary).toBeDefined();
    expect(summary!.outcomesSummary.complete).toBe(1);
    expect(summary!.outcomesSummary.blocked).toBe(1);
    expect(summary!.outcomesSummary.in_progress).toBeGreaterThanOrEqual(1);
  });

  it('records sorted by started_at descending', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await gen.generateOnCommit(f.meeting.id);
    writeFileSync(
      join(recordsRoot, 'M-2026-05-04-0001.md'),
      `# Meeting M-tomorrow — gsd-skill-creator\n\n**Started:** 2026-05-04T10:00:00Z\n**Committed:** 2026-05-04T10:30:00Z\n\n---\n\n*This record was auto-generated...*\n`,
    );
    const records = await gen.listRecords('gsd-skill-creator');
    expect(records.length).toBe(2);
    // Most recent first
    expect(records[0].started_at).toContain('2026-05-04');
  });

  it('returns empty list when directory is empty or missing', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const records = await gen.listRecords('gsd-skill-creator');
    expect(records).toEqual([]);
  });

  it('decisionCount matches the rendered ### N. heading count', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await gen.generateOnCommit(f.meeting.id);
    const records = await gen.listRecords('gsd-skill-creator');
    expect(records[0].decisionCount).toBe(3);
  });
});
