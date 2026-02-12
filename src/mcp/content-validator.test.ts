import { describe, it, expect } from 'vitest';
import {
  validateContentSafety,
  type ContentSafetyResult,
  type ContentSafetyOptions,
} from './content-validator.js';
import type { SkillMetadata } from '../types/skill.js';

/** Helper to build valid metadata */
function validMetadata(overrides: Partial<SkillMetadata> = {}): Partial<SkillMetadata> {
  return {
    name: 'test-skill',
    description: 'A test skill for validation',
    ...overrides,
  };
}

const standardOpts: ContentSafetyOptions = { strict: false };
const strictOpts: ContentSafetyOptions = { strict: true };

describe('validateContentSafety', () => {
  // ==========================================================================
  // Standard tier tests (local skills)
  // ==========================================================================
  describe('standard tier (local skills)', () => {
    it('returns safe=true for valid skill with clean metadata', () => {
      const result = validateContentSafety(
        'Some skill body content',
        validMetadata(),
        standardOpts,
      );
      expect(result.safe).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('returns error when name is missing', () => {
      const result = validateContentSafety(
        'Body content',
        validMetadata({ name: '' }),
        standardOpts,
      );
      expect(result.safe).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => /name/i.test(e))).toBe(true);
    });

    it('returns error when description is missing', () => {
      const result = validateContentSafety(
        'Body content',
        validMetadata({ description: '' }),
        standardOpts,
      );
      expect(result.safe).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => /description/i.test(e))).toBe(true);
    });

    it('does NOT check body content in standard tier', () => {
      // Body has injection pattern but standard tier should not flag it
      const dangerousBody = 'Run this: !`echo $ARGUMENTS`';
      const result = validateContentSafety(
        dangerousBody,
        validMetadata(),
        standardOpts,
      );
      expect(result.safe).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.errors).toEqual([]);
    });
  });

  // ==========================================================================
  // Strict tier tests (remote skills)
  // ==========================================================================
  describe('strict tier (remote skills)', () => {
    it('detects $ARGUMENTS inside !`command` block as injection risk', () => {
      const body = 'Process files with !`rm -rf $ARGUMENTS` to clean up.';
      const result = validateContentSafety(body, validMetadata(), strictOpts);
      expect(result.safe).toBe(false);
      expect(result.errors.some(e => /injection/i.test(e))).toBe(true);
    });

    it('allows $ARGUMENTS outside command blocks (no error)', () => {
      const body = 'This skill takes $ARGUMENTS as input and processes them.';
      const result = validateContentSafety(body, validMetadata(), strictOpts);
      expect(result.safe).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('does not false-positive on $ARGUMENTS in code fence documentation', () => {
      const body = [
        'Example usage:',
        '```bash',
        '!`echo $ARGUMENTS`',
        '```',
        'The above is just documentation.',
      ].join('\n');
      const result = validateContentSafety(body, validMetadata(), strictOpts);
      // Code blocks should be stripped before scanning, so no injection error
      expect(result.errors.filter(e => /injection/i.test(e))).toEqual([]);
    });

    it('warns when allowed-tools contains Bash/shell tool', () => {
      const metadata = validMetadata({
        'allowed-tools': ['Read', 'Bash', 'Grep'],
      });
      const result = validateContentSafety('Safe body', metadata, strictOpts);
      expect(result.warnings.some(w => /bash|shell/i.test(w))).toBe(true);
    });

    it('does not warn when allowed-tools contains only safe tools', () => {
      const metadata = validMetadata({
        'allowed-tools': ['Read', 'Write', 'Grep'],
      });
      const result = validateContentSafety('Safe body', metadata, strictOpts);
      // Write is NOT flagged (only Bash/shell/exec are)
      expect(result.warnings.filter(w => /bash|shell/i.test(w))).toEqual([]);
    });

    it('warns when skill body exceeds 50,000 chars', () => {
      const largeBody = 'x'.repeat(50_001);
      const result = validateContentSafety(
        largeBody,
        validMetadata(),
        strictOpts,
      );
      expect(result.warnings.some(w => /size|50[,.]?000/i.test(w))).toBe(true);
    });

    it('does not warn when body is under 50,000 chars', () => {
      const normalBody = 'x'.repeat(49_999);
      const result = validateContentSafety(
        normalBody,
        validMetadata(),
        strictOpts,
      );
      expect(result.warnings.filter(w => /size/i.test(w))).toEqual([]);
    });

    it('accumulates multiple issues (warnings AND errors)', () => {
      const body = '!`dangerous $ARGUMENTS command`' + 'x'.repeat(50_001);
      const metadata = validMetadata({
        'allowed-tools': ['Bash'],
        name: '', // missing name -> error
      });
      const result = validateContentSafety(body, metadata, strictOpts);
      expect(result.safe).toBe(false);
      // Should have at least: name error + injection error
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      // Should have at least: bash warning + size warning
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    });

    it('includes standard tier checks in addition to body/tool analysis', () => {
      // Missing description should be caught even in strict mode
      const result = validateContentSafety(
        'Clean body',
        validMetadata({ description: '' }),
        strictOpts,
      );
      expect(result.safe).toBe(false);
      expect(result.errors.some(e => /description/i.test(e))).toBe(true);
    });
  });
});
