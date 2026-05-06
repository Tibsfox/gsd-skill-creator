/**
 * Mission Archeology View — public API.
 * @module desktop/intelligence/atlas/archeology
 */

export { createArcheologyView } from './archeology.js';
export type { ArcheologyOptions, ArcheologyView } from './archeology.js';

export { createTimeline, layoutTimeline } from './timeline.js';
export type { TimelineComponent, TimelineOptions, TimelineRender } from './timeline.js';

export { createMissionCard } from './mission-card.js';
export type { MissionCardComponent } from './mission-card.js';

export { buildSankeyData, nodeIdFor } from './sankey-data.js';
export type { SankeyDataResult } from './sankey-data.js';

export type {
  MilestoneLink,
  MissionFilesBundle,
  ArcheologySelectEvent,
  FileChangeKind,
  AtlasFilesChanged,
} from './types.js';
