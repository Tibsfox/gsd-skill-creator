import { describe, it, expect } from 'vitest';
import {
  safeParseFrontmatter,
  YamlSafetyError,
  type SafeFrontmatterResult,
} from './yaml-safety.js';

// ============================================================================
// safeParseFrontmatter Tests
// ============================================================================

describe('safeParseFrontmatter', () => {
  describe('successful parsing of standard YAML types', () => {
    it('should parse string values', () => {
      const result = safeParseFrontmatter('---\nname: test\n---\nbody');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test');
        expect(result.body).toBe('body');
      }
    });

    it('should parse number values', () => {
      const result = safeParseFrontmatter('---\ncount: 42\nprice: 3.14\n---\n');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(42);
        expect(result.data.price).toBe(3.14);
      }
    });

    it('should parse boolean values', () => {
      const result = safeParseFrontmatter('---\nenabled: true\ndisabled: false\n---\n');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
        expect(result.data.disabled).toBe(false);
      }
    });

    it('should parse arrays', () => {
      const result = safeParseFrontmatter('---\ntags:\n  - a\n  - b\n  - c\n---\n');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['a', 'b', 'c']);
      }
    });

    it('should parse nested objects', () => {
      const result = safeParseFrontmatter('---\nmeta:\n  author: alice\n  version: 1\n---\n');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meta).toEqual({ author: 'alice', version: 1 });
      }
    });

    it('should parse null values', () => {
      const result = safeParseFrontmatter('---\noptional: null\n---\n');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optional).toBeNull();
      }
    });

    it('should parse multiple fields together', () => {
      const content = '---\nname: skill\nversion: 2\ntags:\n  - a\n  - b\nactive: true\n---\nBody text here';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: 'skill',
          version: 2,
          tags: ['a', 'b'],
          active: true,
        });
        expect(result.body).toBe('Body text here');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty frontmatter', () => {
      const result = safeParseFrontmatter('---\n---\nbody');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
        expect(result.body).toBe('body');
      }
    });

    it('should handle no frontmatter', () => {
      const result = safeParseFrontmatter('just body content');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
        expect(result.body).toBe('just body content');
      }
    });

    it('should handle empty string', () => {
      const result = safeParseFrontmatter('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
        expect(result.body).toBe('');
      }
    });

    it('should handle whitespace-only content', () => {
      const result = safeParseFrontmatter('   \n  \n   ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });
  });

  describe('dangerous YAML tag rejection', () => {
    it('should reject !!js/function', () => {
      const content = '---\nfoo: !!js/function >\n  function() { return 42; }\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('js/function');
      }
    });

    it('should reject !!js/undefined', () => {
      const content = '---\nfoo: !!js/undefined\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('js/undefined');
      }
    });

    it('should reject !!python/object', () => {
      const content = '---\nfoo: !!python/object:os.system\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('python/object');
      }
    });

    it('should reject !!python/name', () => {
      const content = '---\nfoo: !!python/name:subprocess.call\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('python/name');
      }
    });

    it('should reject !!js/regexp', () => {
      const content = '---\nfoo: !!js/regexp /evil/g\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('js/regexp');
      }
    });

    it('should reject custom !!tags not in YAML core schema', () => {
      const content = '---\nfoo: !!custom/dangerous payload\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should provide descriptive error for dangerous tags', () => {
      const content = '---\nfoo: !!js/function >\n  function() {}\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Error should mention the tag and that it's not allowed
        expect(result.error).toMatch(/dangerous|not allowed|unknown tag/i);
      }
    });
  });

  describe('malformed YAML handling', () => {
    it('should return error for invalid YAML syntax', () => {
      const content = '---\n: : :\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('should return error for non-object frontmatter (number)', () => {
      const content = '---\n42\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Frontmatter must be an object');
      }
    });

    it('should return error for non-object frontmatter (string)', () => {
      const content = '---\njust a string\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Frontmatter must be an object');
      }
    });

    it('should return error for non-object frontmatter (array)', () => {
      const content = '---\n- item1\n- item2\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Frontmatter must be an object');
      }
    });

    it('should provide descriptive errors (not just "parse error")', () => {
      const content = '---\nkey: [unclosed\n---\n';
      const result = safeParseFrontmatter(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThan(10);
      }
    });
  });

  describe('SafeFrontmatterResult type discrimination', () => {
    it('should narrow to success branch', () => {
      const result: SafeFrontmatterResult = safeParseFrontmatter('---\nk: v\n---\n');
      if (result.success) {
        // TypeScript should allow accessing data and body
        const _data: Record<string, unknown> = result.data;
        const _body: string = result.body;
        expect(_data).toBeDefined();
        expect(_body).toBeDefined();
      } else {
        expect.fail('Expected success');
      }
    });

    it('should narrow to error branch', () => {
      const result: SafeFrontmatterResult = safeParseFrontmatter('---\n42\n---\n');
      if (!result.success) {
        const _error: string = result.error;
        expect(_error).toBeDefined();
      } else {
        expect.fail('Expected failure');
      }
    });
  });
});

// ============================================================================
// YamlSafetyError Tests
// ============================================================================

describe('YamlSafetyError', () => {
  it('should have correct name property', () => {
    const error = new YamlSafetyError('test message');
    expect(error.name).toBe('YamlSafetyError');
  });

  it('should be instanceof Error', () => {
    const error = new YamlSafetyError('test');
    expect(error).toBeInstanceOf(Error);
  });

  it('should preserve message', () => {
    const error = new YamlSafetyError('dangerous tag detected');
    expect(error.message).toBe('dangerous tag detected');
  });

  it('should have a stack trace', () => {
    const error = new YamlSafetyError('test');
    expect(error.stack).toBeDefined();
  });
});
