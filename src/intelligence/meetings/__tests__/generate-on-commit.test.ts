/**
 * C11 / T4 — generateOnCommit end-to-end + perf.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MeetingRecordGenerator } from '../record.js';
import { buildPopulatedKB } from './_fixtures.js';

let recordsRoot: string;

beforeEach(() => {
  recordsRoot = mkdtempSync(join(tmpdir(), 'c11-goc-'));
});

afterEach(() => {
  try {
    rmSync(recordsRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C11 / T4 — generateOnCommit', () => {
  it('after commit → file exists at expected path with size > 0', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(result).not.toBeNull();
    expect(existsSync(result!.path)).toBe(true);
    expect(result!.size).toBeGreaterThan(0);
  });

  it('latency: <200 ms (P7)', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const t0 = performance.now();
    await gen.generateOnCommit(f.meeting.id);
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(200);
  });

  it('throws if meeting not found', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    await expect(
      gen.generateOnCommit('M-nonexistent'),
    ).rejects.toThrow('not found');
  });

  it('rendered record includes all 3 decisions in correct order', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    const md = readFileSync(result!.path, 'utf8');
    const headings = md.match(/^### \d+\. (.+?)(\s+\*\(.*?\)\*)?$/gm) ?? [];
    expect(headings.length).toBe(3);
    // sent_now first per sort: d3, then d1, d2 (in emission order)
    const titles = headings.map((h) => h.replace(/^### \d+\. /, '').replace(/\s+\*\(.*?\)\*.*$/, ''));
    expect(titles[0]).toBe('Snapshot diff since v1.49');
    expect(titles).toContain('Investigate DACP/chipset coupling spike');
    expect(titles).toContain('Pick up orphaned silicon-perf draft');
  });

  it('record is written atomically (no .tmp file remains)', async () => {
    const f = buildPopulatedKB();
    const gen = new MeetingRecordGenerator({ kb: f.kb, recordsRoot });
    const result = await gen.generateOnCommit(f.meeting.id);
    expect(existsSync(`${result!.path}.tmp`)).toBe(false);
  });
});
