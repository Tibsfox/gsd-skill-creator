/**
 * Tests for sync detection comparing local mirror state against INDEX.
 *
 * Validates detectChanges identifies size changes, new packages,
 * removed packages, and correctly handles edge cases like empty
 * states, empty INDEX, and not-mirrored entries.
 */

import { describe, it, expect } from 'vitest';
import type { MirrorState, MirrorEntry, AminetPackage } from './types.js';
import { MirrorEntrySchema } from './types.js';
import {
  detectChanges,
  detectNewPackages,
  detectRemovedPackages,
} from './sync-detector.js';
import type { SyncReport } from './sync-detector.js';

// ============================================================================
// Helpers
// ============================================================================

/** Build a MirrorEntry for testing. */
function entry(overrides: Partial<MirrorEntry> & { fullPath: string }): MirrorEntry {
  return MirrorEntrySchema.parse({
    status: 'mirrored',
    sizeKb: 100,
    sha256: null,
    localPath: null,
    downloadedAt: null,
    lastChecked: null,
    ...overrides,
  });
}

/** Build a MirrorState from entries. */
function state(entries: Record<string, MirrorEntry>): MirrorState {
  return {
    entries,
    lastUpdated: '2026-02-19T12:00:00Z',
    version: 1,
  };
}

/** Build an AminetPackage for testing. */
function pkg(fullPath: string, sizeKb: number, ageDays = 30): AminetPackage {
  const parts = fullPath.split('/');
  const filename = parts.pop()!;
  const directory = parts.join('/');
  const [category, subcategory] = directory.split('/');
  return {
    filename,
    directory,
    category,
    subcategory: subcategory ?? '',
    sizeKb,
    ageDays,
    description: `Test package ${filename}`,
    fullPath,
  };
}

// ============================================================================
// detectChanges
// ============================================================================

describe('detectChanges', () => {
  it('reports no changes when mirror state matches INDEX', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
      'dev/c/SAS_C.lha': entry({ fullPath: 'dev/c/SAS_C.lha', sizeKb: 500 }),
    });
    const index = [
      pkg('mus/edit/ProTracker36.lha', 142),
      pkg('dev/c/SAS_C.lha', 500),
    ];

    const report = detectChanges(ms, index);

    expect(report.changed).toEqual([]);
    expect(report.newPackages).toEqual([]);
    expect(report.removed).toEqual([]);
    expect(report.unchanged).toBe(2);
    expect(report.totalLocal).toBe(2);
    expect(report.totalRemote).toBe(2);
  });

  it('detects size change for mirrored package', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 12 }),
    });
    const index = [pkg('mus/edit/ProTracker36.lha', 15)];

    const report = detectChanges(ms, index);

    expect(report.changed).toHaveLength(1);
    expect(report.changed[0].fullPath).toBe('mus/edit/ProTracker36.lha');
    expect(report.changed[0].reason).toContain('size');
    expect(report.changed[0].reason).toContain('12');
    expect(report.changed[0].reason).toContain('15');
    expect(report.unchanged).toBe(0);
  });

  it('detects age change when size remains the same but ageDays resets', () => {
    // Package was re-uploaded with same size, ageDays reset from 365 to 5
    // Since plan says size-only is simplest/most reliable, this should NOT
    // flag as changed when sizes match. Age comparison is unreliable.
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
    });
    const index = [pkg('mus/edit/ProTracker36.lha', 142, 5)];

    const report = detectChanges(ms, index);

    // Same size = unchanged (age alone is not a reliable indicator)
    expect(report.changed).toEqual([]);
    expect(report.unchanged).toBe(1);
  });

  it('identifies new packages in INDEX but not in mirror state', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
    });
    const index = [
      pkg('mus/edit/ProTracker36.lha', 142),
      pkg('dev/c/NewTool.lha', 200),
    ];

    const report = detectChanges(ms, index);

    expect(report.newPackages).toEqual(['dev/c/NewTool.lha']);
    expect(report.totalRemote).toBe(2);
  });

  it('identifies removed packages in mirror state but not in INDEX', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
      'dev/c/OldTool.lha': entry({ fullPath: 'dev/c/OldTool.lha', sizeKb: 300 }),
    });
    const index = [pkg('mus/edit/ProTracker36.lha', 142)];

    const report = detectChanges(ms, index);

    expect(report.removed).toEqual(['dev/c/OldTool.lha']);
    expect(report.totalLocal).toBe(2);
    expect(report.totalRemote).toBe(1);
  });

  it('handles mixed scenario: unchanged, changed, new, removed', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
      'dev/c/SAS_C.lha': entry({ fullPath: 'dev/c/SAS_C.lha', sizeKb: 500 }),
      'gfx/edit/DPaint.lha': entry({ fullPath: 'gfx/edit/DPaint.lha', sizeKb: 800 }),
    });
    const index = [
      pkg('mus/edit/ProTracker36.lha', 142),    // unchanged
      pkg('dev/c/SAS_C.lha', 550),              // changed (size 500 -> 550)
      pkg('util/cli/NewShell.lha', 50),          // new
    ];

    const report = detectChanges(ms, index);

    expect(report.unchanged).toBe(1);
    expect(report.changed).toHaveLength(1);
    expect(report.changed[0].fullPath).toBe('dev/c/SAS_C.lha');
    expect(report.newPackages).toEqual(['util/cli/NewShell.lha']);
    expect(report.removed).toEqual(['gfx/edit/DPaint.lha']);
    expect(report.totalLocal).toBe(3);
    expect(report.totalRemote).toBe(3);
  });

  it('treats empty mirror state as all packages being new', () => {
    const ms = state({});
    const index = [
      pkg('mus/edit/ProTracker36.lha', 142),
      pkg('dev/c/SAS_C.lha', 500),
    ];

    const report = detectChanges(ms, index);

    expect(report.newPackages).toHaveLength(2);
    expect(report.changed).toEqual([]);
    expect(report.removed).toEqual([]);
    expect(report.unchanged).toBe(0);
    expect(report.totalLocal).toBe(0);
    expect(report.totalRemote).toBe(2);
  });

  it('treats empty INDEX as all mirrored packages being removed', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
      'dev/c/SAS_C.lha': entry({ fullPath: 'dev/c/SAS_C.lha', sizeKb: 500 }),
    });

    const report = detectChanges(ms, []);

    expect(report.removed).toHaveLength(2);
    expect(report.newPackages).toEqual([]);
    expect(report.changed).toEqual([]);
    expect(report.unchanged).toBe(0);
    expect(report.totalLocal).toBe(2);
    expect(report.totalRemote).toBe(0);
  });

  it('returns all zeros/empty when both mirror state and INDEX are empty', () => {
    const ms = state({});

    const report = detectChanges(ms, []);

    expect(report.changed).toEqual([]);
    expect(report.newPackages).toEqual([]);
    expect(report.removed).toEqual([]);
    expect(report.unchanged).toBe(0);
    expect(report.totalLocal).toBe(0);
    expect(report.totalRemote).toBe(0);
  });

  it('ignores not-mirrored entries for change detection', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({
        fullPath: 'mus/edit/ProTracker36.lha',
        sizeKb: 142,
        status: 'not-mirrored',
      }),
      'dev/c/SAS_C.lha': entry({
        fullPath: 'dev/c/SAS_C.lha',
        sizeKb: 500,
        status: 'mirrored',
      }),
    });
    const index = [
      pkg('mus/edit/ProTracker36.lha', 200),  // size differs but entry is not-mirrored
      pkg('dev/c/SAS_C.lha', 550),            // size differs and entry IS mirrored
    ];

    const report = detectChanges(ms, index);

    // not-mirrored entry should NOT appear in changed (not yet downloaded)
    expect(report.changed).toHaveLength(1);
    expect(report.changed[0].fullPath).toBe('dev/c/SAS_C.lha');
    // not-mirrored entry exists in state AND INDEX, so it's neither new nor removed
    // It's effectively "known but not downloaded" -- counted as unchanged for totals
    expect(report.unchanged).toBe(0);
  });

  it('counts entries with statuses beyond mirrored for change detection', () => {
    const ms = state({
      'a/b/clean.lha': entry({ fullPath: 'a/b/clean.lha', sizeKb: 100, status: 'clean' }),
      'a/b/scanned.lha': entry({ fullPath: 'a/b/scanned.lha', sizeKb: 200, status: 'scan-pending' }),
      'a/b/installed.lha': entry({ fullPath: 'a/b/installed.lha', sizeKb: 300, status: 'installed' }),
    });
    const index = [
      pkg('a/b/clean.lha', 150),     // changed
      pkg('a/b/scanned.lha', 200),   // unchanged
      pkg('a/b/installed.lha', 300), // unchanged
    ];

    const report = detectChanges(ms, index);

    expect(report.changed).toHaveLength(1);
    expect(report.changed[0].fullPath).toBe('a/b/clean.lha');
    expect(report.unchanged).toBe(2);
  });
});

// ============================================================================
// detectNewPackages (convenience wrapper)
// ============================================================================

describe('detectNewPackages', () => {
  it('returns only new package fullPaths', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
    });
    const index = [
      pkg('mus/edit/ProTracker36.lha', 142),
      pkg('dev/c/NewTool.lha', 200),
    ];

    const result = detectNewPackages(ms, index);

    expect(result).toEqual(['dev/c/NewTool.lha']);
  });
});

// ============================================================================
// detectRemovedPackages (convenience wrapper)
// ============================================================================

describe('detectRemovedPackages', () => {
  it('returns only removed package fullPaths', () => {
    const ms = state({
      'mus/edit/ProTracker36.lha': entry({ fullPath: 'mus/edit/ProTracker36.lha', sizeKb: 142 }),
      'dev/c/OldTool.lha': entry({ fullPath: 'dev/c/OldTool.lha', sizeKb: 300 }),
    });
    const index = [pkg('mus/edit/ProTracker36.lha', 142)];

    const result = detectRemovedPackages(ms, index);

    expect(result).toEqual(['dev/c/OldTool.lha']);
  });
});
