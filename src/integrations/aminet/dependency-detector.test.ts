/**
 * Tests for dependency-detector.ts
 *
 * Covers classifyDependency (5 dependency types), checkDependencySatisfied
 * (mirror state cross-reference), and detectDependencies (end-to-end).
 */

import { describe, expect, it } from 'vitest';

import { classifyDependency, checkDependencySatisfied, detectDependencies } from './dependency-detector.js';
import type { MirrorState } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMirrorState(
  entries: Record<string, { status: string; sizeKb: number }>,
): MirrorState {
  const built: MirrorState['entries'] = {};
  for (const [fullPath, { status, sizeKb }] of Object.entries(entries)) {
    built[fullPath] = {
      fullPath,
      status: status as MirrorState['entries'][string]['status'],
      sizeKb,
      sha256: null,
      localPath: null,
      downloadedAt: null,
      lastChecked: null,
    };
  }
  return { entries: built, lastUpdated: new Date().toISOString(), version: 1 };
}

// ---------------------------------------------------------------------------
// classifyDependency
// ---------------------------------------------------------------------------

describe('classifyDependency', () => {
  it('classifies full Aminet path as package', () => {
    const result = classifyDependency('util/libs/mui38usr.lha');
    expect(result.type).toBe('package');
    expect(result.fullPath).toBe('util/libs/mui38usr.lha');
  });

  it('classifies another full Aminet path as package', () => {
    const result = classifyDependency('mus/edit/ProTracker36.lha');
    expect(result.type).toBe('package');
    expect(result.fullPath).toBe('mus/edit/ProTracker36.lha');
  });

  it('classifies "OS 3.0+" as os_version', () => {
    const result = classifyDependency('OS 3.0+');
    expect(result.type).toBe('os_version');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "AmigaOS 2.0" as os_version', () => {
    const result = classifyDependency('AmigaOS 2.0');
    expect(result.type).toBe('os_version');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "68020+" as hardware', () => {
    const result = classifyDependency('68020+');
    expect(result.type).toBe('hardware');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "68030" as hardware', () => {
    const result = classifyDependency('68030');
    expect(result.type).toBe('hardware');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "AGA" as hardware', () => {
    const result = classifyDependency('AGA');
    expect(result.type).toBe('hardware');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "RTG" as hardware', () => {
    const result = classifyDependency('RTG');
    expect(result.type).toBe('hardware');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "EGS" as hardware', () => {
    const result = classifyDependency('EGS');
    expect(result.type).toBe('hardware');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "muimaster.library" as library', () => {
    const result = classifyDependency('muimaster.library');
    expect(result.type).toBe('library');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "reqtools.library" as library', () => {
    const result = classifyDependency('reqtools.library');
    expect(result.type).toBe('library');
    expect(result.fullPath).toBeNull();
  });

  it('classifies "some random text" as unknown', () => {
    const result = classifyDependency('some random text');
    expect(result.type).toBe('unknown');
    expect(result.fullPath).toBeNull();
  });

  it('classifies empty string as unknown', () => {
    const result = classifyDependency('');
    expect(result.type).toBe('unknown');
    expect(result.fullPath).toBeNull();
  });

  it('trims whitespace before classification', () => {
    const result = classifyDependency('  OS 3.0+  ');
    expect(result.type).toBe('os_version');
    expect(result.fullPath).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// checkDependencySatisfied
// ---------------------------------------------------------------------------

describe('checkDependencySatisfied', () => {
  const state = makeMirrorState({
    'util/libs/mui38usr.lha': { status: 'installed', sizeKb: 500 },
    'mus/edit/ProTracker36.lha': { status: 'clean', sizeKb: 200 },
  });

  it('returns true for installed package dependency', () => {
    const dep = { type: 'package' as const, fullPath: 'util/libs/mui38usr.lha' };
    expect(checkDependencySatisfied(dep, state)).toBe(true);
  });

  it('returns false for non-installed package dependency (status clean)', () => {
    const dep = { type: 'package' as const, fullPath: 'mus/edit/ProTracker36.lha' };
    expect(checkDependencySatisfied(dep, state)).toBe(false);
  });

  it('returns false for package not in mirror state', () => {
    const dep = { type: 'package' as const, fullPath: 'dev/misc/SomeLib.lha' };
    expect(checkDependencySatisfied(dep, state)).toBe(false);
  });

  it('returns true for os_version (informational)', () => {
    const dep = { type: 'os_version' as const, fullPath: null };
    expect(checkDependencySatisfied(dep, state)).toBe(true);
  });

  it('returns true for hardware (informational)', () => {
    const dep = { type: 'hardware' as const, fullPath: null };
    expect(checkDependencySatisfied(dep, state)).toBe(true);
  });

  it('returns true for library (informational)', () => {
    const dep = { type: 'library' as const, fullPath: null };
    expect(checkDependencySatisfied(dep, state)).toBe(true);
  });

  it('returns true for unknown (informational)', () => {
    const dep = { type: 'unknown' as const, fullPath: null };
    expect(checkDependencySatisfied(dep, state)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// detectDependencies
// ---------------------------------------------------------------------------

describe('detectDependencies', () => {
  it('classifies and checks satisfaction for mixed requires', () => {
    const state = makeMirrorState({
      'util/libs/mui38usr.lha': { status: 'installed', sizeKb: 500 },
    });

    const result = detectDependencies(
      ['util/libs/mui38usr.lha', 'OS 3.0+', '68020+'],
      state,
    );

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      raw: 'util/libs/mui38usr.lha',
      type: 'package',
      fullPath: 'util/libs/mui38usr.lha',
      satisfied: true,
    });

    expect(result[1]).toEqual({
      raw: 'OS 3.0+',
      type: 'os_version',
      fullPath: null,
      satisfied: true,
    });

    expect(result[2]).toEqual({
      raw: '68020+',
      type: 'hardware',
      fullPath: null,
      satisfied: true,
    });
  });

  it('marks uninstalled package as unsatisfied', () => {
    const state = makeMirrorState({
      'util/libs/mui38usr.lha': { status: 'installed', sizeKb: 500 },
    });

    const result = detectDependencies(
      ['util/libs/mui38usr.lha', 'dev/misc/SomeLib.lha'],
      state,
    );

    expect(result).toHaveLength(2);
    expect(result[0].satisfied).toBe(true);
    expect(result[1].satisfied).toBe(false);
    expect(result[1].type).toBe('package');
    expect(result[1].fullPath).toBe('dev/misc/SomeLib.lha');
  });

  it('returns empty array for empty requires', () => {
    const state = makeMirrorState({});
    const result = detectDependencies([], state);
    expect(result).toEqual([]);
  });

  it('includes all Dependency fields on every result', () => {
    const state = makeMirrorState({});
    const result = detectDependencies(['muimaster.library'], state);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('raw');
    expect(result[0]).toHaveProperty('type');
    expect(result[0]).toHaveProperty('fullPath');
    expect(result[0]).toHaveProperty('satisfied');
  });
});
