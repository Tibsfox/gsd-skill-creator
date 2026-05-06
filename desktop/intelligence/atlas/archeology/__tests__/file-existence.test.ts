/**
 * file-existence.ts — unit tests.
 * Tests cover: A/D/A round-trip, rename chain, multi-file mission,
 * asOf earliest, asOf latest, asOf unknown mission id.
 */

import { describe, it, expect } from 'vitest';
import { buildFileExistence } from '../file-existence.js';
import type { FileExistenceQuery } from '../file-existence.js';
import type { AtlasFilesChanged } from '../../../../../src/intelligence/types.js';

function row(
  missionId: string,
  filePath: string,
  changeKind: 'A' | 'M' | 'D' | 'R',
  renameFrom: string | null = null,
): AtlasFilesChanged {
  return {
    id: `${missionId}:${filePath}` as AtlasFilesChanged['id'],
    mission_id: missionId,
    commit_sha: 'abc',
    file_path: filePath,
    change_kind: changeKind,
    rename_from: renameFrom,
    added_lines: 10,
    removed_lines: 0,
  };
}

describe('buildFileExistence', () => {
  it('T1 — A then D then A round-trip: file absent after D, present after re-add', () => {
    const missions = ['m1', 'm2', 'm3'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'src/foo.ts', 'A')]],
      ['m2', [row('m2', 'src/foo.ts', 'D')]],
      ['m3', [row('m3', 'src/foo.ts', 'A')]],
    ]);
    const state = buildFileExistence({ filesChangedByMission, missionsChronological: missions });

    expect(state.filesAt('m1').has('src/foo.ts')).toBe(true);
    expect(state.filesAt('m2').has('src/foo.ts')).toBe(false);
    expect(state.filesAt('m3').has('src/foo.ts')).toBe(true);
  });

  it('T2 — rename chain: old path gone, new path present, subsequent modify keeps new path', () => {
    const missions = ['m1', 'm2', 'm3'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'src/old.ts', 'A')]],
      ['m2', [row('m2', 'src/new.ts', 'R', 'src/old.ts')]],
      ['m3', [row('m3', 'src/new.ts', 'M')]],
    ]);
    const state = buildFileExistence({ filesChangedByMission, missionsChronological: missions });

    const atM2 = state.filesAt('m2');
    expect(atM2.has('src/old.ts')).toBe(false);
    expect(atM2.has('src/new.ts')).toBe(true);

    const atM3 = state.filesAt('m3');
    expect(atM3.has('src/new.ts')).toBe(true);
  });

  it('T3 — multi-file mission: all added files appear, D removes only targeted file', () => {
    const missions = ['m1', 'm2'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'a.ts', 'A'), row('m1', 'b.ts', 'A'), row('m1', 'c.ts', 'A')]],
      ['m2', [row('m2', 'b.ts', 'D')]],
    ]);
    const state = buildFileExistence({ filesChangedByMission, missionsChronological: missions });

    const atM2 = state.filesAt('m2');
    expect(atM2.has('a.ts')).toBe(true);
    expect(atM2.has('b.ts')).toBe(false);
    expect(atM2.has('c.ts')).toBe(true);
  });

  it('T4 — asOf earliest mission returns only files added in that mission', () => {
    const missions = ['m1', 'm2', 'm3'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'boot.ts', 'A')]],
      ['m2', [row('m2', 'extra.ts', 'A')]],
      ['m3', [row('m3', 'more.ts', 'A')]],
    ]);
    const state = buildFileExistence({ filesChangedByMission, missionsChronological: missions });

    const atFirst = state.filesAt('m1');
    expect(atFirst.has('boot.ts')).toBe(true);
    expect(atFirst.has('extra.ts')).toBe(false);
    expect(atFirst.has('more.ts')).toBe(false);
    expect(atFirst.size).toBe(1);
  });

  it('T5 — asOf latest mission returns cumulative file set', () => {
    const missions = ['m1', 'm2', 'm3'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'a.ts', 'A')]],
      ['m2', [row('m2', 'b.ts', 'A')]],
      ['m3', [row('m3', 'c.ts', 'A')]],
    ]);
    const state = buildFileExistence({ filesChangedByMission, missionsChronological: missions });

    const atLast = state.filesAt('m3');
    expect(atLast.has('a.ts')).toBe(true);
    expect(atLast.has('b.ts')).toBe(true);
    expect(atLast.has('c.ts')).toBe(true);
  });

  it('T6 — asOf unknown mission returns empty set', () => {
    const missions = ['m1', 'm2'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'a.ts', 'A')]],
    ]);
    const state = buildFileExistence({ filesChangedByMission, missionsChronological: missions });

    expect(state.filesAt('not-a-mission').size).toBe(0);
  });

  it('T7 — M (modify) rows are no-ops for existence tracking', () => {
    const missions = ['m1', 'm2'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'x.ts', 'A')]],
      ['m2', [row('m2', 'x.ts', 'M')]],
    ]);
    const state = buildFileExistence({ filesChangedByMission, missionsChronological: missions });

    expect(state.filesAt('m2').has('x.ts')).toBe(true);
  });

  it('T8 — snapshot-every-K: results remain correct across snapshot boundary (K=2)', () => {
    const missions = ['m1', 'm2', 'm3', 'm4', 'm5'];
    const filesChangedByMission = new Map<string, AtlasFilesChanged[]>([
      ['m1', [row('m1', 'a.ts', 'A')]],
      ['m2', [row('m2', 'b.ts', 'A')]],
      ['m3', [row('m3', 'c.ts', 'A')]],
      ['m4', [row('m4', 'a.ts', 'D')]],
      ['m5', [row('m5', 'd.ts', 'A')]],
    ]);
    const state = buildFileExistence(
      { filesChangedByMission, missionsChronological: missions },
      2,
    );

    const atM4 = state.filesAt('m4');
    expect(atM4.has('a.ts')).toBe(false);
    expect(atM4.has('b.ts')).toBe(true);
    expect(atM4.has('c.ts')).toBe(true);

    const atM5 = state.filesAt('m5');
    expect(atM5.has('d.ts')).toBe(true);
    expect(atM5.has('a.ts')).toBe(false);
  });
});
