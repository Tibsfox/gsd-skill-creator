/**
 * Tests for cli-utils — shared flag helpers for wasteland CLI commands.
 *
 * Covers:
 * - hasFlag: --long and -short forms
 * - getFlagValue: value extraction
 * - extractPositionalArgs: skip flags, extract positional values
 */

import { describe, it, expect } from 'vitest';
import { hasFlag, getFlagValue, extractPositionalArgs } from '../cli-utils.js';

// ============================================================================
// hasFlag
// ============================================================================

describe('hasFlag', () => {
  it('detects --verbose flag', () => {
    expect(hasFlag(['--verbose', 'open'], 'verbose')).toBe(true);
  });

  it('detects -v short form', () => {
    expect(hasFlag(['-v', 'open'], 'verbose')).toBe(true);
  });

  it('returns false when flag absent', () => {
    expect(hasFlag(['open', 'medium'], 'verbose')).toBe(false);
  });

  it('matches any of multiple flag names', () => {
    expect(hasFlag(['--json'], 'verbose', 'json')).toBe(true);
  });

  it('returns false for empty args', () => {
    expect(hasFlag([], 'verbose')).toBe(false);
  });

  it('detects --offline flag', () => {
    expect(hasFlag(['--offline', 'open'], 'offline')).toBe(true);
  });
});

// ============================================================================
// getFlagValue
// ============================================================================

describe('getFlagValue', () => {
  it('returns value after --status', () => {
    expect(getFlagValue(['--status', 'open', '--verbose'], 'status')).toBe('open');
  });

  it('returns undefined when flag absent', () => {
    expect(getFlagValue(['open', 'medium'], 'status')).toBeUndefined();
  });

  it('returns undefined when flag is last token (no value)', () => {
    expect(getFlagValue(['--status'], 'status')).toBeUndefined();
  });

  it('returns the correct value with multiple flags', () => {
    expect(getFlagValue(['--tag', 'rust', '--status', 'open'], 'tag')).toBe('rust');
    expect(getFlagValue(['--tag', 'rust', '--status', 'open'], 'status')).toBe('open');
  });
});

// ============================================================================
// extractPositionalArgs
// ============================================================================

describe('extractPositionalArgs', () => {
  it('extracts bare positional args', () => {
    expect(extractPositionalArgs(['open', 'medium', 'rust'])).toEqual(['open', 'medium', 'rust']);
  });

  it('skips --flag and following token with generic detection', () => {
    // Generic detection: --flag followed by non-flag token = both skipped
    expect(extractPositionalArgs(['--verbose', 'open'])).toEqual([]);
  });

  it('skips -f short flags', () => {
    expect(extractPositionalArgs(['-v', 'open'])).toEqual(['open']);
  });

  it('skips --flag and its value with generic detection', () => {
    // Without flagsWithValues set, generic detection: --flag followed by non-flag = skip both
    expect(extractPositionalArgs(['--status', 'open', 'medium'])).toEqual(['medium']);
  });

  it('uses flagsWithValues set for explicit value consumption', () => {
    const flags = new Set(['--status']);
    expect(extractPositionalArgs(['--status', 'open', 'medium'], flags)).toEqual(['medium']);
  });

  it('boolean flags without values in explicit mode', () => {
    const flags = new Set(['--status']);
    // --verbose is NOT in flagsWithValues, so it doesn't consume the next token
    expect(extractPositionalArgs(['--verbose', 'open', '--status', 'claimed'], flags)).toEqual(['open']);
  });

  it('returns empty for all flags', () => {
    expect(extractPositionalArgs(['--verbose', '--json', '--offline'])).toEqual([]);
  });

  it('returns empty for empty args', () => {
    expect(extractPositionalArgs([])).toEqual([]);
  });

  it('handles mixed flags and positionals', () => {
    const flags = new Set(['--status', '--effort']);
    const args = ['--status', 'open', '--verbose', 'medium', '--effort', 'large', 'rust'];
    expect(extractPositionalArgs(args, flags)).toEqual(['medium', 'rust']);
  });
});
