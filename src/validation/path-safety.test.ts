import { describe, it, expect } from 'vitest';
import { resolve, sep } from 'path';
import {
  validateSafeName,
  assertSafePath,
  PathTraversalError,
} from './path-safety.js';

// ============================================================================
// validateSafeName Tests
// ============================================================================

describe('validateSafeName', () => {
  describe('valid names', () => {
    it('should accept simple lowercase name', () => {
      const result = validateSafeName('my-skill');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept alphanumeric name with hyphens', () => {
      const result = validateSafeName('valid-name-123');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept single character name', () => {
      const result = validateSafeName('a');
      expect(result.valid).toBe(true);
    });

    it('should accept numeric name', () => {
      const result = validateSafeName('123');
      expect(result.valid).toBe(true);
    });
  });

  describe('empty and special entries', () => {
    it('should reject empty string', () => {
      const result = validateSafeName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name is empty');
    });

    it('should reject single dot (current directory)', () => {
      const result = validateSafeName('.');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name is a filesystem special entry');
    });
  });

  describe('null bytes', () => {
    it('should reject name containing null byte', () => {
      const result = validateSafeName('skill\x00name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains null byte');
    });

    it('should reject null byte at start', () => {
      const result = validateSafeName('\x00skill');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains null byte');
    });
  });

  describe('path traversal sequences', () => {
    it('should reject leading ../', () => {
      const result = validateSafeName('../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains path traversal sequence: ..');
    });

    it('should reject backslash traversal', () => {
      const result = validateSafeName('..\\windows\\system32');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains path traversal sequence: ..');
    });

    it('should reject mid-path traversal', () => {
      const result = validateSafeName('foo/../bar');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains path traversal sequence: ..');
    });

    it('should reject standalone ..', () => {
      const result = validateSafeName('..');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains path traversal sequence: ..');
    });
  });

  describe('path separators', () => {
    it('should reject forward slash', () => {
      const result = validateSafeName('foo/bar');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains path separator: /');
    });

    it('should reject backslash', () => {
      const result = validateSafeName('foo\\bar');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains path separator: \\');
    });

    it('should reject trailing slash', () => {
      const result = validateSafeName('foo/');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name contains path separator: /');
    });
  });
});

// ============================================================================
// assertSafePath Tests
// ============================================================================

describe('assertSafePath', () => {
  const baseDir = '/home/user/.claude/skills';

  describe('valid paths within base directory', () => {
    it('should accept path directly under base', () => {
      expect(() =>
        assertSafePath(`${baseDir}/my-skill`, baseDir),
      ).not.toThrow();
    });

    it('should accept nested path under base', () => {
      expect(() =>
        assertSafePath(`${baseDir}/my-skill/SKILL.md`, baseDir),
      ).not.toThrow();
    });

    it('should accept the base directory itself', () => {
      expect(() =>
        assertSafePath(baseDir, baseDir),
      ).not.toThrow();
    });
  });

  describe('paths escaping base directory', () => {
    it('should throw for path outside base directory', () => {
      expect(() =>
        assertSafePath('/etc/passwd', baseDir),
      ).toThrow(PathTraversalError);
    });

    it('should throw for partial prefix match (no separator boundary)', () => {
      // "/home/user/.claude/skillsevil" should NOT match "/home/user/.claude/skills"
      expect(() =>
        assertSafePath('/home/user/.claude/skillsevil', baseDir),
      ).toThrow(PathTraversalError);
    });

    it('should throw for sibling directory', () => {
      expect(() =>
        assertSafePath('/home/user/.claude/agents/evil', baseDir),
      ).toThrow(PathTraversalError);
    });

    it('should throw for parent traversal', () => {
      const traversed = resolve(baseDir, '..', '..', 'etc', 'passwd');
      expect(() =>
        assertSafePath(traversed, baseDir),
      ).toThrow(PathTraversalError);
    });
  });

  describe('PathTraversalError properties', () => {
    it('should have correct error name', () => {
      try {
        assertSafePath('/etc/passwd', baseDir);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(PathTraversalError);
        expect((err as PathTraversalError).name).toBe('PathTraversalError');
        expect((err as PathTraversalError).message).toContain('Path escapes base directory');
      }
    });

    it('should be instanceof Error', () => {
      const error = new PathTraversalError('test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('relative path resolution', () => {
    it('should resolve relative paths before comparison', () => {
      // Both should resolve to absolute paths
      const relBase = './skills';
      const relPath = './skills/my-skill';
      expect(() =>
        assertSafePath(resolve(relPath), resolve(relBase)),
      ).not.toThrow();
    });
  });
});
