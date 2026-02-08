/**
 * Tests for the argument extractor module.
 *
 * Verifies regex-based extraction of phase numbers, flags, versions,
 * profiles, and descriptions from both natural language input and
 * raw argument strings.
 */

import { describe, it, expect } from 'vitest';
import { extractArguments } from './argument-extractor.js';

// ============================================================================
// Phase Number Extraction
// ============================================================================

describe('extractArguments - phase number', () => {
  it('extracts phase number from "plan phase 3"', () => {
    const result = extractArguments('plan phase 3');
    expect(result.phaseNumber).toBe('3');
  });

  it('extracts decimal phase from "phase 37.1"', () => {
    const result = extractArguments('phase 37.1');
    expect(result.phaseNumber).toBe('37.1');
  });

  it('extracts phase number from raw args "3 --research"', () => {
    const result = extractArguments('3 --research');
    expect(result.phaseNumber).toBe('3');
  });

  it('extracts phase number from standalone "3" (short input)', () => {
    const result = extractArguments('3');
    expect(result.phaseNumber).toBe('3');
  });

  it('does not extract random numbers from long natural language text', () => {
    const result = extractArguments(
      'I want to work on something but I have 5 ideas and need help choosing',
    );
    expect(result.phaseNumber).toBeNull();
  });

  it('extracts phase number with "phase" keyword even in long text', () => {
    const result = extractArguments(
      'I want to start working on phase 42 now please',
    );
    expect(result.phaseNumber).toBe('42');
  });
});

// ============================================================================
// Flag Extraction
// ============================================================================

describe('extractArguments - flags', () => {
  it('extracts flags from "--research --gaps-only"', () => {
    const result = extractArguments('--research --gaps-only');
    expect(result.flags).toEqual(['research', 'gaps-only']);
  });

  it('extracts flags from natural language with flag', () => {
    const result = extractArguments('plan phase 3 with --research flag');
    expect(result.flags).toEqual(['research']);
  });

  it('returns empty array when no flags present', () => {
    const result = extractArguments('plan phase 3');
    expect(result.flags).toEqual([]);
  });
});

// ============================================================================
// Version Extraction
// ============================================================================

describe('extractArguments - version', () => {
  it('extracts version from "set version v1.7"', () => {
    const result = extractArguments('set version v1.7');
    expect(result.version).toBe('1.7');
  });

  it('extracts semver version from "v1.7.2"', () => {
    const result = extractArguments('version v1.7.2');
    expect(result.version).toBe('1.7.2');
  });

  it('returns null when no version present', () => {
    const result = extractArguments('plan phase 3');
    expect(result.version).toBeNull();
  });
});

// ============================================================================
// Profile Extraction
// ============================================================================

describe('extractArguments - profile', () => {
  it('extracts profile from "set profile quality"', () => {
    const result = extractArguments('set profile quality');
    expect(result.profile).toBe('quality');
  });

  it('extracts "balanced" profile', () => {
    const result = extractArguments('use balanced profile');
    expect(result.profile).toBe('balanced');
  });

  it('extracts "budget" profile', () => {
    const result = extractArguments('switch to budget');
    expect(result.profile).toBe('budget');
  });

  it('returns null for unrecognized profile', () => {
    const result = extractArguments('plan phase 3');
    expect(result.profile).toBeNull();
  });
});

// ============================================================================
// Description Extraction
// ============================================================================

describe('extractArguments - description', () => {
  it('extracts quoted description with double quotes', () => {
    const result = extractArguments('/gsd:debug "login is broken"');
    expect(result.description).toBe('login is broken');
  });

  it('extracts quoted description with single quotes', () => {
    const result = extractArguments("/gsd:debug 'login is broken'");
    expect(result.description).toBe('login is broken');
  });

  it('returns null for input without quoted strings', () => {
    const result = extractArguments('plan phase 3');
    expect(result.description).toBeNull();
  });
});

// ============================================================================
// Combined Extraction
// ============================================================================

describe('extractArguments - combined', () => {
  it('extracts phase number and flags from "plan phase 3 --research"', () => {
    const result = extractArguments('plan phase 3 --research');
    expect(result.phaseNumber).toBe('3');
    expect(result.flags).toEqual(['research']);
  });

  it('raw field always contains original input', () => {
    const input = 'plan phase 3 --research';
    const result = extractArguments(input);
    expect(result.raw).toBe(input);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('extractArguments - edge cases', () => {
  it('returns all-null/empty for random text with no extractable args', () => {
    const result = extractArguments('just some random text');
    expect(result.phaseNumber).toBeNull();
    expect(result.flags).toEqual([]);
    expect(result.description).toBeNull();
    expect(result.version).toBeNull();
    expect(result.profile).toBeNull();
    expect(result.raw).toBe('just some random text');
  });

  it('returns all-null/empty for empty string', () => {
    const result = extractArguments('');
    expect(result.phaseNumber).toBeNull();
    expect(result.flags).toEqual([]);
    expect(result.description).toBeNull();
    expect(result.version).toBeNull();
    expect(result.profile).toBeNull();
    expect(result.raw).toBe('');
  });

  it('handles whitespace-only input', () => {
    const result = extractArguments('   ');
    expect(result.phaseNumber).toBeNull();
    expect(result.flags).toEqual([]);
  });

  it('handles input with only flags', () => {
    const result = extractArguments('--research --verbose');
    expect(result.phaseNumber).toBeNull();
    expect(result.flags).toEqual(['research', 'verbose']);
  });
});
