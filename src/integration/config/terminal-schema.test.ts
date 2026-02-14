/**
 * TDD tests for the terminal config Zod schema.
 *
 * Covers CONF-01 (schema validation) and CONF-03 (sensible defaults):
 * - Defaults from empty object
 * - Partial overrides
 * - Port range validation (1-65535)
 * - base_path validation (must start with /)
 * - auth_mode enum validation
 * - Theme enum validation
 * - Type validation (wrong types rejected)
 * - DEFAULT_TERMINAL_CONFIG constant
 * - Full config roundtrip
 *
 * @module integration/config/terminal-schema.test
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { TerminalConfigSchema, DEFAULT_TERMINAL_CONFIG } from './terminal-schema.js';

// ============================================================================
// Defaults from empty object
// ============================================================================

describe('TerminalConfigSchema defaults', () => {
  it('produces port=11338 from empty object', () => {
    const config = TerminalConfigSchema.parse({});
    expect(config.port).toBe(11338);
  });

  it('produces base_path="/terminal" from empty object', () => {
    const config = TerminalConfigSchema.parse({});
    expect(config.base_path).toBe('/terminal');
  });

  it('produces auth_mode="none" from empty object', () => {
    const config = TerminalConfigSchema.parse({});
    expect(config.auth_mode).toBe('none');
  });

  it('produces theme="dark" from empty object', () => {
    const config = TerminalConfigSchema.parse({});
    expect(config.theme).toBe('dark');
  });

  it('produces complete default config from empty object', () => {
    const config = TerminalConfigSchema.parse({});
    expect(config).toEqual({
      port: 11338,
      base_path: '/terminal',
      auth_mode: 'none',
      theme: 'dark',
      session_name: 'dev',
    });
  });
});

// ============================================================================
// Partial overrides
// ============================================================================

describe('Partial overrides', () => {
  it('setting port=8080 keeps other defaults', () => {
    const config = TerminalConfigSchema.parse({ port: 8080 });

    expect(config.port).toBe(8080);
    expect(config.base_path).toBe('/terminal');
    expect(config.auth_mode).toBe('none');
    expect(config.theme).toBe('dark');
  });

  it('setting theme="light" keeps other defaults', () => {
    const config = TerminalConfigSchema.parse({ theme: 'light' });

    expect(config.theme).toBe('light');
    expect(config.port).toBe(11338);
    expect(config.base_path).toBe('/terminal');
    expect(config.auth_mode).toBe('none');
  });

  it('setting base_path="/wetty" keeps other defaults', () => {
    const config = TerminalConfigSchema.parse({ base_path: '/wetty' });

    expect(config.base_path).toBe('/wetty');
    expect(config.port).toBe(11338);
    expect(config.auth_mode).toBe('none');
    expect(config.theme).toBe('dark');
  });
});

// ============================================================================
// Port range validation
// ============================================================================

describe('Port range validation', () => {
  it('rejects port 0 (below minimum)', () => {
    expect(() =>
      TerminalConfigSchema.parse({ port: 0 }),
    ).toThrow(z.ZodError);
  });

  it('rejects port 65536 (above maximum)', () => {
    expect(() =>
      TerminalConfigSchema.parse({ port: 65536 }),
    ).toThrow(z.ZodError);
  });

  it('rejects port -1 (negative)', () => {
    expect(() =>
      TerminalConfigSchema.parse({ port: -1 }),
    ).toThrow(z.ZodError);
  });

  it('accepts port 1 (minimum boundary)', () => {
    const config = TerminalConfigSchema.parse({ port: 1 });
    expect(config.port).toBe(1);
  });

  it('accepts port 65535 (maximum boundary)', () => {
    const config = TerminalConfigSchema.parse({ port: 65535 });
    expect(config.port).toBe(65535);
  });
});

// ============================================================================
// base_path validation
// ============================================================================

describe('base_path validation', () => {
  it('rejects empty string', () => {
    expect(() =>
      TerminalConfigSchema.parse({ base_path: '' }),
    ).toThrow(z.ZodError);
  });

  it('rejects string not starting with /', () => {
    expect(() =>
      TerminalConfigSchema.parse({ base_path: 'terminal' }),
    ).toThrow(z.ZodError);
  });

  it('accepts /terminal', () => {
    const config = TerminalConfigSchema.parse({ base_path: '/terminal' });
    expect(config.base_path).toBe('/terminal');
  });

  it('accepts /wetty', () => {
    const config = TerminalConfigSchema.parse({ base_path: '/wetty' });
    expect(config.base_path).toBe('/wetty');
  });

  it('accepts / (root path)', () => {
    const config = TerminalConfigSchema.parse({ base_path: '/' });
    expect(config.base_path).toBe('/');
  });
});

// ============================================================================
// auth_mode validation
// ============================================================================

describe('auth_mode validation', () => {
  it('rejects "password"', () => {
    expect(() =>
      TerminalConfigSchema.parse({ auth_mode: 'password' }),
    ).toThrow(z.ZodError);
  });

  it('rejects "ssh"', () => {
    expect(() =>
      TerminalConfigSchema.parse({ auth_mode: 'ssh' }),
    ).toThrow(z.ZodError);
  });

  it('accepts "none"', () => {
    const config = TerminalConfigSchema.parse({ auth_mode: 'none' });
    expect(config.auth_mode).toBe('none');
  });
});

// ============================================================================
// Theme validation
// ============================================================================

describe('Theme validation', () => {
  it('rejects "blue" (invalid theme)', () => {
    expect(() =>
      TerminalConfigSchema.parse({ theme: 'blue' }),
    ).toThrow(z.ZodError);
  });

  it('accepts "dark"', () => {
    const config = TerminalConfigSchema.parse({ theme: 'dark' });
    expect(config.theme).toBe('dark');
  });

  it('accepts "light"', () => {
    const config = TerminalConfigSchema.parse({ theme: 'light' });
    expect(config.theme).toBe('light');
  });
});

// ============================================================================
// Type validation (wrong types)
// ============================================================================

describe('Type validation', () => {
  it('rejects string for port', () => {
    expect(() =>
      TerminalConfigSchema.parse({ port: '11338' }),
    ).toThrow(z.ZodError);
  });

  it('rejects number for base_path', () => {
    expect(() =>
      TerminalConfigSchema.parse({ base_path: 3000 }),
    ).toThrow(z.ZodError);
  });

  it('rejects boolean for auth_mode', () => {
    expect(() =>
      TerminalConfigSchema.parse({ auth_mode: true }),
    ).toThrow(z.ZodError);
  });
});

// ============================================================================
// DEFAULT_TERMINAL_CONFIG constant
// ============================================================================

describe('DEFAULT_TERMINAL_CONFIG', () => {
  it('deep-equals TerminalConfigSchema.parse({})', () => {
    const parsed = TerminalConfigSchema.parse({});
    expect(DEFAULT_TERMINAL_CONFIG).toEqual(parsed);
  });

  it('is a plain object', () => {
    expect(typeof DEFAULT_TERMINAL_CONFIG).toBe('object');
    expect(DEFAULT_TERMINAL_CONFIG).not.toBeNull();
  });
});

// ============================================================================
// Full config roundtrip
// ============================================================================

describe('Full config roundtrip', () => {
  it('preserves all values when a fully specified config is parsed', () => {
    const fullConfig = {
      port: 8080,
      base_path: '/wetty',
      auth_mode: 'none' as const,
      theme: 'light' as const,
      session_name: 'work',
    };

    const parsed = TerminalConfigSchema.parse(fullConfig);
    expect(parsed).toEqual(fullConfig);
  });
});
