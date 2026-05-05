/**
 * System Map — public API.
 */

export { createSystemMap } from './system-map.js';
export type { Focus, SelectHandler, SystemMapComponent, SystemMapOptions, LegendEntry } from './system-map.js';
export { buildFolderTree, subTreeAt, packConfig } from './layouts.js';
export type { FileData, NodePayload, BuildOptions } from './layouts.js';
export { colorFor, buildColorContext, colorBySymbolDensity, colorByRecentActivity, colorByMissionAttribution, colorByProvenanceOverlay, missionHue } from './color-modes.js';
export type { ColorMode, ColorContext } from './color-modes.js';
