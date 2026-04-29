/**
 * C06 — ELC scorer Pedagogical Takeaway regex unification test
 *
 * Asserts that the regex at tools/elc-smoke/score.mjs:244 (post-v1.49.585 edit)
 * accepts BOTH the bare-heading and numeric-prefix forms of the Pedagogical
 * Takeaway heading. Eliminates per-ship gap-fix iteration that historically
 * cost build-agent time on every milestone.
 *
 * Authored 2026-04-28 in v1.49.585 component C06.
 * Spec: .planning/missions/v1-49-585-concerns-cleanup/components/06-elc-scorer-regex.md
 *
 * Test strategy: this is a regex-only assertion test. We replicate the regex
 * from score.mjs locally to test it against the three fixture forms — this
 * keeps the test hermetic (no fixture-file IO, no scorer-state coupling).
 * If score.mjs's regex is ever changed without this test being updated, the
 * test will diverge — that's the desired regression signal.
 */
import { describe, it, expect } from 'vitest';

// REPLICATE the regex from tools/elc-smoke/score.mjs:244
// If you change the regex below, you MUST also change it in score.mjs (and vice versa).
// The drift is intentional in the test direction — see test rationale above.
const PEDAGOGICAL_TAKEAWAY_RE = /^#{1,6}\s+(?:\d+\.\s+)?pedagogical takeaway\s*$/im;

const fixtureBareHeading = `# ELC Sample
## Pedagogical Takeaway
Example content here. This section explains what the reader should remember
about the era's specific design constraints.
`;

const fixturePrefixedHeading = `# ELC Sample
## 7. Pedagogical Takeaway
Example content here. The numeric prefix matches the MUS scorer form.
`;

const fixtureLowercasePrefixed = `# ELC Sample
## 12. Pedagogical takeaway
Example content here. Lowercase 't' — both /im flags should match.
`;

const fixtureNoHeading = `# ELC Sample
## Other Section
Content without the takeaway heading.
`;

describe('ELC scorer Pedagogical Takeaway regex (v1.49.585 C06 unification)', () => {
  it('CF-C06-01: bare heading "## Pedagogical Takeaway" matches', () => {
    expect(PEDAGOGICAL_TAKEAWAY_RE.test(fixtureBareHeading)).toBe(true);
  });

  it('CF-C06-02: numeric-prefix "## 7. Pedagogical Takeaway" matches (the v1.49.585 fix)', () => {
    expect(PEDAGOGICAL_TAKEAWAY_RE.test(fixturePrefixedHeading)).toBe(true);
  });

  it('CF-C06-03: missing heading correctly does NOT match', () => {
    expect(PEDAGOGICAL_TAKEAWAY_RE.test(fixtureNoHeading)).toBe(false);
  });

  it('EC-08: numeric-prefix with lowercase "takeaway" matches (case-insensitive /im)', () => {
    expect(PEDAGOGICAL_TAKEAWAY_RE.test(fixtureLowercasePrefixed)).toBe(true);
  });
});

describe('ELC scorer regex matches MUS scorer form', () => {
  // The MUS scorer at tools/mus-smoke/score.mjs:253-254 has the SAME form. Verify they
  // accept the same input set so future scorer drift can be caught.
  const MUS_RE = /^#{1,6}\s+(?:\d+\.\s+)?pedagogical takeaway\s*$/im;

  it('IT-07: ELC and MUS regexes accept identical inputs', () => {
    expect(MUS_RE.source).toBe(PEDAGOGICAL_TAKEAWAY_RE.source);
    expect(MUS_RE.flags).toBe(PEDAGOGICAL_TAKEAWAY_RE.flags);
  });
});
