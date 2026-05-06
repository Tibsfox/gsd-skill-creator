/**
 * Cmd-K Search Palette — DOM-based quick-open dialog.
 *
 * Pure DOM (no @tauri-apps/api). The owner constructs a SearchPalette,
 * passes in the atlas state, and listens for `onSelect`.
 *
 * Keyboard:
 *   Cmd-K / Ctrl-K — open
 *   Up/Down       — navigate results
 *   Enter         — select
 *   Escape        — close
 */

import {
  buildPaletteIndex,
  queryPalette,
  kindIndicator,
  type AtlasState,
  type PaletteEntry,
} from './trigram-query.js';
import type { TrigramIndex } from '../../../../src/atlas/search/index.js';

export interface SearchPaletteOptions {
  /** Where to mount the palette (defaults to document.body). */
  parent?: HTMLElement;
  /** How many results to render (default 10). */
  limit?: number;
}

export interface SearchPaletteEvents {
  onSelect: (entry: PaletteEntry) => void;
}

export class SearchPalette {
  private readonly root: HTMLDivElement;
  private readonly input: HTMLInputElement;
  private readonly list: HTMLUListElement;
  private readonly events: SearchPaletteEvents;
  private readonly limit: number;

  private index: TrigramIndex<PaletteEntry> | null = null;
  private results: PaletteEntry[] = [];
  private active = 0;
  private open = false;

  constructor(events: SearchPaletteEvents, options: SearchPaletteOptions = {}) {
    this.events = events;
    this.limit = options.limit ?? 10;

    this.root = document.createElement('div');
    this.root.className = 'sc-search-palette hidden';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', 'Search palette');

    const panel = document.createElement('div');
    panel.className = 'sc-search-panel';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'sc-search-input';
    this.input.placeholder = 'Search symbols, files, missions…';
    this.input.setAttribute('aria-label', 'Search');

    this.list = document.createElement('ul');
    this.list.className = 'sc-search-results';
    this.list.setAttribute('role', 'listbox');

    panel.appendChild(this.input);
    panel.appendChild(this.list);
    this.root.appendChild(panel);

    (options.parent ?? document.body).appendChild(this.root);

    this.input.addEventListener('input', () => this.onQueryChanged());
    this.input.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keydown', (e) => this.onGlobalKeyDown(e));
    this.root.addEventListener('click', (e) => {
      if (e.target === this.root) this.close();
    });
  }

  setAtlasState(state: AtlasState): void {
    this.index = buildPaletteIndex(state);
    if (this.open) this.onQueryChanged();
  }

  openPalette(): void {
    this.open = true;
    this.root.classList.remove('hidden');
    this.input.value = '';
    this.results = [];
    this.active = 0;
    this.renderList();
    this.input.focus();
  }

  close(): void {
    this.open = false;
    this.root.classList.add('hidden');
  }

  isOpen(): boolean {
    return this.open;
  }

  /** Read-only view of current results — for tests. */
  getResults(): readonly PaletteEntry[] {
    return this.results;
  }

  /** 0-based index of the highlighted row — for tests. */
  getActiveIndex(): number {
    return this.active;
  }

  private onQueryChanged(): void {
    const q = this.input.value;
    if (!this.index) {
      this.results = [];
    } else {
      this.results = queryPalette(this.index, q, this.limit);
    }
    this.active = 0;
    this.renderList();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.results.length > 0) {
        this.active = (this.active + 1) % this.results.length;
        this.renderList();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.results.length > 0) {
        this.active = (this.active - 1 + this.results.length) % this.results.length;
        this.renderList();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.selectActive();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  private onGlobalKeyDown(e: KeyboardEvent): void {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      this.openPalette();
    }
  }

  private selectActive(): void {
    const entry = this.results[this.active];
    if (!entry) return;
    this.events.onSelect(entry);
    this.close();
  }

  private renderList(): void {
    this.list.replaceChildren();
    for (let i = 0; i < this.results.length; i++) {
      const entry = this.results[i];
      const li = document.createElement('li');
      li.className = 'sc-search-row' + (i === this.active ? ' active' : '');
      li.setAttribute('role', 'option');
      li.dataset.kind = entry.kind;
      li.dataset.index = String(i);

      const indicator = document.createElement('span');
      indicator.className = 'sc-search-kind';
      indicator.textContent = kindIndicator(entry.kind);
      li.appendChild(indicator);

      const label = document.createElement('span');
      label.className = 'sc-search-label';
      label.textContent = entry.label;
      li.appendChild(label);

      if (entry.detail) {
        const detail = document.createElement('span');
        detail.className = 'sc-search-detail';
        detail.textContent = entry.detail;
        li.appendChild(detail);
      }

      li.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        this.active = i;
        this.selectActive();
      });

      this.list.appendChild(li);
    }
  }
}
