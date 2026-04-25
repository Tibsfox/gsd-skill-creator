/**
 * HB-05 — overallScore aggregates 0..5 correctly.
 */

import { describe, it, expect } from 'vitest';
import { checkStructuralCompleteness } from '../index.js';

describe('overallScore aggregation', () => {
  it('empty doc → score 5 in default mode (every principle vacuously satisfied)', () => {
    const r = checkStructuralCompleteness('', 'empty.md');
    expect(r.overallScore).toBe(5);
    expect(r.passed).toBe(true);
  });

  it('algorithm with no complexity → score 4', () => {
    const md = 'This skill runs an algorithm to compute results.';
    const r = checkStructuralCompleteness(md, 'm.md');
    expect(r.overallScore).toBe(4);
    expect(r.passed).toBe(false);
  });

  it('two violations → score 3', () => {
    // Algorithm w/o complexity AND data w/o classification.
    const md =
      'This skill runs an algorithm to process input data files and writes output records.';
    const r = checkStructuralCompleteness(md, 'm.md');
    expect(r.overallScore).toBe(3);
  });

  it('strict mode forces total evaluation → empty doc scores 0', () => {
    const r = checkStructuralCompleteness('', 'empty.md', { strict: true });
    expect(r.overallScore).toBe(0);
    expect(r.passed).toBe(false);
  });

  it('overallScore equals number of satisfied principles', () => {
    const md = 'Algorithm with O(n) complexity; decidable.';
    const r = checkStructuralCompleteness(md, 'm.md');
    const satisfied = Object.values(r.principleResults).filter((p) => p.satisfied).length;
    expect(r.overallScore).toBe(satisfied);
  });
});
