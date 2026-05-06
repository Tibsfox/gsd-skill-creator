/**
 * File-existence solver for the time-lapse playback feature.
 *
 * Walks missions chronologically and applies each mission's files_changed rows
 * to maintain a running Set<string> of existing file paths.  Snapshots are
 * stored every K missions so point-in-time queries replay from the nearest
 * checkpoint rather than replaying from the beginning.
 *
 * Memory bound: O(M/K × F) where M = mission count, F = max distinct file
 * count at any snapshot.  K=10 default gives ~10% snapshot overhead.
 *
 * Change-kind semantics:
 *   'A' — add file_path
 *   'D' — remove file_path
 *   'M' — no-op (file already exists)
 *   'R' — remove rename_from, add file_path
 *
 * @module desktop/intelligence/atlas/archeology/file-existence
 */

import type { AtlasFilesChanged } from '../../../../src/intelligence/types.js';

export interface FileExistenceQuery {
  filesChangedByMission: Map<string, AtlasFilesChanged[]>;
  missionsChronological: string[];
}

export interface FileExistenceState {
  filesAt(asOfMissionId: string): Set<string>;
}

const DEFAULT_SNAPSHOT_INTERVAL = 10;

export function buildFileExistence(
  query: FileExistenceQuery,
  snapshotInterval = DEFAULT_SNAPSHOT_INTERVAL,
): FileExistenceState {
  const { missionsChronological, filesChangedByMission } = query;

  const snapshots = new Map<string, Set<string>>();
  const snapshotOrder: string[] = [];

  let current = new Set<string>();

  for (let i = 0; i < missionsChronological.length; i++) {
    const missionId = missionsChronological[i];
    const rows = filesChangedByMission.get(missionId) ?? [];

    for (const row of rows) {
      switch (row.change_kind) {
        case 'A':
          current.add(row.file_path);
          break;
        case 'D':
          current.delete(row.file_path);
          break;
        case 'M':
          break;
        case 'R':
          if (row.rename_from !== null) current.delete(row.rename_from);
          current.add(row.file_path);
          break;
      }
    }

    if ((i + 1) % snapshotInterval === 0 || i === missionsChronological.length - 1) {
      snapshots.set(missionId, new Set(current));
      snapshotOrder.push(missionId);
    }
  }

  return {
    filesAt(asOfMissionId: string): Set<string> {
      const targetIdx = missionsChronological.indexOf(asOfMissionId);
      if (targetIdx === -1) return new Set<string>();

      let startIdx = 0;
      let startFiles = new Set<string>();

      for (let k = snapshotOrder.length - 1; k >= 0; k--) {
        const snapMission = snapshotOrder[k];
        const snapIdx = missionsChronological.indexOf(snapMission);
        if (snapIdx <= targetIdx) {
          if (snapIdx === targetIdx) {
            return new Set(snapshots.get(snapMission)!);
          }
          startIdx = snapIdx + 1;
          startFiles = new Set(snapshots.get(snapMission)!);
          break;
        }
      }

      const replay = new Set(startFiles);
      for (let i = startIdx; i <= targetIdx; i++) {
        const mId = missionsChronological[i];
        const rows = filesChangedByMission.get(mId) ?? [];
        for (const row of rows) {
          switch (row.change_kind) {
            case 'A':
              replay.add(row.file_path);
              break;
            case 'D':
              replay.delete(row.file_path);
              break;
            case 'M':
              break;
            case 'R':
              if (row.rename_from !== null) replay.delete(row.rename_from);
              replay.add(row.file_path);
              break;
          }
        }
      }
      return replay;
    },
  };
}
