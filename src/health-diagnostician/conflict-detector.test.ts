import { describe, it, expect } from 'vitest';
import { detectConflicts, ConflictDetector } from './conflict-detector.js';
import type { DependencyRecord } from '../dependency-auditor/types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDep(
  name: string,
  version: string,
  ecosystem: DependencyRecord['ecosystem'] = 'npm',
): DependencyRecord {
  return {
    name,
    version,
    ecosystem,
    sourceManifest: `/project/package.json`,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('detectConflicts', () => {
  it('returns empty array for empty dep list', () => {
    expect(detectConflicts([])).toHaveLength(0);
  });

  it('returns empty array when all deps are unique', () => {
    const deps = [
      makeDep('express', '4.18.0'),
      makeDep('lodash', '4.17.21'),
      makeDep('react', '18.2.0'),
    ];
    expect(detectConflicts(deps)).toHaveLength(0);
  });

  it('returns empty array for same version declared twice (no conflict)', () => {
    const deps = [
      makeDep('lodash', '4.17.21'),
      makeDep('lodash', '4.17.21'),
    ];
    expect(detectConflicts(deps)).toHaveLength(0);
  });

  it('detects conflict: lodash ^3.0.0 vs ^4.0.0 (^3=>=3,<4 vs ^4=>=4,<5)', () => {
    const deps = [
      makeDep('lodash', '^3.0.0'),
      makeDep('lodash', '^4.0.0'),
    ];
    const conflicts = detectConflicts(deps);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].packageA).toBe('lodash');
    expect(conflicts[0].packageB).toBe('lodash');
    expect(conflicts[0].ecosystem).toBe('npm');
    expect(conflicts[0].explanation.length).toBeGreaterThan(10);
  });

  it('no conflict: lodash ^3.0.0 vs ^3.5.0 (both in 3.x range)', () => {
    const deps = [
      makeDep('lodash', '^3.0.0'),
      makeDep('lodash', '^3.5.0'),
    ];
    expect(detectConflicts(deps)).toHaveLength(0);
  });

  it('no conflict: requests >=2.0.0 vs >=2.25.0 (2.25+ satisfies both)', () => {
    const deps = [
      makeDep('requests', '>=2.0.0', 'pypi'),
      makeDep('requests', '>=2.25.0', 'pypi'),
    ];
    expect(detectConflicts(deps)).toHaveLength(0);
  });

  it('detects conflict: requests >=2.0.0,<2.20.0 vs >=2.25.0 (no overlap)', () => {
    const deps = [
      makeDep('requests', '>=2.0.0,<2.20.0', 'pypi'),
      makeDep('requests', '>=2.25.0', 'pypi'),
    ];
    const conflicts = detectConflicts(deps);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].ecosystem).toBe('pypi');
  });

  it('does NOT flag conflict across different ecosystems', () => {
    // npm lodash and pypi lodash are different packages
    const deps = [
      makeDep('lodash', '^3.0.0', 'npm'),
      makeDep('lodash', '^4.0.0', 'pypi'),
    ];
    expect(detectConflicts(deps)).toHaveLength(0);
  });

  it('exact version conflict: 1.0.0 vs 2.0.0', () => {
    const deps = [
      makeDep('serde', '1.0.0', 'cargo'),
      makeDep('serde', '2.0.0', 'cargo'),
    ];
    const conflicts = detectConflicts(deps);
    expect(conflicts).toHaveLength(1);
  });

  it('exact same version declared twice is not a conflict', () => {
    const deps = [
      makeDep('serde', '1.0.0', 'cargo'),
      makeDep('serde', '1.0.0', 'cargo'),
    ];
    expect(detectConflicts(deps)).toHaveLength(0);
  });

  it('ConflictFinding rangeA and rangeB contain the version strings', () => {
    const deps = [
      makeDep('lodash', '^3.0.0'),
      makeDep('lodash', '^4.0.0'),
    ];
    const [conflict] = detectConflicts(deps);
    expect(conflict.rangeA).toBe('^3.0.0');
    expect(conflict.rangeB).toBe('^4.0.0');
  });
});

describe('ConflictDetector class', () => {
  it('detectConflicts() returns same result as standalone function', () => {
    const deps = [makeDep('lodash', '^3.0.0'), makeDep('lodash', '^4.0.0')];
    const detector = new ConflictDetector();
    expect(detector.detectConflicts(deps)).toEqual(detectConflicts(deps));
  });
});
