/**
 * Cmd-K palette adapter — converts a query string + atlas state into
 * a TrigramIndex query and formats the top-10 results.
 *
 * The palette pre-fetches a flat symbol list, file list, and mission list
 * once on open via the existing IPC methods (no new commands), populates a
 * single TrigramIndex<PaletteEntry>, and queries it client-side.
 */

import { TrigramIndex } from '../../../../src/atlas/search/index.js';

export type PaletteKind = 'symbol' | 'file' | 'mission';

export interface PaletteEntry {
  id: string;
  kind: PaletteKind;
  label: string;
  /** Optional secondary line (e.g. file path beneath a symbol name). */
  detail?: string;
}

export interface AtlasState {
  symbols: Array<{ id: string; name: string; qualified_name?: string; file_path?: string }>;
  files: Array<{ id?: string; path: string }>;
  missions: Array<{ id: string; title?: string }>;
}

/**
 * Builds an in-memory trigram index from the pre-fetched atlas state.
 * Call once when the palette opens (or when state changes).
 */
export function buildPaletteIndex(state: AtlasState): TrigramIndex<PaletteEntry> {
  const idx = new TrigramIndex<PaletteEntry>();

  for (const s of state.symbols) {
    const entry: PaletteEntry = {
      id: `sym:${s.id}`,
      kind: 'symbol',
      label: s.name,
      detail: s.file_path,
    };
    // Index by both short name and qualified name so both lookups hit.
    const text = s.qualified_name && s.qualified_name !== s.name
      ? `${s.name} ${s.qualified_name}`
      : s.name;
    idx.add(entry, text);
  }
  for (const f of state.files) {
    const entry: PaletteEntry = {
      id: `file:${f.id ?? f.path}`,
      kind: 'file',
      label: f.path,
    };
    idx.add(entry, f.path);
  }
  for (const m of state.missions) {
    const entry: PaletteEntry = {
      id: `mission:${m.id}`,
      kind: 'mission',
      label: m.title ?? m.id,
      detail: m.title ? m.id : undefined,
    };
    idx.add(entry, `${m.id} ${m.title ?? ''}`);
  }
  return idx;
}

/**
 * Top-N query; default 10 for Cmd-K.
 */
export function queryPalette(
  idx: TrigramIndex<PaletteEntry>,
  query: string,
  limit = 10,
): PaletteEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return idx.search(trimmed, limit);
}

/**
 * Visual indicator for the entry kind, suitable for prefixing in the UI.
 */
export function kindIndicator(kind: PaletteKind): string {
  switch (kind) {
    case 'symbol':
      return '◆';
    case 'file':
      return '▤';
    case 'mission':
      return '◉';
  }
}
