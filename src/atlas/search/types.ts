/**
 * Trigram search primitive — public types.
 */

export type SearchItemKind = 'symbol' | 'file' | 'mission';

export interface SearchItem {
  id: string;
  kind: SearchItemKind;
  text: string;
  payload?: unknown;
}

export interface SearchResult<T> {
  item: T;
  score: number;
}

export interface TrigramIndexOptions {
  caseInsensitive?: boolean;
  maxCandidates?: number;
}
