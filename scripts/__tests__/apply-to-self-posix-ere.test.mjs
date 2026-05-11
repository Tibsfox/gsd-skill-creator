/**
 * Tests for the `posix-ere-translation-missing` detector
 * (v1.49.637 C7 Sub-1b; closes Lesson #10188).
 *
 * Detector flags JS regex `.source` strings containing \d / \s / \w
 * passed to POSIX-ERE consumers (`git grep -E`, `grep -E`, `awk`,
 * `sed -E`) without translation to character classes ([0-9], [ \t]).
 * POSIX ERE does NOT understand JS shorthand classes; the translation
 * should happen at the consumer boundary.
 *
 * Lesson #10190 closing observation: each pattern detector ships with
 * paired positive + negative fixtures to prevent false positives.
 */

import { describe, it, expect } from 'vitest';
import { KNOWN_PATTERNS } from '../apply-to-self.mjs';

const POSIX_ERE_DETECTOR = KNOWN_PATTERNS.find(
  (p) => p.name === 'posix-ere-translation-missing',
);

describe('posix-ere-translation-missing detector (v1.49.637 C7 Sub-1b)', () => {
  it('exists in KNOWN_PATTERNS with required metadata', () => {
    expect(POSIX_ERE_DETECTOR).toBeDefined();
    expect(POSIX_ERE_DETECTOR.firstSurfacedIn).toContain('Lesson #10188');
    expect(POSIX_ERE_DETECTOR.mode).toBe('per-file');
    expect(typeof POSIX_ERE_DETECTOR.detect).toBe('function');
  });

  it('FIRES when .source with \\d is piped into git grep -E without translation (POSITIVE FIXTURE)', () => {
    const content = `
      import { spawnSync } from 'node:child_process';
      const PATTERN = /version-\\d+/;
      spawnSync('git', ['grep', '-n', '-E', PATTERN.source]);
    `;
    const hit = POSIX_ERE_DETECTOR.detect(content);
    expect(hit).not.toBeNull();
    expect(hit.snippet).toContain('POSIX-ERE');
  });

  it('FIRES on grep -E + \\s shorthand (POSITIVE FIXTURE)', () => {
    const content = `
      const RE = /foo\\s+bar/;
      spawnSync('grep', ['-E', RE.source, 'file.txt']);
    `;
    expect(POSIX_ERE_DETECTOR.detect(content)).not.toBeNull();
  });

  it('FIRES on awk + \\w shorthand (POSITIVE FIXTURE)', () => {
    const content = `
      const RE = /\\w+@example.com/;
      spawnSync('awk', [\`{ if (\${RE.source}) print }\`]);
    `;
    expect(POSIX_ERE_DETECTOR.detect(content)).not.toBeNull();
  });

  it('does NOT fire when translation .replace(/\\\\d/g, "[0-9]") is present (NEGATIVE FIXTURE)', () => {
    const content = `
      const RE = /version-\\d+/;
      const ereCompat = RE.source.replace(/\\\\d/g, '[0-9]');
      spawnSync('git', ['grep', '-n', '-E', ereCompat]);
    `;
    expect(POSIX_ERE_DETECTOR.detect(content)).toBeNull();
  });

  it('does NOT fire when no POSIX-ERE consumer is used (NEGATIVE FIXTURE: pure JS regex use)', () => {
    const content = `
      const RE = /version-\\d+/;
      if (RE.test(line)) { console.log('match'); }
    `;
    expect(POSIX_ERE_DETECTOR.detect(content)).toBeNull();
  });

  it('does NOT fire when shorthand classes are absent (NEGATIVE FIXTURE: character-class regex)', () => {
    const content = `
      const RE = /version-[0-9]+/;
      spawnSync('git', ['grep', '-E', RE.source]);
    `;
    expect(POSIX_ERE_DETECTOR.detect(content)).toBeNull();
  });

  it('does NOT fire on empty content (NEGATIVE FIXTURE: noise)', () => {
    expect(POSIX_ERE_DETECTOR.detect('')).toBeNull();
    expect(POSIX_ERE_DETECTOR.detect('// just a comment')).toBeNull();
  });
});
