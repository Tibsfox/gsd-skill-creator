/**
 * Cmd-K Search Palette — public API.
 */

export { SearchPalette } from './palette.js';
export type { SearchPaletteOptions, SearchPaletteEvents } from './palette.js';
export {
  buildPaletteIndex,
  queryPalette,
  kindIndicator,
} from './trigram-query.js';
export type { PaletteEntry, PaletteKind, AtlasState } from './trigram-query.js';
