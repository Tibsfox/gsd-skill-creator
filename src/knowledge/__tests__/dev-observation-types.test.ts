import { describe, it, expect } from 'vitest';
import {
  DevSessionObservationSchema,
  DevObservationKind,
  type DevSessionObservation,
} from '../dev-observation-types.js';

const base = {
  id: 'obs-1',
  timestamp: '2026-07-13T00:00:00.000Z',
  sessionId: 'sess-abc',
  repo: 'gsd-skill-creator',
};

describe('DevObservationKind', () => {
  it('is the dev-native kind set — no education kinds', () => {
    expect([...DevObservationKind]).toEqual([
      'friction',
      'win',
      'correction',
      'decision',
      'gap',
      'tool_use',
      'checkpoint',
      'session_summary',
    ]);
  });
});

describe('DevSessionObservationSchema', () => {
  it('parses a friction observation and narrows on kind', () => {
    const r = DevSessionObservationSchema.safeParse({
      ...base,
      kind: 'friction',
      summary: 'repeated failing build on the same file',
      file: 'src/x.ts',
      severity: 'high',
    });
    expect(r.success).toBe(true);
    if (r.success && r.data.kind === 'friction') {
      expect(r.data.severity).toBe('high');
      expect(r.data.file).toBe('src/x.ts');
    }
  });

  it('parses a tool_use observation', () => {
    const r = DevSessionObservationSchema.safeParse({
      ...base,
      kind: 'tool_use',
      tool: 'Bash',
      command: 'npm run build',
      durationMs: 1234,
    });
    expect(r.success).toBe(true);
    if (r.success && r.data.kind === 'tool_use') {
      expect(r.data.tool).toBe('Bash');
      expect(r.data.durationMs).toBe(1234);
    }
  });

  it('parses a session_summary observation', () => {
    const r = DevSessionObservationSchema.safeParse({
      ...base,
      kind: 'session_summary',
      durationMinutes: 42,
      activeSkills: ['skill-forge'],
      reason: 'clear',
      toolCalls: 100,
      filesTouched: 6,
    });
    expect(r.success).toBe(true);
  });

  it('requires the dev-native base fields (sessionId, repo)', () => {
    const { sessionId: _s, ...noSession } = base;
    expect(
      DevSessionObservationSchema.safeParse({ ...noSession, kind: 'decision', summary: 'x' })
        .success,
    ).toBe(false);
  });

  it('rejects an unknown kind', () => {
    expect(
      DevSessionObservationSchema.safeParse({ ...base, kind: 'assessment_result', score: 90 })
        .success,
    ).toBe(false);
  });

  it('HONESTY BOUNDARY: rejects a record carrying education fields', () => {
    // The whole point of the dev-domain type — a fabricated learner/pack/score
    // must not validate, so education semantics can never leak into the corpus.
    const r = DevSessionObservationSchema.safeParse({
      ...base,
      kind: 'friction',
      summary: 'x',
      learnerId: 'learner-1',
      packId: 'pack-1',
      score: 90,
    });
    expect(r.success).toBe(false);
  });

  it('does not require any education field to construct a valid observation', () => {
    const obs: DevSessionObservation = {
      ...base,
      kind: 'gap',
      summary: 'no skill for X',
      missing: 'x-skill',
    };
    expect(DevSessionObservationSchema.safeParse(obs).success).toBe(true);
  });
});
