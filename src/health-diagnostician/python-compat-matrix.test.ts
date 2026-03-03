import { describe, it, expect } from 'vitest';
import { buildCompatMatrix, PythonCompatMatrix } from './python-compat-matrix.js';
import type { HealthSignal, DependencyRecord, RegistryHealth } from '../dependency-auditor/types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePypiSignal(name: string, pythonRequires: string | null): HealthSignal {
  const dep: DependencyRecord = {
    name,
    version: '1.0.0',
    ecosystem: 'pypi',
    sourceManifest: '/project/requirements.txt',
  };
  const registryHealth: RegistryHealth = {
    ecosystem: 'pypi',
    name,
    latestVersion: '1.0.0',
    lastPublishDate: '2024-01-01T00:00:00.000Z',
    isArchived: false,
    isDeprecated: false,
    maintainerCount: null,
    _meta: pythonRequires ? { pythonRequires } : undefined,
  } as RegistryHealth & { _meta?: Record<string, unknown> };
  return { dependency: dep, registryHealth, vulnerabilities: [] };
}

function makeNpmSignal(name: string): HealthSignal {
  const dep: DependencyRecord = {
    name,
    version: '1.0.0',
    ecosystem: 'npm',
    sourceManifest: '/project/package.json',
  };
  const registryHealth: RegistryHealth = {
    ecosystem: 'npm',
    name,
    latestVersion: '1.0.0',
    lastPublishDate: '2024-01-01T00:00:00.000Z',
    isArchived: false,
    isDeprecated: false,
    maintainerCount: 2,
  };
  return { dependency: dep, registryHealth, vulnerabilities: [] };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildCompatMatrix', () => {
  it('returns all candidate versions when there are no pypi deps', () => {
    const result = buildCompatMatrix([makeNpmSignal('lodash')]);
    expect(result.hasConflict).toBe(false);
    expect(result.compatibleVersions.length).toBeGreaterThan(0);
    expect(result.constraintsByDep).toEqual({});
  });

  it('returns all candidate versions when pypi dep has no python_requires', () => {
    const result = buildCompatMatrix([makePypiSignal('requests', null)]);
    expect(result.hasConflict).toBe(false);
    expect(result.compatibleVersions.length).toBeGreaterThan(0);
  });

  it('single dep >=3.9 yields 3.9, 3.10, 3.11, 3.12, 3.13', () => {
    const result = buildCompatMatrix([makePypiSignal('flask', '>=3.9')]);
    expect(result.compatibleVersions).toContain('3.9');
    expect(result.compatibleVersions).toContain('3.10');
    expect(result.compatibleVersions).toContain('3.11');
    expect(result.compatibleVersions).toContain('3.12');
    expect(result.compatibleVersions).toContain('3.13');
    expect(result.compatibleVersions).not.toContain('3.8');
    expect(result.hasConflict).toBe(false);
  });

  it('two deps >=3.9 and <3.12 yield 3.9, 3.10, 3.11', () => {
    const result = buildCompatMatrix([
      makePypiSignal('flask', '>=3.9'),
      makePypiSignal('django', '<3.12'),
    ]);
    expect(result.compatibleVersions).toEqual(['3.9', '3.10', '3.11']);
    expect(result.hasConflict).toBe(false);
  });

  it('detects conflict: dep1 >=3.11 and dep2 <3.10', () => {
    const result = buildCompatMatrix([
      makePypiSignal('lib-a', '>=3.11'),
      makePypiSignal('lib-b', '<3.10'),
    ]);
    expect(result.hasConflict).toBe(true);
    expect(result.compatibleVersions).toHaveLength(0);
    expect(result.conflictExplanation).toBeTruthy();
  });

  it('~=3.9 is compatible release: >=3.9,<4 → 3.9 through 3.13', () => {
    const result = buildCompatMatrix([makePypiSignal('mylib', '~=3.9')]);
    expect(result.compatibleVersions).toContain('3.9');
    expect(result.compatibleVersions).toContain('3.13');
    expect(result.compatibleVersions).not.toContain('3.8');
    expect(result.hasConflict).toBe(false);
  });

  it('compound constraint >=3.9,<4 → same as ~=3.9', () => {
    const result = buildCompatMatrix([makePypiSignal('mylib', '>=3.9,<4')]);
    expect(result.compatibleVersions).toContain('3.9');
    expect(result.compatibleVersions).toContain('3.13');
    expect(result.compatibleVersions).not.toContain('3.8');
  });

  it('constraintsByDep is populated with python_requires values', () => {
    const result = buildCompatMatrix([
      makePypiSignal('flask', '>=3.9'),
      makePypiSignal('requests', '>=3.8'),
    ]);
    expect(result.constraintsByDep['flask']).toBe('>=3.9');
    expect(result.constraintsByDep['requests']).toBe('>=3.8');
  });

  it('empty signal list returns all versions compatible', () => {
    const result = buildCompatMatrix([]);
    expect(result.hasConflict).toBe(false);
    expect(result.compatibleVersions.length).toBeGreaterThan(0);
  });
});

describe('PythonCompatMatrix class', () => {
  it('build() returns same result as buildCompatMatrix()', () => {
    const signals = [makePypiSignal('flask', '>=3.9')];
    const matrix = new PythonCompatMatrix();
    expect(matrix.build(signals)).toEqual(buildCompatMatrix(signals));
  });
});
