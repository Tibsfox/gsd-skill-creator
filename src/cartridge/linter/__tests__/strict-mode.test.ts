/**
 * HB-05 — strict mode flips false-negative-tolerant default to
 * false-positive-tolerant: every principle is evaluated regardless of
 * trigger, and any unsupplied grounding fails the check.
 */

import { describe, it, expect } from 'vitest';
import { checkStructuralCompleteness, PRINCIPLES } from '../index.js';

describe('strict mode', () => {
  it('default mode: vacuously passes principles with no trigger', () => {
    const r = checkStructuralCompleteness('A vague description.', 'm.md');
    expect(r.passed).toBe(true);
    for (const p of PRINCIPLES) {
      expect(r.principleResults[p].satisfied).toBe(true);
    }
  });

  it('strict mode: same input fails every principle', () => {
    const r = checkStructuralCompleteness('A vague description.', 'm.md', { strict: true });
    expect(r.passed).toBe(false);
    expect(r.overallScore).toBe(0);
    for (const p of PRINCIPLES) {
      expect(r.principleResults[p].satisfied).toBe(false);
    }
  });

  it('strict mode: full positive fixture still passes (groundings supplied for all 5)', () => {
    const md = `
      Algorithm with complexity O(n log n) decidable.
      If precondition holds then postcondition follows by induction; invariant maintained.
      Bayesian posterior with 95% confidence interval over the likelihood; uniform prior.
      Data classified as **public** or **internal**; PII redacted; GDPR.
      Quality assessed via rubric: passes if metric ≥ 0.95; acceptance criteria.
    `;
    const r = checkStructuralCompleteness(md, 'm.md', { strict: true });
    expect(r.passed).toBe(true);
    expect(r.overallScore).toBe(5);
  });

  it('strict mode: rationale mentions "strict" when failing', () => {
    const r = checkStructuralCompleteness('A vague description.', 'm.md', { strict: true });
    for (const p of PRINCIPLES) {
      expect(r.principleResults[p].rationale.toLowerCase()).toContain('strict');
    }
  });
});
