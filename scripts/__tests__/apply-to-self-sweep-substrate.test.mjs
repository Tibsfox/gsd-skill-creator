/**
 * Tests for the `sweep-substrate-allowlist-missing` detector
 * (v1.49.637 C7 Sub-1b; closes Lesson #10190).
 *
 * Detector flags sweep-tool scripts (scripts/sweep-*.sh / .mjs)
 * authored without a paired negative-test fixture
 * (scripts/__tests__/sweep-*.test.mjs) in the same diff. Sweep tools
 * must ship with allowlist/negative-test coverage to prevent
 * over-sweep of substrate citations (the original v1.49.636 sweep saga
 * lesson: file-level sweeps over-swept substrate citations until a
 * line-pattern allowlist with negative-test fixture was added).
 *
 * Diff-level detector (mode: 'diff-level'). Tested via the
 * runApplyToSelf injectedAddedFiles fixture API.
 *
 * Lesson #10190 closing observation: paired positive + negative fixtures.
 */

import { describe, it, expect } from 'vitest';
import { KNOWN_PATTERNS, runApplyToSelf } from '../apply-to-self.mjs';

const SWEEP_DETECTOR = KNOWN_PATTERNS.find(
  (p) => p.name === 'sweep-substrate-allowlist-missing',
);

describe('sweep-substrate-allowlist-missing detector (v1.49.637 C7 Sub-1b)', () => {
  it('exists in KNOWN_PATTERNS with required metadata', () => {
    expect(SWEEP_DETECTOR).toBeDefined();
    expect(SWEEP_DETECTOR.firstSurfacedIn).toContain('Lesson #10190');
    expect(SWEEP_DETECTOR.mode).toBe('diff-level');
  });

  it('FIRES on sweep script added without paired test fixture (POSITIVE FIXTURE)', () => {
    const diffFiles = [
      'scripts/sweep-old-feature-flag.sh',
      // Note: NO scripts/__tests__/sweep-old-feature-flag.test.mjs in diff.
      'docs/release-notes/v1.49.637/changes.md',
    ];
    const hits = SWEEP_DETECTOR.detect(diffFiles);
    expect(hits).not.toBeNull();
    expect(Array.isArray(hits)).toBe(true);
    expect(hits.length).toBe(1);
    expect(hits[0].file).toBe('scripts/sweep-old-feature-flag.sh');
    expect(hits[0].snippet).toContain('without paired');
  });

  it('FIRES on multiple sweep scripts without tests (POSITIVE FIXTURE)', () => {
    const diffFiles = [
      'scripts/sweep-alpha.sh',
      'scripts/sweep-beta.mjs',
    ];
    const hits = SWEEP_DETECTOR.detect(diffFiles);
    expect(hits).not.toBeNull();
    expect(hits.length).toBe(2);
  });

  it('does NOT fire when sweep script ships with paired test (NEGATIVE FIXTURE)', () => {
    const diffFiles = [
      'scripts/sweep-old-feature-flag.sh',
      'scripts/__tests__/sweep-old-feature-flag.test.mjs',
    ];
    expect(SWEEP_DETECTOR.detect(diffFiles)).toBeNull();
  });

  it('does NOT fire when paired test is .test.ts (NEGATIVE FIXTURE: alternate extension)', () => {
    const diffFiles = [
      'scripts/sweep-foo.mjs',
      'scripts/__tests__/sweep-foo.test.ts',
    ];
    expect(SWEEP_DETECTOR.detect(diffFiles)).toBeNull();
  });

  it('does NOT fire when no sweep scripts are in the diff (NEGATIVE FIXTURE: unrelated diff)', () => {
    const diffFiles = [
      'src/foo.ts',
      'src/bar.ts',
      'tests/__tests__/foo.test.ts',
    ];
    expect(SWEEP_DETECTOR.detect(diffFiles)).toBeNull();
  });

  it('does NOT fire on existing sweep script (NEGATIVE FIXTURE: not in diff-added set)', () => {
    // diffFiles contains only the added files. An existing
    // scripts/sweep-foo.sh that's NOT in the diff should not fire.
    const diffFiles = [
      'src/some-other-change.ts',
    ];
    expect(SWEEP_DETECTOR.detect(diffFiles)).toBeNull();
  });

  it('integrates with runApplyToSelf via injectedAddedFiles', () => {
    // Use injectedAddedFiles to exercise the diff-level dispatch path
    // without spinning up git history.
    const result = runApplyToSelf({
      injectedAddedFiles: ['scripts/sweep-something.sh'],
      disciplinePaths: [],
      allowlistPath: '/nonexistent/allowlist.md',
    });
    const sweepFindings = result.findings.filter(
      (f) => f.patternName === 'sweep-substrate-allowlist-missing',
    );
    expect(sweepFindings.length).toBe(1);
    expect(sweepFindings[0].file).toBe('scripts/sweep-something.sh');
  });

  it('runApplyToSelf does NOT add findings when sweep + test paired (NEGATIVE INTEGRATION)', () => {
    const result = runApplyToSelf({
      injectedAddedFiles: [
        'scripts/sweep-balanced.sh',
        'scripts/__tests__/sweep-balanced.test.mjs',
      ],
      disciplinePaths: [],
      allowlistPath: '/nonexistent/allowlist.md',
    });
    const sweepFindings = result.findings.filter(
      (f) => f.patternName === 'sweep-substrate-allowlist-missing',
    );
    expect(sweepFindings.length).toBe(0);
  });
});
