import { describe, it, expect } from 'vitest';
import { detectInterTeamCycles, validateInterTeamLinks } from './inter-team-bridge.js';

// ============================================================================
// detectInterTeamCycles
// ============================================================================

describe('detectInterTeamCycles', () => {
  it('returns no cycle for empty array', () => {
    const result = detectInterTeamCycles([]);
    expect(result.hasCycle).toBe(false);
  });

  it('returns no cycle for single team with no links', () => {
    const result = detectInterTeamCycles([{ name: 'alpha' }]);
    expect(result.hasCycle).toBe(false);
  });

  it('returns no cycle for A -> B (linear)', () => {
    const result = detectInterTeamCycles([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta' },
    ]);
    expect(result.hasCycle).toBe(false);
  });

  it('returns no cycle for A -> B -> C (linear chain)', () => {
    const result = detectInterTeamCycles([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', outputTo: [{ teamName: 'gamma' }] },
      { name: 'gamma' },
    ]);
    expect(result.hasCycle).toBe(false);
  });

  it('detects cycle in A -> B -> A', () => {
    const result = detectInterTeamCycles([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', outputTo: [{ teamName: 'alpha' }] },
    ]);
    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toBeDefined();
    expect(result.cycle).toContain('alpha');
    expect(result.cycle).toContain('beta');
  });

  it('detects cycle in A -> B -> C -> A', () => {
    const result = detectInterTeamCycles([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', outputTo: [{ teamName: 'gamma' }] },
      { name: 'gamma', outputTo: [{ teamName: 'alpha' }] },
    ]);
    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toBeDefined();
    expect(result.cycle!.length).toBe(3);
  });

  it('detects cycle in one component when multiple disconnected components exist', () => {
    const result = detectInterTeamCycles([
      // Component 1: no cycle
      { name: 'x', outputTo: [{ teamName: 'y' }] },
      { name: 'y' },
      // Component 2: has cycle
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', outputTo: [{ teamName: 'alpha' }] },
    ]);
    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toContain('alpha');
    expect(result.cycle).toContain('beta');
    // The non-cycle component should not be in cycle
    expect(result.cycle).not.toContain('x');
    expect(result.cycle).not.toContain('y');
  });

  it('builds edges from inputFrom declarations', () => {
    // B declares inputFrom A => edge A -> B
    // Then B -> A via outputTo => cycle
    const result = detectInterTeamCycles([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', inputFrom: [{ teamName: 'alpha' }], outputTo: [{ teamName: 'alpha' }] },
    ]);
    expect(result.hasCycle).toBe(true);
  });

  it('returns no cycle when inputFrom creates only one-way edge', () => {
    // B declares inputFrom A => edge A -> B (one-way, no cycle)
    const result = detectInterTeamCycles([
      { name: 'alpha' },
      { name: 'beta', inputFrom: [{ teamName: 'alpha' }] },
    ]);
    expect(result.hasCycle).toBe(false);
  });
});

// ============================================================================
// validateInterTeamLinks
// ============================================================================

describe('validateInterTeamLinks', () => {
  it('returns no errors for valid links with all referenced teams present', () => {
    const result = validateInterTeamLinks([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', inputFrom: [{ teamName: 'alpha' }] },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('returns error when outputTo references non-existent team', () => {
    const result = validateInterTeamLinks([
      { name: 'alpha', outputTo: [{ teamName: 'missing' }] },
    ]);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('outputTo');
    expect(result.errors[0]).toContain('missing');
    expect(result.errors[0]).toContain('does not exist');
  });

  it('returns error when inputFrom references non-existent team', () => {
    const result = validateInterTeamLinks([
      { name: 'alpha', inputFrom: [{ teamName: 'missing' }] },
    ]);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('inputFrom');
    expect(result.errors[0]).toContain('missing');
    expect(result.errors[0]).toContain('does not exist');
  });

  it('returns error for circular dependency', () => {
    const result = validateInterTeamLinks([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', outputTo: [{ teamName: 'alpha' }] },
    ]);
    expect(result.errors.some((e) => e.includes('circular dependency'))).toBe(true);
    expect(result.errors.some((e) => e.includes('alpha'))).toBe(true);
  });

  it('returns warning when outputTo lacks matching inputFrom', () => {
    const result = validateInterTeamLinks([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta' }, // no inputFrom declared
    ]);
    expect(result.errors).toEqual([]); // not an error
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain('outputs to');
    expect(result.warnings[0]).toContain('does not declare inputFrom');
  });

  it('returns no warnings when outputTo has matching inputFrom', () => {
    const result = validateInterTeamLinks([
      { name: 'alpha', outputTo: [{ teamName: 'beta' }] },
      { name: 'beta', inputFrom: [{ teamName: 'alpha' }] },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('returns no errors/warnings for teams with no links', () => {
    const result = validateInterTeamLinks([
      { name: 'alpha' },
      { name: 'beta' },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('handles empty array', () => {
    const result = validateInterTeamLinks([]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
