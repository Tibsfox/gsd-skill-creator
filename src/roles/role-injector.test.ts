/**
 * Tests for role constraint injector.
 *
 * Covers:
 * - formatConstraintsSection with empty array returns empty string
 * - formatConstraintsSection with single constraint returns numbered markdown
 * - formatConstraintsSection with multiple constraints produces numbered list
 * - injectConstraints with empty constraints returns body unchanged
 * - injectConstraints prepends constraints section before body
 * - injectConstraints works with empty body
 */

import { describe, it, expect } from 'vitest';
import { formatConstraintsSection, injectConstraints } from './role-injector.js';

// ============================================================================
// formatConstraintsSection
// ============================================================================

describe('formatConstraintsSection', () => {
  it('returns empty string for empty constraints array', () => {
    expect(formatConstraintsSection([])).toBe('');
  });

  it('returns markdown with numbered list for single constraint', () => {
    const result = formatConstraintsSection(['Never modify files']);
    expect(result).toBe(
      '## Behavioral Constraints\n\nYou MUST adhere to the following constraints at all times:\n\n1. Never modify files\n',
    );
  });

  it('produces numbered list 1-3 for three constraints', () => {
    const result = formatConstraintsSection([
      'Never modify files',
      'Read-only access',
      'Report all findings',
    ]);
    expect(result).toContain('1. Never modify files');
    expect(result).toContain('2. Read-only access');
    expect(result).toContain('3. Report all findings');
    expect(result).toMatch(/^## Behavioral Constraints/);
  });
});

// ============================================================================
// injectConstraints
// ============================================================================

describe('injectConstraints', () => {
  it('returns body unchanged when constraints are empty', () => {
    expect(injectConstraints('existing body', [])).toBe('existing body');
  });

  it('prepends constraints section before existing body', () => {
    const result = injectConstraints('existing body', ['Read only']);
    expect(result).toMatch(/^## Behavioral Constraints/);
    expect(result).toContain('1. Read only');
    expect(result).toMatch(/existing body$/);
  });

  it('works with empty body (just constraints section)', () => {
    const result = injectConstraints('', ['Read only']);
    expect(result).toMatch(/^## Behavioral Constraints/);
    expect(result).toContain('1. Read only');
  });

  it('includes newline separator between constraints and body', () => {
    const result = injectConstraints('body text', ['Constraint A']);
    const section = formatConstraintsSection(['Constraint A']);
    expect(result).toBe(section + '\n' + 'body text');
  });
});
