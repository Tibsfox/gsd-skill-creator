import { describe, it, expect } from 'vitest';
import {
  validateSkillDirectory,
  isLegacyFlatFile,
  validateDirectoryNameMatch,
  type DirectoryValidationResult,
} from './directory-validation.js';

// ============================================================================
// validateSkillDirectory Tests
// ============================================================================

describe('validateSkillDirectory', () => {
  describe('valid paths', () => {
    it('should validate relative subdirectory path', () => {
      const result = validateSkillDirectory('.claude/skills/my-skill/SKILL.md');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.isLegacyFlatFile).toBe(false);
      expect(result.directoryName).toBe('my-skill');
    });

    it('should validate absolute path', () => {
      const result = validateSkillDirectory('/absolute/path/.claude/skills/foo/SKILL.md');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.isLegacyFlatFile).toBe(false);
      expect(result.directoryName).toBe('foo');
    });

    it('should handle deeply nested project paths', () => {
      const result = validateSkillDirectory('/home/user/projects/app/.claude/skills/api-tools/SKILL.md');

      expect(result.valid).toBe(true);
      expect(result.directoryName).toBe('api-tools');
    });
  });

  describe('legacy flat files', () => {
    it('should detect legacy flat file in .claude/skills/', () => {
      const result = validateSkillDirectory('.claude/skills/my-skill.md');

      expect(result.valid).toBe(false);
      expect(result.isLegacyFlatFile).toBe(true);
      expect(result.errors).toContain('Legacy flat-file format detected. Skills should be in subdirectories.');
      expect(result.suggestedPath).toBe('.claude/skills/my-skill/SKILL.md');
      expect(result.directoryName).toBe('my-skill');
    });

    it('should detect legacy flat file with absolute path', () => {
      const result = validateSkillDirectory('/home/user/project/.claude/skills/test.md');

      expect(result.valid).toBe(false);
      expect(result.isLegacyFlatFile).toBe(true);
      expect(result.suggestedPath).toBe('/home/user/project/.claude/skills/test/SKILL.md');
    });

    it('should suggest correct migration path for legacy file', () => {
      const result = validateSkillDirectory('.claude/skills/code-review.md');

      expect(result.suggestedPath).toBe('.claude/skills/code-review/SKILL.md');
    });
  });

  describe('invalid paths', () => {
    it('should reject non-SKILL.md file in subdirectory', () => {
      const result = validateSkillDirectory('.claude/skills/my-skill/README.md');

      expect(result.valid).toBe(false);
      expect(result.isLegacyFlatFile).toBe(false);
      expect(result.errors).toContain('Skill file must be named SKILL.md');
    });

    it('should reject SKILL.md directly in .claude/skills/ (no subdirectory)', () => {
      const result = validateSkillDirectory('.claude/skills/SKILL.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SKILL.md must be in a named subdirectory (e.g., .claude/skills/my-skill/SKILL.md)');
    });

    it('should reject path in .claude/commands/ instead of .claude/skills/', () => {
      const result = validateSkillDirectory('.claude/commands/foo/SKILL.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Skills should be in .claude/skills/, not .claude/commands/');
    });

    it('should reject empty path', () => {
      const result = validateSkillDirectory('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Path is required');
    });

    it('should reject just SKILL.md without directory', () => {
      const result = validateSkillDirectory('SKILL.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SKILL.md must be in a named subdirectory (e.g., .claude/skills/my-skill/SKILL.md)');
    });
  });

  describe('edge cases', () => {
    it('should handle Windows-style path separators', () => {
      const result = validateSkillDirectory('.claude\\skills\\my-skill\\SKILL.md');

      expect(result.valid).toBe(true);
      expect(result.directoryName).toBe('my-skill');
    });

    it('should handle mixed path separators', () => {
      const result = validateSkillDirectory('.claude/skills\\my-skill/SKILL.md');

      expect(result.valid).toBe(true);
      expect(result.directoryName).toBe('my-skill');
    });

    it('should handle skill name with numbers', () => {
      const result = validateSkillDirectory('.claude/skills/skill-v2/SKILL.md');

      expect(result.valid).toBe(true);
      expect(result.directoryName).toBe('skill-v2');
    });
  });
});

// ============================================================================
// isLegacyFlatFile Tests
// ============================================================================

describe('isLegacyFlatFile', () => {
  describe('legacy flat files (should return true)', () => {
    it('should detect simple legacy path', () => {
      expect(isLegacyFlatFile('.claude/skills/my-skill.md')).toBe(true);
    });

    it('should detect legacy path with absolute prefix', () => {
      expect(isLegacyFlatFile('/home/user/.claude/skills/test.md')).toBe(true);
    });
  });

  describe('non-legacy paths (should return false)', () => {
    it('should return false for valid subdirectory structure', () => {
      expect(isLegacyFlatFile('.claude/skills/my-skill/SKILL.md')).toBe(false);
    });

    it('should return false for non-.md file', () => {
      expect(isLegacyFlatFile('.claude/skills/my-skill.txt')).toBe(false);
    });

    it('should return false for empty path', () => {
      expect(isLegacyFlatFile('')).toBe(false);
    });

    it('should return false for SKILL.md directly in skills', () => {
      expect(isLegacyFlatFile('.claude/skills/SKILL.md')).toBe(false);
    });

    it('should return false for deeply nested .md file', () => {
      // This is an .md file in a subdirectory, not a flat file
      expect(isLegacyFlatFile('.claude/skills/my-skill/docs/notes.md')).toBe(false);
    });
  });
});

// ============================================================================
// validateDirectoryNameMatch Tests
// ============================================================================

describe('validateDirectoryNameMatch', () => {
  describe('matching names', () => {
    it('should pass when directory name matches frontmatter name', () => {
      const result = validateDirectoryNameMatch(
        '.claude/skills/foo/SKILL.md',
        'foo'
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should pass for absolute path with matching name', () => {
      const result = validateDirectoryNameMatch(
        '/home/user/project/.claude/skills/my-api/SKILL.md',
        'my-api'
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('mismatched names', () => {
    it('should fail when directory name differs from frontmatter', () => {
      const result = validateDirectoryNameMatch(
        '.claude/skills/foo/SKILL.md',
        'bar'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Directory name "foo" does not match frontmatter name "bar"');
    });

    it('should fail for case difference', () => {
      const result = validateDirectoryNameMatch(
        '.claude/skills/myskill/SKILL.md',
        'MySkill'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match');
    });
  });

  describe('legacy file name matching', () => {
    it('should extract name from legacy flat file for comparison', () => {
      const result = validateDirectoryNameMatch(
        '.claude/skills/my-skill.md',
        'my-skill'
      );

      expect(result.valid).toBe(true);
    });

    it('should detect mismatch in legacy flat file', () => {
      const result = validateDirectoryNameMatch(
        '.claude/skills/old-name.md',
        'new-name'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Directory name "old-name" does not match frontmatter name "new-name"');
    });
  });

  describe('edge cases', () => {
    it('should pass when path is empty', () => {
      const result = validateDirectoryNameMatch('', 'foo');
      expect(result.valid).toBe(true);
    });

    it('should pass when frontmatter name is empty', () => {
      const result = validateDirectoryNameMatch('.claude/skills/foo/SKILL.md', '');
      expect(result.valid).toBe(true);
    });

    it('should handle Windows-style path', () => {
      const result = validateDirectoryNameMatch(
        '.claude\\skills\\my-skill\\SKILL.md',
        'my-skill'
      );

      expect(result.valid).toBe(true);
    });
  });
});
