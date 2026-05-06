/**
 * Mission Archeology View — shared types.
 * @module desktop/intelligence/atlas/archeology/types
 */

import type {
  AtlasFilesChanged,
  FileChangeKind,
} from '../../../../src/intelligence/types.js';

/**
 * Milestone entry feeding the timeline.  Sourced from the milestone-link
 * table upstream (one row per shipped milestone).  The archeology view
 * never queries this directly; the host passes it in via setMissions().
 */
export interface MilestoneLink {
  missionId: string;
  /** Display label, e.g. "v1.49.581 Apollo 11". */
  label: string;
  /** Wall-clock unix-ms when the milestone shipped. */
  shippedAt: number;
  /** Optional short caption shown under the timeline tick. */
  caption?: string;
  /** Optional decision id this mission was linked to (for cross-link). */
  linkedDecisionId?: string;
}

/** Aggregated bag of files-changed rows across the focused mission's neighbourhood. */
export interface MissionFilesBundle {
  missionId: string;
  rows: AtlasFilesChanged[];
}

/** Selection event emitted when a mission becomes focused. */
export interface ArcheologySelectEvent {
  missionId: string;
  /** File paths touched by the focused mission (drives system-map cross-highlight). */
  touchedFilePaths: string[];
}

/** Re-export so consumers don't need a second import. */
export type { FileChangeKind, AtlasFilesChanged };
