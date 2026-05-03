/**
 * C12 / T9 — verify-briefing self-check (D-25-28).
 *
 * Imports the verify function from the skill's source script and asserts:
 *   - Good briefing (matches PRD example) → exit 0 / pass
 *   - Briefing missing causal-hypothesis pattern → fail with descriptive error
 *   - Briefing missing uncertainty pattern → fail with descriptive error
 *   - Confidence not in {low, medium, high} → fail
 *   - Move with empty rationale → fail
 *   - Move with empty source_findings AND no "no prior evidence" → fail
 *   - Move with empty source_findings AND rationale notes "no prior evidence" → pass
 */
import { describe, it, expect } from 'vitest';
import { verify } from '../investigator/verify-briefing.js';

const GOOD_BRIEFING = {
  body: 'Wave 2 calibration is probably 80% complete; the held CAPCOM gate likely traces to a coupling spike between DACP and chipset (2.3× project baseline). It is unclear whether the rosetta-core modules will hit the same pattern.',
  confidence: 'medium',
  source_findings: ['F-2026-0501-0023', 'F-2026-0501-0024'],
  suggested_moves: [
    {
      rank: 1,
      title: 'Investigate DACP/chipset coupling',
      kind: 'research',
      rationale:
        'Probable root cause; 2.3× baseline coupling indicates architectural drift, not a localized bug.',
      expected_unblocks: 'CAPCOM gate informed clear',
      source_findings: ['F-2026-0501-0023'],
    },
  ],
};

describe('C12 / T9 — verify-briefing', () => {
  it('good briefing → no violations', () => {
    expect(verify(GOOD_BRIEFING)).toEqual([]);
  });

  it('briefing missing causal-hypothesis pattern → violation mentions causal hypothesis', () => {
    const bad = {
      ...GOOD_BRIEFING,
      body: 'Wave 2 is 80% done. The CAPCOM gate is held. There are 47 open findings. Whether this matters is unknown.',
    };
    const violations = verify(bad);
    expect(violations.some((v) => /causal hypothesis/i.test(v.message))).toBe(true);
  });

  it('briefing missing uncertainty pattern → violation mentions uncertainty', () => {
    const bad = {
      ...GOOD_BRIEFING,
      body: 'Wave 2 is held entirely because of the DACP/chipset coupling. Clear the gate now and the calibration will land. The fix is straightforward.',
    };
    const violations = verify(bad);
    expect(violations.some((v) => /uncertainty/i.test(v.message))).toBe(true);
  });

  it('confidence "definitely" → fails enum check', () => {
    const bad = { ...GOOD_BRIEFING, confidence: 'definitely' };
    const violations = verify(bad);
    expect(violations.some((v) => v.field === 'confidence')).toBe(true);
  });

  it('move with empty rationale → fails ≥10 char check', () => {
    const bad = {
      ...GOOD_BRIEFING,
      suggested_moves: [
        {
          ...GOOD_BRIEFING.suggested_moves[0],
          rationale: 'short',
        },
      ],
    };
    const violations = verify(bad);
    expect(
      violations.some(
        (v) => v.field.includes('rationale') && /≥10/.test(v.message),
      ),
    ).toBe(true);
  });

  it('move with empty source_findings AND no "no prior evidence" note → fails', () => {
    const bad = {
      ...GOOD_BRIEFING,
      suggested_moves: [
        {
          rank: 1,
          title: 'Investigate',
          kind: 'research',
          rationale: 'Some rationale that is long enough.',
          source_findings: [],
        },
      ],
    };
    const violations = verify(bad);
    expect(
      violations.some(
        (v) => v.field.includes('source_findings') && /no prior evidence/.test(v.message),
      ),
    ).toBe(true);
  });

  it('move with empty source_findings AND rationale notes "no prior evidence" → passes', () => {
    const ok = {
      ...GOOD_BRIEFING,
      suggested_moves: [
        {
          rank: 1,
          title: 'Snapshot diff since v1.49',
          kind: 'analyze',
          rationale:
            'Drift hypothesis cannot be verified without a snapshot diff — no prior evidence in KB; this run produces the evidence.',
          source_findings: [],
        },
      ],
    };
    expect(verify(ok)).toEqual([]);
  });

  it('multiple violations are all reported', () => {
    const bad = {
      body: 'Plain status text.',
      confidence: 'unknown',
      suggested_moves: [
        {
          rank: 1,
          title: 'Foo',
          kind: 'research',
          rationale: 'x', // too short
          source_findings: [],
        },
      ],
    };
    const violations = verify(bad);
    expect(violations.length).toBeGreaterThanOrEqual(4);
  });

  it('non-array suggested_moves → reports error', () => {
    const bad = {
      ...GOOD_BRIEFING,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suggested_moves: 'not-an-array' as any,
    };
    const violations = verify(bad);
    expect(violations.some((v) => v.field === 'suggested_moves')).toBe(true);
  });

  it('non-string body → reports error', () => {
    const bad = {
      ...GOOD_BRIEFING,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: 12345 as any,
    };
    const violations = verify(bad);
    expect(violations.some((v) => v.field === 'body')).toBe(true);
  });
});
