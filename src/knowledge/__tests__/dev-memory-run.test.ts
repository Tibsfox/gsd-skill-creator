import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runDevMemory } from '../dev-memory-run.js';
import type { PatternMemoryWriter } from '../memory-sink.js';
import type { MemoryRecord } from '../../memory/types.js';

class Collector implements PatternMemoryWriter {
  readonly records: MemoryRecord[] = [];
  async store(r: MemoryRecord): Promise<MemoryRecord> {
    this.records.push(r);
    return r;
  }
}

describe('runDevMemory', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'dev-run-'));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('reads streams, mines patterns, and writes them through the injected writer', async () => {
    await fs.writeFile(
      join(dir, 'current.jsonl'),
      [
        JSON.stringify({ t: 't1', kind: 'gap', label: 'no x', payload: { missing: 'x-skill' } }),
        JSON.stringify({ t: 't2', kind: 'gap', label: 'still no x', payload: { missing: 'x-skill' } }),
      ].join('\n') + '\n',
    );
    const writer = new Collector();
    const stored = await runDevMemory({
      sessionsDir: dir,
      sessionId: 's1',
      repo: 'gsd-skill-creator',
      writer,
    });
    expect(stored.length).toBeGreaterThan(0);
    expect(writer.records.length).toBe(stored.length);
    expect(stored.every((r) => r.type === 'episodic' || r.type === 'feedback')).toBe(true);
    expect(stored.some((r) => r.tags.includes('pattern:dev-recurring-gap'))).toBe(true);
  });

  it('returns [] when the session has no streams (writes nothing)', async () => {
    const writer = new Collector();
    const stored = await runDevMemory({
      sessionsDir: join(dir, 'absent'),
      sessionId: 's1',
      repo: 'gsd-skill-creator',
      writer,
    });
    expect(stored).toEqual([]);
    expect(writer.records).toEqual([]);
  });

  it('threads options (minRecurrence) through to the detector', async () => {
    await fs.writeFile(
      join(dir, 'current.jsonl'),
      [
        JSON.stringify({ t: 't1', kind: 'friction', label: 's', payload: { file: 'a.ts' } }),
        JSON.stringify({ t: 't2', kind: 'friction', label: 's', payload: { file: 'a.ts' } }),
      ].join('\n') + '\n',
    );
    const writer = new Collector();
    const stored = await runDevMemory({
      sessionsDir: dir,
      sessionId: 's1',
      repo: 'gsd-skill-creator',
      writer,
      options: { minRecurrence: 3 },
    });
    expect(stored).toEqual([]);
  });
});
