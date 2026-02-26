/**
 * Magic system barrel export.
 *
 * @module magic
 */

export { MagicLevel, DEFAULT_MAGIC_LEVEL, EVENT_VISIBILITY } from './types';
export type { MagicConfig, DisplayEvent, VisualIndicator } from './types';
export { MagicFilter } from './filter';
export type { IpcEvent } from './filter';
export { loadMagicLevel, saveMagicLevel } from './persistence';
export { RecalibratePanel } from './recalibrate-panel';
export type { RecalibratePanelProps } from './recalibrate-panel';
