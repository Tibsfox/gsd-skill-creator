/**
 * Trigram search primitive — public API.
 */

export { TrigramIndex } from './trigram.js';
export {
  lcsLength,
  firstMatchBonus,
  exactMatchBoost,
  compositeScore,
} from './scorer.js';
export type {
  SearchItem,
  SearchItemKind,
  SearchResult,
  TrigramIndexOptions,
} from './types.js';
