/**
 * Tests for tools/perf-assertion-audit.mjs additive/subtractive shape
 * detection (v1.49.637 C7 Sub-1a).
 *
 * Closes the audit-tool gap surfaced at v1.49.636 ship-time:
 * `expect(geoAvg).toBeLessThan(3 * baselineAvg + 5)` in
 * src/plane/activation.integration.test.ts was missed by the original
 * relative-ratio regex because the additive constant `+ 5` after the
 * multiplier broke the trailing `)` anchor.
 *
 * The broadened regex `\* \d+[\d.+ -]*\)` accepts:
 *   - multiplier-only: `* N)`
 *   - additive:        `* N + K)`
 *   - subtractive:     `* N - K)`
 *   - chained:         `* N + K + M)` etc.
 *
 * Lesson #10181 forward: each lesson surfaced becomes a mechanical
 * detector in the next counter-cadence cluster (per v1.49.636 closing
 * observation).
 */

import { describe, it, expect } from 'vitest';
import { detectShape, SHAPE_PATTERNS, toPosixEre } from '../perf-assertion-audit.mjs';

describe('perf-assertion-audit additive/subtractive shape (v1.49.637 C7 Sub-1a)', () => {
  it('catches multiplier-only relative-ratio (regression baseline, no behavior change)', () => {
    expect(detectShape('expect(t4).toBeLessThan(t1 * 3)')).toBe('relative-ratio');
    expect(detectShape('expect(t4).toBeLessThan(t1 * 10)')).toBe('relative-ratio');
    // Decimal multiplier preserved.
    expect(detectShape('expect(hot).toBeLessThan(cold * 0.5)')).toBe('relative-ratio');
  });

  it('catches additive shape `* N + K)` (Lesson #10181 forward)', () => {
    // The exact shape that broke at v1.49.636 ship-time stabilization.
    expect(detectShape('expect(geoAvg).toBeLessThan(3 * baselineAvg + 5)')).toBe(
      'relative-ratio',
    );
    expect(detectShape('expect(t4).toBeLessThan(t1 * 3 + 5)')).toBe('relative-ratio');
    expect(detectShape('expect(t4).toBeLessThan(t1 * 3 + 10)')).toBe('relative-ratio');
    expect(detectShape('expect(t4).toBeLessThan(t1 * 100 + 50)')).toBe('relative-ratio');
  });

  it('catches subtractive shape `* N - K)` (Lesson #10181 forward)', () => {
    expect(detectShape('expect(t4).toBeLessThan(t1 * 3 - 5)')).toBe('relative-ratio');
    expect(detectShape('expect(t4).toBeLessThan(t1 * 10 - 1)')).toBe('relative-ratio');
  });

  it('catches chained additive shape `* N + K + M)` (forward-compat)', () => {
    expect(detectShape('expect(t4).toBeLessThan(t1 * 3 + 5 + 2)')).toBe('relative-ratio');
  });

  it('does not match non-multiplied additive forms (avoid false positives)', () => {
    // No `*` → not a relative-ratio shape (could be absolute-threshold-* instead).
    expect(detectShape('expect(t4).toBeLessThan(t1 + 5)')).not.toBe('relative-ratio');
  });

  it('SHAPE_PATTERNS.relative-ratio regex compiles and is exported', () => {
    expect(SHAPE_PATTERNS['relative-ratio']).toBeInstanceOf(RegExp);
    // The broadened pattern contains the additive trailing class. NOTE the
    // class is `[0-9...]`, NOT `[\d...]`: a JS shorthand nested inside a
    // `[...]` would be mistranslated by toPosixEre (see portability test).
    expect(SHAPE_PATTERNS['relative-ratio'].source).toContain('[0-9.+ \\-]*');
    // And the pre-multiplier alternation (digit before `*`) for the
    // `expect(x).toBeLessThan(N * ident + K)` shape.
    expect(SHAPE_PATTERNS['relative-ratio'].source).toContain('\\d+(\\.\\d+)?\\s*\\*');
  });

  // Regression guard for the v1.49.921-followup BSD/macOS git-grep fix.
  // Every SHAPE_PATTERN source is fed to `git grep -E` via gitGrep(); BSD
  // git grep aborts on lazy quantifiers and on shorthand classes nested in
  // `[...]`. These assertions pin the invariant so a future edit can't
  // silently re-introduce a pattern that errors only on macOS.
  describe('POSIX-ERE portability (BSD/macOS git grep safe)', () => {
    for (const [name, re] of Object.entries(SHAPE_PATTERNS)) {
      it(`${name}: source has no lazy quantifier and no shorthand class inside [...]`, () => {
        expect(re.source).not.toMatch(/[*+?]\?/); // no +? *? ??
        expect(re.source).not.toMatch(/\[[^\]]*\\[dsw]/); // no [\d ...] etc.
      });
      it(`${name}: toPosixEre output is lazy-free and shorthand-free`, () => {
        const ere = toPosixEre(re.source);
        expect(ere).not.toMatch(/[*+?]\?/);
        expect(ere).not.toContain('\\d');
        expect(ere).not.toContain('\\s');
        expect(ere).not.toContain('[['); // no malformed nested class
      });
    }

    it('toPosixEre strips lazy quantifiers and translates shorthand classes', () => {
      expect(toPosixEre('a+?')).toBe('a+');
      expect(toPosixEre('a*?')).toBe('a*');
      expect(toPosixEre('a??')).toBe('a?');
      expect(toPosixEre('\\d+')).toBe('[0-9]+');
      expect(toPosixEre('\\s*')).toBe('[ \\t]*');
      expect(toPosixEre('[^)]+?x')).toBe('[^)]+x');
    });
  });
});
