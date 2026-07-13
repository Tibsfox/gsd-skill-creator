import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  mapEventLine,
  mapTraceLine,
  mapSessionSummary,
  readDevObservations,
} from '../dev-observation-source.js';
import { DevSessionObservationSchema } from '../dev-observation-types.js';

const ctx = { sessionId: 'sess-1', repo: 'gsd-skill-creator' };

describe('mapEventLine', () => {
  it('maps a friction event with file/severity from payload', () => {
    const obs = mapEventLine(
      { t: '2026-07-13T00:00:00.000Z', kind: 'friction', label: 'slow build', payload: { file: 'a.ts', severity: 'high' } },
      ctx,
    );
    expect(obs?.kind).toBe('friction');
    if (obs?.kind === 'friction') {
      expect(obs.summary).toBe('slow build');
      expect(obs.file).toBe('a.ts');
      expect(obs.severity).toBe('high');
    }
    expect(DevSessionObservationSchema.safeParse(obs).success).toBe(true);
  });

  it('maps win / correction / decision / gap / checkpoint by kind', () => {
    const kinds = ['win', 'correction', 'decision', 'gap', 'checkpoint'] as const;
    for (const kind of kinds) {
      const obs = mapEventLine({ t: '2026-07-13T00:00:00.000Z', kind, label: `${kind} label` }, ctx);
      expect(obs?.kind).toBe(kind);
      expect(DevSessionObservationSchema.safeParse(obs).success).toBe(true);
    }
  });

  it('carries gap.missing from payload', () => {
    const obs = mapEventLine(
      { t: 't', kind: 'gap', label: 'no skill', payload: { missing: 'x-skill' } },
      ctx,
    );
    if (obs?.kind === 'gap') expect(obs.missing).toBe('x-skill');
  });

  it('drops an invalid severity rather than failing the whole observation', () => {
    const obs = mapEventLine(
      { t: 't', kind: 'friction', label: 'f', payload: { severity: 'catastrophic' } },
      ctx,
    );
    expect(obs?.kind).toBe('friction');
    if (obs?.kind === 'friction') expect(obs.severity).toBeUndefined();
    expect(DevSessionObservationSchema.safeParse(obs).success).toBe(true);
  });

  it('returns null for tokens and unknown/education kinds', () => {
    expect(mapEventLine({ t: 't', kind: 'tokens', label: '' }, ctx)).toBeNull();
    expect(mapEventLine({ t: 't', kind: 'assessment_result', label: '' }, ctx)).toBeNull();
    expect(mapEventLine({ t: 't', kind: 'note', label: 'x' }, ctx)).toBeNull();
  });

  it('returns null when the required summary (label) is empty', () => {
    expect(mapEventLine({ t: 't', kind: 'decision', label: '' }, ctx)).toBeNull();
  });

  it('produces a stable id for identical input', () => {
    const line = { t: 't', kind: 'win', label: 'same' };
    expect(mapEventLine(line, ctx)!.id).toBe(mapEventLine(line, ctx)!.id);
  });
});

describe('mapTraceLine', () => {
  it('maps a Bash trace to tool_use with command + durationMs', () => {
    const obs = mapTraceLine({ t: 't', tool: 'Bash', cmd: 'npm run build', duration_ms: 900 }, ctx);
    expect(obs?.kind).toBe('tool_use');
    if (obs?.kind === 'tool_use') {
      expect(obs.tool).toBe('Bash');
      expect(obs.command).toBe('npm run build');
      expect(obs.durationMs).toBe(900);
    }
    expect(DevSessionObservationSchema.safeParse(obs).success).toBe(true);
  });

  it('maps a Read trace to tool_use with file', () => {
    const obs = mapTraceLine({ t: 't', tool: 'Read', file: 'x.ts' }, ctx);
    if (obs?.kind === 'tool_use') expect(obs.file).toBe('x.ts');
  });

  it('returns null for a record with no tool', () => {
    expect(mapTraceLine({ t: 't', tool: null }, ctx)).toBeNull();
    expect(mapTraceLine({ t: 't' }, ctx)).toBeNull();
  });
});

describe('mapSessionSummary', () => {
  it('maps a summary object to a session_summary observation', () => {
    const obs = mapSessionSummary(
      { durationMinutes: 30, activeSkills: ['skill-forge'], reason: 'clear', toolCalls: 50, filesTouched: 4 },
      ctx,
    );
    expect(obs?.kind).toBe('session_summary');
    expect(DevSessionObservationSchema.safeParse(obs).success).toBe(true);
  });
});

describe('readDevObservations', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'dev-obs-'));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('reads both streams, skips corrupt/unknown lines, and validates every result', async () => {
    await fs.writeFile(
      join(dir, 'current.jsonl'),
      [
        JSON.stringify({ t: 't1', kind: 'friction', label: 'slow', payload: { file: 'a.ts' } }),
        JSON.stringify({ t: 't2', kind: 'tokens', label: '' }), // dropped
        '{corrupt json',
        JSON.stringify({ t: 't3', kind: 'gap', label: 'no skill', payload: { missing: 'x' } }),
      ].join('\n') + '\n',
    );
    await fs.writeFile(
      join(dir, 'current.tool-trace.jsonl'),
      [
        JSON.stringify({ t: 't4', tool: 'Bash', cmd: 'ls', duration_ms: 10 }),
        JSON.stringify({ t: 't5', tool: null }), // dropped
      ].join('\n') + '\n',
    );

    const obs = await readDevObservations({ sessionsDir: dir, ...ctx });
    const kinds = obs.map((o) => o.kind).sort();
    expect(kinds).toEqual(['friction', 'gap', 'tool_use']);
    for (const o of obs) expect(DevSessionObservationSchema.safeParse(o).success).toBe(true);
  });

  it('includes a passed session summary as a session_summary observation', async () => {
    await fs.writeFile(join(dir, 'current.jsonl'), '');
    const obs = await readDevObservations({
      sessionsDir: dir,
      ...ctx,
      sessionSummary: { durationMinutes: 5 },
    });
    expect(obs.map((o) => o.kind)).toContain('session_summary');
  });

  it('returns [] when the sessions dir has no streams', async () => {
    const obs = await readDevObservations({ sessionsDir: join(dir, 'nope'), ...ctx });
    expect(obs).toEqual([]);
  });
});
