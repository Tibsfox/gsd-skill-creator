/**
 * C11 / T5 — updateOutcome (in-place, preserves user additions, D-25-21).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MeetingRecordGenerator } from '../record.js';
import { buildPopulatedKB } from './_fixtures.js';
import type { OutcomeUpdate } from '../record.js';

let recordsRoot: string;

beforeEach(() => {
  recordsRoot = mkdtempSync(join(tmpdir(), 'c11-uo-'));
});

afterEach(() => {
  try {
    rmSync(recordsRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

function makeOutcome(o: Partial<OutcomeUpdate> = {}): OutcomeUpdate {
  return {
    state: 'in_progress',
    detail: 'Wave 1 · 3 of 5 modules surveyed',
    updated_at: '2026-05-03T14:00:00Z',
    ...o,
  };
}

describe('C11 / T5 — updateOutcome', () => {
  it('updates only the targeted decision; others untouched', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    const before = readFileSync(result!.path, 'utf8');

    await gen.updateOutcome('d2', makeOutcome({ state: 'complete', detail: 'Mission package shipped' }));
    const after = readFileSync(result!.path, 'utf8');

    // d3 (snapshot diff) outcome line still pending
    expect(after).toMatch(/Snapshot diff since v1\.49[\s\S]*?Outcome:\*\* ⏳ pending/);
    // d1 (DACP coupling) outcome line still pending
    expect(after).toMatch(/Investigate DACP\/chipset coupling spike[\s\S]*?Outcome:\*\* ⏳ pending/);
    // d2 outcome should be marked complete
    expect(after).toMatch(/Pick up orphaned silicon-perf draft[\s\S]*?Outcome:\*\* ✓ complete · Mission package shipped/);

    // Other content unchanged
    expect(after.length).toBeGreaterThan(0);
    expect(before).not.toBe(after);
  });

  it('user-added content after auto footer is preserved across updates', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);

    // Append user notes after the auto-generated footer
    appendFileSync(
      result!.path,
      '\n\n## My personal notes\n\nThis meeting felt productive.\n',
    );

    await gen.updateOutcome('d1', makeOutcome({ state: 'complete', detail: 'Done' }));
    const after = readFileSync(result!.path, 'utf8');
    expect(after).toContain('## My personal notes');
    expect(after).toContain('This meeting felt productive.');
  });

  it('5 sequential updates → outcome line replaced cleanly each time', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);

    for (let i = 1; i <= 5; i++) {
      await gen.updateOutcome(
        'd1',
        makeOutcome({
          state: 'in_progress',
          detail: `Wave ${i} · update ${i}`,
          updated_at: `2026-05-03T14:0${i}:00Z`,
        }),
      );
    }
    const after = readFileSync(result!.path, 'utf8');
    // Should have only ONE outcome line for d1, not 5
    const d1Section = /Investigate DACP\/chipset coupling spike[\s\S]*?(?=^### |---$|---\n\*This)/m.exec(
      after,
    );
    expect(d1Section).not.toBeNull();
    const outcomeLineCount = (
      d1Section![0].match(/- \*\*Outcome:\*\* /g) ?? []
    ).length;
    expect(outcomeLineCount).toBe(1);
    // Final state reflects the last update
    expect(after).toContain('Wave 5 · update 5');
  });

  it('outcome with result_path adds [view result] link', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);

    await gen.updateOutcome(
      'd1',
      makeOutcome({
        state: 'complete',
        detail: 'Mission complete',
        result_path: '.planning/missions/d1/SUMMARY.md',
      }),
    );
    const after = readFileSync(result!.path, 'utf8');
    expect(after).toContain('[view result](.planning/missions/d1/SUMMARY.md)');
  });

  it('latency: <50 ms', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await gen.generateOnCommit(f.meeting.id);
    const t0 = performance.now();
    await gen.updateOutcome('d1', makeOutcome());
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(50);
  });

  it('decision not found → silently logged, no throw (PRD edge case)', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await gen.generateOnCommit(f.meeting.id);
    await expect(
      gen.updateOutcome('nonexistent-decision', makeOutcome()),
    ).resolves.toBeUndefined();
  });

  it('blocked + failed states use correct emoji', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);

    await gen.updateOutcome('d1', makeOutcome({ state: 'blocked', detail: 'Awaiting review' }));
    let after = readFileSync(result!.path, 'utf8');
    expect(after).toMatch(/Outcome:\*\* ⚠ blocked/);

    await gen.updateOutcome('d2', makeOutcome({ state: 'failed', detail: 'CI red' }));
    after = readFileSync(result!.path, 'utf8');
    expect(after).toMatch(/Outcome:\*\* ✗ failed/);
  });
});
