import { describe, it, expect } from 'vitest';
import { DevPatternDetector } from '../dev-pattern-detector.js';
import type { DevSessionObservation } from '../dev-observation-types.js';

let n = 0;
function obs(o: Partial<DevSessionObservation> & { kind: DevSessionObservation['kind'] }): DevSessionObservation {
  return {
    id: `o${n++}`,
    timestamp: '2026-07-13T00:00:00.000Z',
    sessionId: 'sess-1',
    repo: 'gsd-skill-creator',
    ...o,
  } as DevSessionObservation;
}

const MASTERY_RE = /learner|mastery|rubric|\bpack\b|proficien|assessment/i;

describe('DevPatternDetector', () => {
  const detector = new DevPatternDetector();

  it('emits nothing for empty or sparse input', () => {
    expect(detector.detect([])).toEqual([]);
    expect(detector.detect([obs({ kind: 'friction', summary: 'slow', file: 'a.ts' })])).toEqual([]);
  });

  it('detects recurring friction on the same file (>=2)', () => {
    const patterns = detector.detect([
      obs({ kind: 'friction', summary: 'slow build', file: 'a.ts' }),
      obs({ kind: 'friction', summary: 'still slow', file: 'a.ts' }),
    ]);
    const p = patterns.find((x) => x.type === 'recurring-friction');
    expect(p).toBeDefined();
    expect(p!.evidenceCount).toBe(2);
    expect(p!.confidence).toBeGreaterThan(0);
    expect(p!.confidence).toBeLessThanOrEqual(1);
    expect(p!.repos).toEqual(['gsd-skill-creator']);
  });

  it('detects a correction cluster (>=2)', () => {
    const patterns = detector.detect([
      obs({ kind: 'correction', summary: 'wrong dir' }),
      obs({ kind: 'correction', summary: 'wrong again' }),
    ]);
    expect(patterns.some((p) => p.type === 'correction-cluster')).toBe(true);
  });

  it('detects a recurring gap by missing capability (>=2)', () => {
    const patterns = detector.detect([
      obs({ kind: 'gap', summary: 'no x', missing: 'x-skill' }),
      obs({ kind: 'gap', summary: 'still no x', missing: 'x-skill' }),
    ]);
    const p = patterns.find((x) => x.type === 'recurring-gap');
    expect(p).toBeDefined();
    expect(p!.evidenceCount).toBe(2);
  });

  it('detects a repeated tool sequence (bigram >=3)', () => {
    const seq: DevSessionObservation[] = ['Read', 'Edit', 'Read', 'Edit', 'Read', 'Edit'].map((tool) =>
      obs({ kind: 'tool_use', tool }),
    );
    const p = detector.detect(seq).find((x) => x.type === 'tool-sequence');
    expect(p).toBeDefined();
    expect(p!.description).toContain('Read');
    expect(p!.description).toContain('Edit');
  });

  it('NEVER emits mastery/education language in any description', () => {
    const patterns = detector.detect([
      obs({ kind: 'friction', summary: 'slow', file: 'a.ts' }),
      obs({ kind: 'friction', summary: 'slow', file: 'a.ts' }),
      obs({ kind: 'correction', summary: 'x' }),
      obs({ kind: 'correction', summary: 'y' }),
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
    ]);
    expect(patterns.length).toBeGreaterThan(0);
    for (const p of patterns) {
      expect(p.description).not.toMatch(MASTERY_RE);
      expect(p.type).not.toMatch(MASTERY_RE);
    }
  });

  it('produces stable ids across runs (idempotent)', () => {
    const input = [
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
      obs({ kind: 'gap', summary: 'g', missing: 'm' }),
    ];
    const a = detector.detect(input).map((p) => p.id).sort();
    const b = detector.detect(input).map((p) => p.id).sort();
    expect(a).toEqual(b);
  });

  it('honors a configurable recurrence threshold', () => {
    const strict = new DevPatternDetector({ minRecurrence: 3 });
    const two = [
      obs({ kind: 'friction', summary: 's', file: 'a.ts' }),
      obs({ kind: 'friction', summary: 's', file: 'a.ts' }),
    ];
    expect(strict.detect(two).some((p) => p.type === 'recurring-friction')).toBe(false);
  });

  it('confidence rises with evidence but stays within [0,1]', () => {
    const mk = (count: number) =>
      detector.detect(
        Array.from({ length: count }, () => obs({ kind: 'gap', summary: 'g', missing: 'm' })),
      ).find((p) => p.type === 'recurring-gap')!.confidence;
    const c2 = mk(2);
    const c10 = mk(10);
    expect(c10).toBeGreaterThan(c2);
    expect(c10).toBeLessThanOrEqual(1);
  });
});
