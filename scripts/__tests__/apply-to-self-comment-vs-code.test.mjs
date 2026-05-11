/**
 * Tests for the `comment-vs-code-pattern` detector
 * (v1.49.637 C7 Sub-1b; closes Lesson #10189).
 *
 * Detector flags pattern catalogs (KNOWN_PATTERNS-like arrays of
 * detector objects with regex bodies) where a regex matches commentary
 * tokens without proper code-boundary anchors. Example: a regex like
 * /skip-guard/ without \b boundary, or /runIf/ without preceding
 * `it\.` or `describe\.`, will match prose in comments and over-fire.
 *
 * Lesson #10190 closing observation: paired positive + negative fixtures.
 */

import { describe, it, expect } from 'vitest';
import { KNOWN_PATTERNS } from '../apply-to-self.mjs';

const COMMENT_VS_CODE_DETECTOR = KNOWN_PATTERNS.find(
  (p) => p.name === 'comment-vs-code-pattern',
);

describe('comment-vs-code-pattern detector (v1.49.637 C7 Sub-1b)', () => {
  it('exists in KNOWN_PATTERNS with required metadata', () => {
    expect(COMMENT_VS_CODE_DETECTOR).toBeDefined();
    expect(COMMENT_VS_CODE_DETECTOR.firstSurfacedIn).toContain('Lesson #10189');
    expect(COMMENT_VS_CODE_DETECTOR.mode).toBe('per-file');
  });

  it('FIRES on a KNOWN_PATTERNS-style file with unbounded hyphenated regex (POSITIVE FIXTURE)', () => {
    const content = `
      const KNOWN_PATTERNS = [
        {
          name: 'over-eager-skip-guard',
          detect(content) {
            // Matches the literal phrase 'skip-guard' anywhere — even in comments.
            return /skip-guard/.test(content);
          },
        },
      ];
    `;
    const hit = COMMENT_VS_CODE_DETECTOR.detect(content);
    expect(hit).not.toBeNull();
    expect(hit.snippet).toContain('code-boundary anchor');
  });

  it('FIRES on detector with unbounded camelCase identifier regex (POSITIVE FIXTURE)', () => {
    const content = `
      const detector = {
        name: 'detect-runIf',
        detect(content) {
          return /runIf/.test(content);
        },
      };
    `;
    expect(COMMENT_VS_CODE_DETECTOR.detect(content)).not.toBeNull();
  });

  it('does NOT fire when regex uses \\b code boundaries (NEGATIVE FIXTURE)', () => {
    const content = `
      const KNOWN_PATTERNS = [
        {
          name: 'safe-skip-guard',
          detect(content) {
            return /\\bskip-guard\\b/.test(content);
          },
        },
      ];
    `;
    expect(COMMENT_VS_CODE_DETECTOR.detect(content)).toBeNull();
  });

  it('does NOT fire on a non-pattern-catalog file (NEGATIVE FIXTURE: unrelated code)', () => {
    // A regular utility file without KNOWN_PATTERNS or detect: shape.
    const content = `
      export function classifyName(name) {
        if (name === 'skip-guard') return 'special';
        return 'normal';
      }
    `;
    expect(COMMENT_VS_CODE_DETECTOR.detect(content)).toBeNull();
  });

  it('does NOT fire on empty content (NEGATIVE FIXTURE: noise)', () => {
    expect(COMMENT_VS_CODE_DETECTOR.detect('')).toBeNull();
  });
});
