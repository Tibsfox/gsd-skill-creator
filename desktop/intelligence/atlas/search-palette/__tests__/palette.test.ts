/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchPalette } from '../palette.js';
import {
  buildPaletteIndex,
  queryPalette,
  kindIndicator,
  type AtlasState,
  type PaletteEntry,
} from '../trigram-query.js';

function fixture(): AtlasState {
  return {
    symbols: [
      { id: 's1', name: 'useFoo', qualified_name: 'mod.useFoo', file_path: 'src/a.ts' },
      { id: 's2', name: 'useFooBar', qualified_name: 'mod.useFooBar', file_path: 'src/b.ts' },
      { id: 's3', name: 'helloWorld', qualified_name: 'mod.helloWorld', file_path: 'src/c.ts' },
    ],
    files: [
      { id: 'f1', path: 'src/intelligence/atlas.ts' },
      { id: 'f2', path: 'src/intelligence/symbols.ts' },
      { id: 'f3', path: 'docs/atlas.md' },
    ],
    missions: [
      { id: 'v1.49.605', title: 'Apollo 16' },
      { id: 'v1.49.607', title: 'GSD Code Atlas' },
    ],
  };
}

describe('palette query pipeline', () => {
  it('query→trigram→result returns matching items across all kinds', () => {
    const idx = buildPaletteIndex(fixture());
    const symbolHits = queryPalette(idx, 'useFoo', 10);
    expect(symbolHits.length).toBeGreaterThan(0);
    expect(symbolHits.some((r) => r.kind === 'symbol' && r.label === 'useFoo')).toBe(true);

    const fileHits = queryPalette(idx, 'atlas.ts', 10);
    expect(fileHits.some((r) => r.kind === 'file')).toBe(true);

    const missionHits = queryPalette(idx, 'v1.49.607', 10);
    expect(missionHits.some((r) => r.kind === 'mission')).toBe(true);
  });

  it('kindIndicator returns distinct strings per kind', () => {
    expect(kindIndicator('symbol')).not.toBe(kindIndicator('file'));
    expect(kindIndicator('file')).not.toBe(kindIndicator('mission'));
    expect(kindIndicator('symbol')).not.toBe(kindIndicator('mission'));
  });

  it('empty query returns no results', () => {
    const idx = buildPaletteIndex(fixture());
    expect(queryPalette(idx, '', 10)).toEqual([]);
    expect(queryPalette(idx, '   ', 10)).toEqual([]);
  });
});

describe('SearchPalette UI', () => {
  let onSelect: ReturnType<typeof vi.fn>;
  let palette: SearchPalette;

  beforeEach(() => {
    document.body.innerHTML = '';
    onSelect = vi.fn();
    palette = new SearchPalette({ onSelect });
    palette.setAtlasState(fixture());
    palette.openPalette();
  });

  function setQuery(q: string): void {
    const input = document.querySelector<HTMLInputElement>('.sc-search-input')!;
    input.value = q;
    input.dispatchEvent(new Event('input'));
  }

  function dispatchKey(key: string): void {
    const input = document.querySelector<HTMLInputElement>('.sc-search-input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  it('keyboard ArrowDown/ArrowUp navigates results', () => {
    setQuery('use');
    const before = palette.getActiveIndex();
    expect(palette.getResults().length).toBeGreaterThan(1);
    dispatchKey('ArrowDown');
    expect(palette.getActiveIndex()).toBe(before + 1);
    dispatchKey('ArrowUp');
    expect(palette.getActiveIndex()).toBe(before);
  });

  it('Enter selects the active result and fires onSelect', () => {
    setQuery('useFoo');
    expect(palette.getResults().length).toBeGreaterThan(0);
    dispatchKey('Enter');
    expect(onSelect).toHaveBeenCalledTimes(1);
    const entry = onSelect.mock.calls[0][0] as PaletteEntry;
    expect(entry.kind).toBe('symbol');
  });

  it('Escape closes the palette without selecting', () => {
    setQuery('useFoo');
    dispatchKey('Escape');
    expect(palette.isOpen()).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders kind indicator on each result row', () => {
    setQuery('atlas');
    const rows = document.querySelectorAll('.sc-search-row');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const kind = (row as HTMLElement).dataset.kind;
      expect(['symbol', 'file', 'mission']).toContain(kind);
      const ind = row.querySelector('.sc-search-kind');
      expect(ind?.textContent).toBe(kindIndicator(kind as 'symbol' | 'file' | 'mission'));
    }
  });

  it('limits rendered results to top-10 by default', () => {
    // Build a state with >10 matches.
    const big: AtlasState = {
      symbols: Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        name: `useFoo${i}`,
        qualified_name: `mod.useFoo${i}`,
        file_path: `src/${i}.ts`,
      })),
      files: [],
      missions: [],
    };
    palette.setAtlasState(big);
    setQuery('useFoo');
    expect(palette.getResults().length).toBeLessThanOrEqual(10);
  });
});
