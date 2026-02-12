import { describe, it, expect } from 'vitest';
import {
  validateHook,
  HookValidationResult,
  HookValidationError,
  FORBIDDEN_PATTERNS,
} from './hook-validator.js';

// ============================================================================
// Hook Validator Tests
// ============================================================================

describe('FORBIDDEN_PATTERNS', () => {
  it('is an exported array of pattern/description pairs', () => {
    expect(Array.isArray(FORBIDDEN_PATTERNS)).toBe(true);
    expect(FORBIDDEN_PATTERNS.length).toBeGreaterThan(0);
    for (const entry of FORBIDDEN_PATTERNS) {
      expect(entry).toHaveProperty('pattern');
      expect(entry).toHaveProperty('description');
      expect(entry.pattern).toBeInstanceOf(RegExp);
      expect(typeof entry.description).toBe('string');
    }
  });
});

describe('HookValidationError', () => {
  it('has name "HookValidationError"', () => {
    const err = new HookValidationError('bad hook', ['violation1']);
    expect(err.name).toBe('HookValidationError');
  });

  it('extends Error', () => {
    const err = new HookValidationError('bad hook', ['violation1']);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('bad hook');
  });

  it('carries violations array', () => {
    const violations = ['modifies process.env', 'uses eval()'];
    const err = new HookValidationError('bad hook', violations);
    expect(err.violations).toEqual(violations);
  });
});

describe('validateHook', () => {
  describe('safe hooks', () => {
    it('accepts simple safe code', () => {
      const result = validateHook('const x = 1; return x;');
      expect(result.valid).toBe(true);
    });

    it('accepts reading process.env (not assignment)', () => {
      const result = validateHook('const mode = process.env.NODE_ENV');
      expect(result.valid).toBe(true);
    });

    it('accepts code with console.log', () => {
      const result = validateHook('console.log("hello world")');
      expect(result.valid).toBe(true);
    });

    it('accepts code with Math.random', () => {
      const result = validateHook('const r = Math.random();');
      expect(result.valid).toBe(true);
    });

    it('accepts code that mentions "eval" in a string literal', () => {
      // The word "eval" in a string should not trigger false positive
      const result = validateHook('const msg = "do not eval this"');
      expect(result.valid).toBe(true);
    });
  });

  describe('process.env mutation', () => {
    it('rejects process.env dot assignment', () => {
      const result = validateHook('process.env.SECRET = "x"');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations).toContain('modifies process.env');
      }
    });

    it('rejects process.env bracket assignment', () => {
      const result = validateHook('process.env["SECRET"] = "x"');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations).toContain('modifies process.env');
      }
    });
  });

  describe('process.exit', () => {
    it('rejects process.exit call', () => {
      const result = validateHook('process.exit(1)');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations).toContain('calls process.exit');
      }
    });

    it('rejects process.exit with no args', () => {
      const result = validateHook('process.exit()');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations).toContain('calls process.exit');
      }
    });
  });

  describe('eval usage', () => {
    it('rejects eval() call', () => {
      const result = validateHook('eval("code")');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations).toContain('uses eval()');
      }
    });

    it('rejects new Function() constructor', () => {
      const result = validateHook('new Function("return 1")');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations).toContain('uses Function constructor');
      }
    });
  });

  describe('global state', () => {
    it('rejects global. modification', () => {
      const result = validateHook('global.foo = 1');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations.some(v => v.includes('global state'))).toBe(true);
      }
    });

    it('rejects globalThis. assignment', () => {
      const result = validateHook('globalThis.foo = 1');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations.some(v => v.includes('global state'))).toBe(true);
      }
    });
  });

  describe('multiple violations', () => {
    it('collects all violations, not just the first', () => {
      const result = validateHook('process.env.X = 1; eval("y")');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations.length).toBeGreaterThanOrEqual(2);
        expect(result.violations).toContain('modifies process.env');
        expect(result.violations).toContain('uses eval()');
      }
    });

    it('detects three violations together', () => {
      const result = validateHook(
        'process.env.X = 1; process.exit(0); globalThis.y = 2',
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.violations.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
