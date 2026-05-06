/**
 * Atlas Shell — top-level 4-pane layout with cross-view coordination.
 *
 * Mounts:
 *   ┌──────────────┬────────────────┐
 *   │ System Map   │ Symbol Graph   │
 *   ├──────────────┴────────────────┤
 *   │ Mission Archeology            │
 *   ├──────────────┬────────────────┤
 *   │ (status)     │ Code View      │
 *   └──────────────┴────────────────┘
 *   + Cmd-K palette overlay
 *
 * Each pane has a drag-to-resize splitter (60 FPS via rAF).
 * Focus routing goes through the coordinator.
 */

import { createSystemMap } from './system-map/index.js';
import type { SystemMapComponent, Focus as SmFocus } from './system-map/index.js';
import { SymbolGraphView } from './symbol-graph/index.js';
import type { GraphSelection } from './symbol-graph/index.js';
import { createArcheologyView } from './archeology/index.js';
import type { ArcheologyView } from './archeology/index.js';
import { createCodeView } from './code-view/index.js';
import type { CodeViewComponent } from './code-view/index.js';
import { SearchPalette } from './search-palette/index.js';
import type { AtlasState } from './search-palette/index.js';
import { createCoordinator } from './coordinator.js';
import type { Coordinator, CoordinatedView } from './coordinator.js';
import type { Focus } from './focus-state.js';
import { intelligenceIpc } from '../../../src/intelligence/ipc.js';
import { loadSavedLayout, saveLayout } from './layout-persistence.js';
import type { SavedAtlasLayout } from './layout-persistence.js';

export interface AtlasShellOptions {
  coordinator?: Coordinator;
  projectId?: string;
}

export interface AtlasShell {
  mount(host: HTMLElement): void;
  unmount(): void;
  coordinator: Coordinator;
  /**
   * Populate the system-map (and code-view, if a focus arrives later) with
   * data from a freshly indexed snapshot. Pulls every symbol in the snapshot
   * via `intelligenceIpc.listSymbolsInSnapshot`, derives the unique file list,
   * and calls `systemMap.load(snapshotId, filePaths)`. Safe to call multiple
   * times — each call replaces the prior snapshot.
   *
   * Returns the number of files loaded. Resolves with 0 when the snapshot is
   * empty or the system-map has not yet mounted.
   */
  loadSnapshot(snapshotId: string): Promise<number>;
}

export function createAtlasShell(opts: AtlasShellOptions = {}): AtlasShell {
  const coordinator = opts.coordinator ?? createCoordinator();

  let hostEl: HTMLElement | null = null;
  let shellEl: HTMLDivElement | null = null;
  let graphCanvas: HTMLCanvasElement | null = null;
  let graphView: SymbolGraphView | null = null;
  let systemMapRef: SystemMapComponent | null = null;
  let loadedSnapshotId: string | null = null;

  // Splitter drag state
  interface DragState {
    kind: 'col' | 'row-top' | 'row-mid';
    startPx: number;
    startPct: number;
    totalPx: number;
  }
  let drag: DragState | null = null;
  let rafId: number | null = null;

  // Column / row percentages (CSS custom properties)
  let colLeft = 40;    // %
  let rowTop = 45;     // %
  let rowMid = 20;     // %
  // rowBot = 100 - rowTop - rowMid

  // Persisted layout state (mirrors what we'll save)
  let persistedColorMode: SavedAtlasLayout['systemMapColorMode'] = 'symbol-density';
  let persistedMissionFilter: string | null = null;
  let persistedLegendVisible = true;

  let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingSave = false;

  const unregisterFns: Array<() => void> = [];

  // ── helpers ────────────────────────────────────────────────────────────────

  function pct(v: number): string { return `${v.toFixed(2)}%`; }

  function applyLayout(): void {
    if (!shellEl) return;
    shellEl.style.setProperty('--atlas-col-left', pct(colLeft));
    shellEl.style.setProperty('--atlas-col-right', pct(100 - colLeft));
    shellEl.style.setProperty('--atlas-row-top', pct(rowTop));
    shellEl.style.setProperty('--atlas-row-mid', pct(rowMid));
    shellEl.style.setProperty('--atlas-row-bot', pct(100 - rowTop - rowMid));
    scheduleSave();
  }

  function makePane(cls: string, title: string): { pane: HTMLDivElement; body: HTMLDivElement } {
    const pane = document.createElement('div');
    pane.className = `atlas-pane atlas-pane--${cls}`;

    const header = document.createElement('div');
    header.className = 'atlas-pane-header';
    header.textContent = title;
    pane.appendChild(header);

    const body = document.createElement('div');
    body.className = 'atlas-pane-body';
    pane.appendChild(body);

    return { pane, body };
  }

  function makeSplitter(cls: string): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `atlas-splitter atlas-splitter--${cls}`;
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', cls === 'col' ? 'vertical' : 'horizontal');
    el.setAttribute('tabindex', '0');
    return el;
  }

  function splitterValueNow(kind: DragState['kind']): number {
    if (kind === 'col') return Math.round(colLeft);
    if (kind === 'row-top') return Math.round(rowTop);
    return Math.round(rowMid);
  }

  function updateSplitterAria(el: HTMLDivElement, kind: DragState['kind']): void {
    el.setAttribute('aria-valuenow', String(splitterValueNow(kind)));
  }

  function attachSplitterKeyboard(
    el: HTMLDivElement,
    kind: DragState['kind'],
  ): void {
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      const isHoriz = kind === 'col';
      const decKey = isHoriz ? 'ArrowLeft' : 'ArrowUp';
      const incKey = isHoriz ? 'ArrowRight' : 'ArrowDown';
      if (e.key !== decKey && e.key !== incKey && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      if (kind === 'col') {
        if (e.key === 'ArrowLeft') colLeft = Math.max(10, colLeft - 2);
        else if (e.key === 'ArrowRight') colLeft = Math.min(90, colLeft + 2);
        else if (e.key === 'Home') colLeft = 10;
        else if (e.key === 'End') colLeft = 90;
      } else if (kind === 'row-top') {
        if (e.key === 'ArrowUp') rowTop = Math.max(10, rowTop - 2);
        else if (e.key === 'ArrowDown') rowTop = Math.min(80, rowTop + 2);
        else if (e.key === 'Home') rowTop = 10;
        else if (e.key === 'End') rowTop = 80;
        if (rowTop + rowMid > 90) rowMid = 90 - rowTop;
      } else {
        if (e.key === 'ArrowUp') rowMid = Math.max(5, rowMid - 2);
        else if (e.key === 'ArrowDown') rowMid = Math.min(80 - rowTop, rowMid + 2);
        else if (e.key === 'Home') rowMid = 5;
        else if (e.key === 'End') rowMid = 80 - rowTop;
      }
      applyLayout();
      updateSplitterAria(el, kind);
    });
  }

  // ── splitter drag ──────────────────────────────────────────────────────────

  function onPointerMove(e: PointerEvent): void {
    if (!drag || !shellEl) return;
    e.preventDefault();
    const delta = drag.kind === 'col'
      ? e.clientX - drag.startPx
      : e.clientY - drag.startPx;
    const deltaPct = (delta / drag.totalPx) * 100;
    let next = drag.startPct + deltaPct;

    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!shellEl) return;
      if (drag!.kind === 'col') {
        colLeft = Math.max(10, Math.min(90, next));
      } else if (drag!.kind === 'row-top') {
        rowTop = Math.max(10, Math.min(80, next));
        if (rowTop + rowMid > 90) rowMid = 90 - rowTop;
      } else {
        // row-mid: total used = rowTop + rowMid = drag.startPct + deltaPct
        rowMid = Math.max(5, Math.min(80 - rowTop, next - rowTop));
      }
      applyLayout();
    });
  }

  function onPointerUp(e: PointerEvent): void {
    if (!drag) return;
    const splitterEl = document.querySelector('.atlas-splitter--dragging');
    if (splitterEl) {
      splitterEl.classList.remove('atlas-splitter--dragging');
      (splitterEl as HTMLElement).releasePointerCapture(e.pointerId);
    }
    drag = null;
  }

  function attachSplitter(
    el: HTMLDivElement,
    kind: DragState['kind'],
  ): void {
    el.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.classList.add('atlas-splitter--dragging');
      const rect = shellEl!.getBoundingClientRect();
      const startPct = kind === 'col'
        ? colLeft
        : kind === 'row-top' ? rowTop : rowTop + rowMid;
      drag = {
        kind,
        startPx: kind === 'col' ? e.clientX : e.clientY,
        startPct,
        totalPx: kind === 'col' ? rect.width : rect.height,
      };
    });
  }

  // ── coordinator adapter for system-map ────────────────────────────────────

  function wrapSystemMap(sm: SystemMapComponent): CoordinatedView {
    return {
      setFocus(focus: Focus): void {
        sm.setFocus(focus as SmFocus);
      },
    };
  }

  function wrapArcheology(av: ArcheologyView): CoordinatedView {
    return {
      setFocus(focus: Focus): void {
        if (focus.kind === 'mission') av.setFocus(focus.id);
      },
    };
  }

  // wrapCodeView removed: code-view is now constructed per file-focus inline
  // (so source loads on click). See createAtlasShell.mount → cvWrapper.

  // ── Symbol graph adapter ───────────────────────────────────────────────────

  function wrapSymbolGraph(sg: SymbolGraphView): CoordinatedView {
    return {
      setFocus(focus: Focus): void {
        const sid = loadedSnapshotId ?? '';
        if (!sid) return;
        if (focus.kind === 'symbol') {
          sg.setFocus({ snapshotId: sid as never, symbolId: focus.id }).catch(() => {});
        } else if (focus.kind === 'file') {
          // Show the entire file's symbol structure + intra-file edges,
          // not just one symbol's 1-hop neighborhood.
          sg.loadFileGraph(sid as never, focus.id).catch(() => { /* IPC unavailable in tests */ });
        }
      },
    };
  }

  // ── mount / unmount ────────────────────────────────────────────────────────

  // ── Layout persistence helpers ─────────────────────────────────────────────

  function flushSave(): void {
    if (!opts.projectId || !pendingSave) return;
    pendingSave = false;
    saveLayout(opts.projectId, {
      schema_version: 1,
      splitters: { col: colLeft, rowTop, rowMid },
      systemMapColorMode: persistedColorMode,
      missionFilter: persistedMissionFilter,
      legendVisible: persistedLegendVisible,
      saved_at: new Date().toISOString(),
    });
  }

  function scheduleSave(): void {
    if (!opts.projectId) return;
    pendingSave = true;
    if (saveDebounceTimer !== null) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveDebounceTimer = null;
      flushSave();
    }, 200);
  }

  // ── Palette atlas-state cache ─────────────────────────────────────────────

  let atlasStateCache: AtlasState | null = null;
  let atlasStateFetching = false;

  async function fetchAndPopulateAtlasState(palette: SearchPalette): Promise<void> {
    if (atlasStateCache !== null) {
      palette.setAtlasState(atlasStateCache);
      return;
    }
    if (atlasStateFetching) return;
    atlasStateFetching = true;
    try {
      const snapshotId = '' as any;
      const [symbolsSettled, missionsSettled] = await Promise.allSettled([
        intelligenceIpc.listSymbolsForFile(snapshotId, '').catch(() => [] as any[]),
        intelligenceIpc.listFilesChangedByMission('').catch(() => [] as any[]),
      ]);
      const rawSymbols = symbolsSettled.status === 'fulfilled' ? symbolsSettled.value : [];
      const rawMissions = missionsSettled.status === 'fulfilled' ? missionsSettled.value : [];
      const files: AtlasState['files'] = Array.from(
        new Set(rawSymbols.filter((s: any) => s.file_path).map((s: any) => s.file_path as string))
      ).map((p) => ({ path: p }));
      const state: AtlasState = {
        symbols: rawSymbols as AtlasState['symbols'],
        files,
        missions: rawMissions.length > 0
          ? [{ id: String(rawMissions[0].mission_id ?? '') }]
          : [],
      };
      atlasStateCache = state;
      palette.setAtlasState(state);
    } catch {
      // IPC unavailable — leave palette empty
    } finally {
      atlasStateFetching = false;
    }
  }

  function invalidateAtlasStateCache(): void {
    atlasStateCache = null;
  }

  return {
    coordinator,

    mount(host: HTMLElement): void {
      hostEl = host;

      // Restore saved layout before constructing views.
      if (opts.projectId) {
        const saved = loadSavedLayout(opts.projectId);
        if (saved) {
          colLeft = saved.splitters.col;
          rowTop = saved.splitters.rowTop;
          rowMid = saved.splitters.rowMid;
          persistedColorMode = saved.systemMapColorMode;
          persistedMissionFilter = saved.missionFilter;
          persistedLegendVisible = saved.legendVisible;
        }
      }

      shellEl = document.createElement('div');
      shellEl.className = 'atlas-shell';
      applyLayout();

      // ── ARIA live region ─────────────────────────────────────────────────
      const announcer = document.createElement('div');
      announcer.id = 'atlas-focus-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText =
        'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
      shellEl.appendChild(announcer);
      const unAnnouncer = coordinator.attachAnnouncer(announcer);
      unregisterFns.push(unAnnouncer);

      // ── System Map ──────────────────────────────────────────────────────
      const { pane: smPane, body: smBody } = makePane('system-map', 'System Map');
      const smOpts = opts.projectId ? { colorMode: persistedColorMode } : {};
      const sm = createSystemMap(smOpts);
      sm.mount(smBody);
      systemMapRef = sm;
      const smWrapper = wrapSystemMap(sm);
      const unSm = coordinator.registerView(smWrapper);
      unregisterFns.push(unSm);
      sm.onSelect((f: SmFocus) => {
        if (f.kind === null) return;
        coordinator.dispatch(f as Focus, smWrapper);
      });
      unregisterFns.push(sm.onColorModeChange((mode) => {
        persistedColorMode = mode;
        scheduleSave();
      }));

      // ── Symbol Graph ────────────────────────────────────────────────────
      const { pane: sgPane, body: sgBody } = makePane('symbol-graph', 'Symbol Graph');
      graphCanvas = document.createElement('canvas');
      graphCanvas.style.cssText = 'width:100%;height:100%;display:block;';
      sgBody.appendChild(graphCanvas);

      const chipContainerEl = document.createElement('div');
      chipContainerEl.className = 'atlas-symbol-graph-chip-container';
      sgPane.appendChild(chipContainerEl);

      let sgView: SymbolGraphView | null = null;
      let sgWrapper: CoordinatedView | null = null;
      // Defer construction until paint so canvas has dimensions. Two rAFs +
      // explicit drawing-buffer sizing ensures the WebGL viewport matches the
      // pane size; the constructor reads canvas.offsetWidth/Height + canvas
      // .width/.height into a fixed viewport struct, so getting these wrong
      // here means a 300×150 stretched render forever.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!graphCanvas || !shellEl) return;
        // Set drawing-buffer size to the displayed size before construction.
        const dpr = (typeof globalThis !== 'undefined' && (globalThis as { devicePixelRatio?: number }).devicePixelRatio) || 1;
        const cssW = graphCanvas.clientWidth || 800;
        const cssH = graphCanvas.clientHeight || 600;
        graphCanvas.width = Math.max(1, Math.floor(cssW * dpr));
        graphCanvas.height = Math.max(1, Math.floor(cssH * dpr));
        try {
          sgView = new SymbolGraphView(graphCanvas);
          graphView = sgView;
          sgView.mountChipContainer(chipContainerEl);
          sgWrapper = wrapSymbolGraph(sgView);
          const unSg = coordinator.registerView(sgWrapper);
          unregisterFns.push(unSg);
          sgView.onSelect((sel: GraphSelection | null) => {
            if (!sel || !sgWrapper) return;
            coordinator.dispatch(
              { kind: 'symbol', id: sel.symbol.id },
              sgWrapper,
            );
          });
          unregisterFns.push(sgView.onMissionFilterChange((missionId) => {
            persistedMissionFilter = missionId;
            scheduleSave();
          }));
          // Replay current focus
          const cur = coordinator.current();
          if (cur) sgWrapper.setFocus(cur);
        } catch (e) {
          // WebGL2 unavailable (e.g. jsdom) — skip silently in tests, but
          // surface the failure visibly in production so the empty pane has
          // an explanation.
          const msg = e instanceof Error ? e.message : String(e);
          // eslint-disable-next-line no-console
          console.error('[atlas] SymbolGraphView construction failed:', msg);
          if (sgPane) {
            const errEl = document.createElement('div');
            errEl.style.cssText = 'position:absolute;top:30px;left:10px;right:10px;color:#f87171;font-family:var(--font-mono);font-size:11px;';
            errEl.textContent = 'Symbol graph unavailable: ' + msg;
            sgPane.appendChild(errEl);
          }
        }
      }));

      // ── Mission Archeology ───────────────────────────────────────────────
      const { pane: avPane, body: avBody } = makePane('archeology', 'Mission Archeology');
      const av = createArcheologyView();
      av.mount(avBody);
      const avWrapper = wrapArcheology(av);
      const unAv = coordinator.registerView(avWrapper);
      unregisterFns.push(unAv);
      av.onSelect((e) => {
        coordinator.dispatch({ kind: 'mission', id: e.missionId }, avWrapper);
      });

      // ── W4e search bar (top of archeology pane) ──────────────────────────
      // Three search modes:
      //   • Symbols (text)    → /api/atlas/search/symbols (PG tsvector)
      //   • Symbols (semantic) → /api/atlas/search/semantic (pgvector)
      //   • Mission docs      → /api/atlas/mission-search (Chroma)
      // Results render in a flyout overlay that takes over the archeology
      // pane. Click a result → dispatches the appropriate focus.
      const searchBar = document.createElement('div');
      searchBar.className = 'atlas-archeology-searchbar';
      searchBar.style.cssText =
        'position:absolute;top:22px;left:0;right:0;background:var(--bg-secondary,#24283b);' +
        'border-bottom:1px solid var(--border-subtle,#292e42);padding:6px 10px;' +
        'display:flex;align-items:center;gap:6px;z-index:5;';
      const modeSel = document.createElement('select');
      modeSel.style.cssText = 'background:var(--bg-primary,#1a1b26);color:var(--text-primary,#c0caf5);' +
        'border:1px solid var(--border-subtle,#292e42);border-radius:4px;padding:3px 6px;font-size:11px;';
      const modes: Array<[string, string]> = [
        ['text', 'Symbols (text)'],
        ['semantic', 'Symbols (semantic)'],
        ['missions', 'Mission docs'],
      ];
      for (const [v, label] of modes) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = label;
        modeSel.appendChild(opt);
      }
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.placeholder = 'Search across the atlas…';
      searchInput.style.cssText = 'flex:1;background:var(--bg-primary,#1a1b26);color:var(--text-primary,#c0caf5);' +
        'border:1px solid var(--border-subtle,#292e42);border-radius:4px;padding:3px 8px;font-size:12px;';
      searchBar.appendChild(modeSel);
      searchBar.appendChild(searchInput);
      avPane.appendChild(searchBar);

      const searchResultsEl = document.createElement('div');
      searchResultsEl.style.cssText =
        'position:absolute;top:62px;left:0;right:0;bottom:0;background:var(--bg-primary,#1a1b26);' +
        'overflow:auto;padding:10px 12px;display:none;z-index:4;font-size:12px;';
      avPane.appendChild(searchResultsEl);

      let searchSeq = 0;
      async function runSearch(): Promise<void> {
        const q = searchInput.value.trim();
        if (!q) {
          searchResultsEl.style.display = 'none';
          return;
        }
        const seq = ++searchSeq;
        const mode = modeSel.value;
        searchResultsEl.style.display = '';
        searchResultsEl.innerHTML =
          '<div style="color:var(--text-muted,#6e7681);">Searching ' +
          escapeText(mode) + '…</div>';
        try {
          let rows: Array<{ kind: string; primary: string; secondary?: string; onClick: () => void }>;
          if (mode === 'text') {
            const r = await fetch('/api/atlas/search/symbols?limit=50&q=' + encodeURIComponent(q));
            const body = await r.json() as {
              ok: boolean; error?: string;
              results?: Array<{ id: string; project_id: string; qualified_name: string; file_path: string; kind: string; rank: number }>;
            };
            if (!body.ok) throw new Error(body.error ?? 'search failed');
            rows = (body.results ?? []).map((s) => ({
              kind: 'symbol',
              primary: s.qualified_name + '  ' + s.kind,
              secondary: s.file_path,
              onClick: () => coordinator.dispatch({ kind: 'symbol', id: s.id }),
            }));
          } else if (mode === 'semantic') {
            const r = await fetch('/api/atlas/search/semantic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ q, limit: 50 }),
            });
            const body = await r.json() as {
              ok: boolean; error?: string;
              results?: Array<{ id: string; qualified_name: string; file_path: string; kind: string; distance: number }>;
            };
            if (!body.ok) throw new Error(body.error ?? 'search failed');
            rows = (body.results ?? []).map((s) => ({
              kind: 'symbol',
              primary: s.qualified_name + '  ' + s.kind,
              secondary: 'd=' + s.distance.toFixed(3) + '  ' + s.file_path,
              onClick: () => coordinator.dispatch({ kind: 'symbol', id: s.id }),
            }));
          } else {
            const r = await fetch('/api/atlas/mission-search?limit=20&q=' + encodeURIComponent(q));
            const body = await r.json() as {
              ok: boolean; error?: string;
              results?: Array<{ path: string; milestoneTag: string; missionDir: string; distance: number; snippet?: string }>;
            };
            if (!body.ok) throw new Error(body.error ?? 'search failed');
            rows = (body.results ?? []).map((s) => ({
              kind: 'doc',
              primary: s.path,
              secondary: (s.milestoneTag ? '[' + s.milestoneTag + ']  ' : '')
                + (s.snippet ?? '').replace(/\s+/g, ' ').slice(0, 200),
              onClick: () => loadFileIntoCodeView(s.path, 1),
            }));
          }
          // Late-arrival guard: if a newer search has started, drop these results.
          if (seq !== searchSeq) return;

          searchResultsEl.innerHTML = '';
          if (rows.length === 0) {
            const empty = document.createElement('div');
            empty.style.color = 'var(--text-muted,#6e7681)';
            empty.textContent = 'No matches.';
            searchResultsEl.appendChild(empty);
            return;
          }
          for (const r of rows) {
            const row = document.createElement('div');
            row.style.cssText =
              'padding:6px 8px;cursor:pointer;border-radius:4px;' +
              'border-bottom:1px solid var(--border-subtle,#292e42);';
            row.addEventListener('mouseenter', () => { row.style.background = 'var(--bg-secondary,#24283b)'; });
            row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
            row.addEventListener('click', () => {
              r.onClick();
              searchResultsEl.style.display = 'none';
              searchInput.value = '';
            });
            const p = document.createElement('div');
            p.style.cssText = 'color:var(--text-primary,#c0caf5);font-family:var(--font-mono);';
            p.textContent = r.primary;
            row.appendChild(p);
            if (r.secondary) {
              const s = document.createElement('div');
              s.style.cssText = 'color:var(--text-muted,#6e7681);font-size:11px;margin-top:2px;';
              s.textContent = r.secondary;
              row.appendChild(s);
            }
            searchResultsEl.appendChild(row);
          }
        } catch (e) {
          if (seq !== searchSeq) return;
          searchResultsEl.innerHTML =
            '<div style="color:#f87171;">Search failed: ' +
            escapeText(e instanceof Error ? e.message : String(e)) + '</div>';
        }
      }
      let searchDebounce: ReturnType<typeof setTimeout> | null = null;
      searchInput.addEventListener('input', () => {
        if (searchDebounce !== null) clearTimeout(searchDebounce);
        searchDebounce = setTimeout(runSearch, 200);
      });
      modeSel.addEventListener('change', () => { void runSearch(); });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          searchResultsEl.style.display = 'none';
        }
      });

      // W4d: file-history view overlays the archeology pane when a file is
      // focused. We slide an absolutely-positioned panel over the existing
      // mission-flow Sankey so the user sees the file→milestone→docs chain
      // without losing the underlying archeology component.
      const fileArcheologyEl = document.createElement('div');
      fileArcheologyEl.className = 'atlas-file-archeology';
      fileArcheologyEl.style.cssText =
        'position:absolute;top:22px;left:0;right:0;bottom:0;background:var(--bg-primary,#1a1b26);' +
        'overflow:auto;padding:12px 16px;display:none;font-size:12px;line-height:1.5;';
      avPane.appendChild(fileArcheologyEl);

      async function renderFileArcheology(filePath: string): Promise<void> {
        fileArcheologyEl.style.display = '';
        fileArcheologyEl.innerHTML =
          '<div style="color:var(--text-muted,#6e7681);">Loading file history…</div>';
        try {
          const resp = await fetch(
            '/api/atlas/file-history?path=' + encodeURIComponent(filePath),
          );
          const body = await resp.json() as {
            ok: boolean;
            milestones: Array<{
              milestoneTag: string;
              commits: Array<{ sha: string; timestamp: number; subject: string }>;
              earliestTimestamp: number;
              latestTimestamp: number;
            }>;
          };
          if (!body.ok) throw new Error('file-history failed');
          if (body.milestones.length === 0) {
            fileArcheologyEl.innerHTML =
              '<div style="color:var(--text-muted,#6e7681);">No git history for ' + escapeText(filePath) + '</div>';
            return;
          }

          const root = document.createElement('div');
          root.style.display = 'grid';
          root.style.gridTemplateColumns = 'minmax(280px, 1fr) 2fr';
          root.style.gap = '12px';
          root.style.height = '100%';

          // Left: milestone timeline.
          const leftCol = document.createElement('div');
          leftCol.style.cssText = 'overflow:auto;padding-right:8px;border-right:1px solid var(--border-subtle,#292e42);';
          const header = document.createElement('div');
          header.style.cssText = 'font-weight:600;color:var(--text-primary,#c0caf5);margin-bottom:8px;';
          header.textContent = '📄 ' + filePath;
          leftCol.appendChild(header);

          const sub = document.createElement('div');
          sub.style.cssText = 'color:var(--text-muted,#6e7681);margin-bottom:10px;';
          sub.textContent = `${body.milestones.length} milestone${body.milestones.length === 1 ? '' : 's'} touched this file`;
          leftCol.appendChild(sub);

          // Right: selected milestone's docs list.
          const rightCol = document.createElement('div');
          rightCol.style.cssText = 'overflow:auto;padding-left:8px;';
          const rightDefault = document.createElement('div');
          rightDefault.style.color = 'var(--text-muted,#6e7681)';
          rightDefault.textContent = 'Click a milestone to see its planning docs';
          rightCol.appendChild(rightDefault);

          for (const m of body.milestones) {
            const card = document.createElement('div');
            card.className = 'atlas-archeology-milestone';
            card.style.cssText =
              'border:1px solid var(--border-subtle,#292e42);border-radius:6px;' +
              'padding:8px 10px;margin-bottom:6px;cursor:pointer;background:var(--bg-secondary,#24283b);' +
              'transition:background 80ms,border-color 80ms;';
            card.addEventListener('mouseenter', () => {
              card.style.background = 'var(--bg-elevated, #2c2f3d)';
              card.style.borderColor = 'var(--accent-blue, #7aa2f7)';
            });
            card.addEventListener('mouseleave', () => {
              card.style.background = 'var(--bg-secondary,#24283b)';
              card.style.borderColor = 'var(--border-subtle,#292e42)';
            });

            const tag = document.createElement('div');
            tag.style.cssText = 'font-family:var(--font-mono);font-weight:600;color:var(--accent-blue,#7aa2f7);';
            // 'unreleased' bucket = commits not yet attributable to a tag.
            // Show a friendlier label.
            tag.textContent = m.milestoneTag === 'unreleased'
              ? 'unreleased (since last tag)'
              : m.milestoneTag;
            card.appendChild(tag);

            const meta = document.createElement('div');
            meta.style.cssText = 'color:var(--text-muted,#6e7681);font-size:11px;margin-top:2px;';
            const date = new Date(m.latestTimestamp).toISOString().slice(0, 10);
            meta.textContent = `${m.commits.length} commit${m.commits.length === 1 ? '' : 's'} · ${date}`;
            card.appendChild(meta);

            const firstCommit = document.createElement('div');
            firstCommit.style.cssText = 'color:var(--text-secondary,#9aa5ce);font-size:11px;margin-top:4px;';
            firstCommit.textContent = m.commits[0]?.subject ?? '';
            card.appendChild(firstCommit);

            card.addEventListener('click', () => {
              void loadMilestoneDocs(m, rightCol);
            });
            leftCol.appendChild(card);
          }

          root.appendChild(leftCol);
          root.appendChild(rightCol);
          fileArcheologyEl.innerHTML = '';
          fileArcheologyEl.appendChild(root);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[atlas] file-history fetch failed:', e);
          fileArcheologyEl.innerHTML =
            '<div style="color:#f87171;">Failed to load file history.</div>';
        }
      }

      async function loadMilestoneDocs(
        m: { milestoneTag: string; commits: Array<{ sha: string; subject: string; timestamp: number }> },
        rightCol: HTMLElement,
      ): Promise<void> {
        rightCol.innerHTML =
          '<div style="color:var(--text-muted,#6e7681);">Loading mission docs for ' +
          escapeText(m.milestoneTag) + '…</div>';
        try {
          const resp = await fetch(
            '/api/atlas/mission-docs?milestoneTag=' + encodeURIComponent(m.milestoneTag),
          );
          const body = await resp.json() as {
            ok: boolean;
            milestoneTag: string;
            missionDir: string | null;
            categorized: { brief: string | null; spec: string | null; plan: string | null; retro: string | null };
            docs: Array<{ path: string; name: string }>;
          };

          rightCol.innerHTML = '';
          const head = document.createElement('div');
          head.style.cssText = 'font-weight:600;color:var(--text-primary,#c0caf5);margin-bottom:8px;font-family:var(--font-mono);';
          head.textContent = m.milestoneTag;
          rightCol.appendChild(head);

          if (!body.ok || !body.missionDir) {
            const none = document.createElement('div');
            none.style.color = 'var(--text-muted,#6e7681)';
            none.textContent = 'No matching mission directory in .planning/missions/';
            rightCol.appendChild(none);
          } else {
            const dirEl = document.createElement('div');
            dirEl.style.cssText = 'color:var(--text-muted,#6e7681);font-size:11px;margin-bottom:10px;font-family:var(--font-mono);';
            dirEl.textContent = body.missionDir + '/';
            rightCol.appendChild(dirEl);

            // Categorized links.
            const cats: Array<[string, string | null]> = [
              ['Brief', body.categorized.brief],
              ['Spec', body.categorized.spec],
              ['Plan', body.categorized.plan],
              ['Retro', body.categorized.retro],
            ];
            const catRow = document.createElement('div');
            catRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;';
            for (const [label, p] of cats) {
              const btn = document.createElement('button');
              btn.textContent = label;
              btn.disabled = !p;
              btn.style.cssText =
                'background:var(--bg-secondary,#24283b);color:var(--text-primary,#c0caf5);' +
                'border:1px solid var(--border-subtle,#292e42);border-radius:4px;padding:3px 8px;' +
                'font-size:11px;cursor:' + (p ? 'pointer' : 'default') + ';' +
                'opacity:' + (p ? '1' : '0.4') + ';';
              if (p) {
                btn.addEventListener('click', () => {
                  void loadFileIntoCodeView(p, 1);
                });
              }
              catRow.appendChild(btn);
            }
            rightCol.appendChild(catRow);

            // All docs list.
            const docHead = document.createElement('div');
            docHead.style.cssText = 'color:var(--text-muted,#6e7681);font-size:11px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;';
            docHead.textContent = `All docs (${body.docs.length})`;
            rightCol.appendChild(docHead);

            for (const d of body.docs) {
              const link = document.createElement('div');
              const trimmed = d.path.replace(body.missionDir + '/', '');
              link.style.cssText =
                'color:var(--accent-blue,#7aa2f7);font-family:var(--font-mono);font-size:11px;' +
                'cursor:pointer;padding:2px 0;';
              link.textContent = trimmed;
              link.addEventListener('click', () => {
                void loadFileIntoCodeView(d.path, 1);
              });
              rightCol.appendChild(link);
            }
          }

          // Commit list.
          const ch = document.createElement('div');
          ch.style.cssText = 'color:var(--text-muted,#6e7681);font-size:11px;margin:14px 0 4px;text-transform:uppercase;letter-spacing:0.05em;';
          ch.textContent = `Commits (${m.commits.length})`;
          rightCol.appendChild(ch);
          for (const c of m.commits) {
            const row = document.createElement('div');
            row.style.cssText = 'font-family:var(--font-mono);font-size:11px;color:var(--text-secondary,#9aa5ce);padding:2px 0;';
            row.title = c.sha;
            const sha = document.createElement('span');
            sha.style.color = 'var(--text-muted,#6e7681)';
            sha.textContent = c.sha.slice(0, 8) + ' ';
            row.appendChild(sha);
            row.appendChild(document.createTextNode(c.subject));
            rightCol.appendChild(row);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[atlas] mission-docs fetch failed:', e);
          rightCol.innerHTML = '<div style="color:#f87171;">Failed to load mission docs.</div>';
        }
      }

      function hideFileArcheology(): void {
        fileArcheologyEl.style.display = 'none';
      }

      function escapeText(s: string): string {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
      }

      // Hook the coordinator: file focus → show archeology overlay; mission
      // focus → hide it (let the original archeology view take over).
      const unArcheologyHook = coordinator.subscribe((focus) => {
        if (!focus) return;
        if (focus.kind === 'file') {
          void renderFileArcheology(focus.id);
        } else if (focus.kind === 'mission') {
          hideFileArcheology();
        }
      });
      unregisterFns.push(unArcheologyHook);

      // ── Code View ───────────────────────────────────────────────────────
      const { pane: cvPane, body: cvBody } = makePane('code-view', 'Code View');
      let cv: CodeViewComponent | null = createCodeView({
        snapshotId: '' as never,
        filePath: '',
        source: '// Select a file to view source.',
        fetchProvenance: (sid, fp, ln) =>
          intelligenceIpc.listProvenanceForLine(sid, fp, ln),
        fetchSymbol: (id) => intelligenceIpc.getSymbol(id),
      });
      cv.mount(cvBody);
      // Track which file is currently loaded into cv so symbol-focus can
      // skip the fetch+remount when the symbol's file is already up.
      let cvLoadedFile = '';

      async function loadFileIntoCodeView(filePath: string, line: number): Promise<void> {
        if (cvLoadedFile === filePath) {
          cv?.setFocus({ file: filePath, line });
          return;
        }
        try {
          // Fetch source + blame in parallel; blame is best-effort (returns
          // {ok:false} for files outside git or pre-tag commits).
          const [sourceResp, blameResp] = await Promise.all([
            fetch('/api/atlas/source?path=' + encodeURIComponent(filePath)),
            fetch('/api/atlas/file-blame?path=' + encodeURIComponent(filePath)).catch(() => null),
          ]);
          if (!sourceResp.ok) throw new Error(`source ${sourceResp.status}`);
          const sourceBody = await sourceResp.json() as { source: string };

          // Parse blame into a per-line milestoneTag map for the gutter.
          const blameByLine = new Map<number, { milestoneTag: string; sha: string; summary: string }>();
          if (blameResp && blameResp.ok) {
            const blameBody = await blameResp.json().catch(() => null) as
              | { ok: boolean; lines?: Array<{ lineNo: number; sha: string; milestoneTag: string; summary: string }> }
              | null;
            if (blameBody?.ok && Array.isArray(blameBody.lines)) {
              for (const ln of blameBody.lines) {
                blameByLine.set(ln.lineNo, {
                  milestoneTag: ln.milestoneTag,
                  sha: ln.sha,
                  summary: ln.summary,
                });
              }
            }
          }

          cv?.unmount();
          cv = createCodeView({
            snapshotId: (loadedSnapshotId ?? '') as never,
            filePath,
            source: sourceBody.source,
            // Override fetchProvenance: synthesize per-line records from
            // blame so each line gets a single milestone-tag badge in the
            // gutter (the dominant attribution the W4d.3 spec asks for).
            fetchProvenance: async (_sid, _fp, lineNo) => {
              const b = blameByLine.get(lineNo);
              if (!b) return [];
              // The gutter expects an AtlasMissionProvenance shape; we use a
              // structural cast (intersection adds blame-only fields). The
              // gutter's tooltip renderer (W4d.3) reads commit_sha + summary
              // when present so blame badges show "v1.49.NNN  ab12cd34\nfeat:
              // …" instead of just the milestone tag.
              const tag = b.milestoneTag && b.milestoneTag !== 'unreleased'
                ? b.milestoneTag
                : 'unreleased';
              return [{
                id: `blame-${lineNo}`,
                snapshot_id: '',
                file_path: filePath,
                line_no: lineNo,
                mission_id: tag,
                commit_sha: b.sha,
                weight: 1.0,
                // Non-canonical fields read by gutter renderer when available.
                summary: b.summary,
              } as unknown as never];
            },
            fetchSymbol: (id) => intelligenceIpc.getSymbol(id),
          });
          cv.mount(cvBody);
          cvLoadedFile = filePath;
          if (loadedSnapshotId) {
            intelligenceIpc.listSymbolsForFile(loadedSnapshotId as never, filePath)
              .then((rows) => cv?.bindSymbols(rows))
              .catch(() => { /* IPC unavailable in tests */ });
          }
          cv.setFocus({ file: filePath, line });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[atlas] code-view source fetch failed:', e);
        }
      }

      // Mutable wrapper: re-create the code-view on file focus so source loads.
      const cvWrapper: CoordinatedView = {
        setFocus(focus: Focus): void {
          if (focus.kind === 'file') {
            void loadFileIntoCodeView(focus.id, 1);
          } else if (focus.kind === 'symbol') {
            // Resolve symbol → its file_path + start_line; load that file
            // into the code-view (no-op if already loaded) and scroll +
            // flash-highlight the symbol's start line.
            intelligenceIpc.getSymbol(focus.id)
              .then((sym) => {
                if (!sym) return;
                return loadFileIntoCodeView(sym.file_path, sym.start_line);
              })
              .catch(() => { /* IPC unavailable in tests */ });
          }
        },
      };
      const unCv = coordinator.registerView(cvWrapper);
      unregisterFns.push(unCv);
      unregisterFns.push(() => { cv?.unmount(); cv = null; });

      // ── Status pane ──────────────────────────────────────────────────────
      const { pane: stPane } = makePane('status', '');
      const unStatus = coordinator.subscribe((focus) => {
        const statusEl = stPane.querySelector<HTMLElement>('.atlas-pane-body');
        if (!statusEl || !focus) return;
        // Render a richer status line: kind icon + path + symbol count + (for
        // symbols) qualified name. Async-resolves details via IPC; falls back
        // to bare text on failure.
        const sid = loadedSnapshotId;
        statusEl.textContent = `${focus.kind}: ${focus.id}`;
        if (focus.kind === 'file' && sid) {
          intelligenceIpc.listSymbolsForFile(sid as never, focus.id)
            .then((rows) => {
              const kinds = new Map<string, number>();
              for (const r of rows) kinds.set(r.kind, (kinds.get(r.kind) ?? 0) + 1);
              const breakdown = [...kinds.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => `${n} ${k}`)
                .join(', ');
              statusEl.textContent = `📄 ${focus.id} — ${rows.length} symbol${rows.length === 1 ? '' : 's'}${breakdown ? ' · ' + breakdown : ''}`;
            })
            .catch(() => { /* keep bare text */ });
        } else if (focus.kind === 'symbol' && sid) {
          intelligenceIpc.getSymbol(focus.id)
            .then((sym) => {
              if (!sym) return;
              statusEl.textContent = `🔣 ${sym.qualified_name} (${sym.kind}, ${sym.language}) · ${sym.file_path}:${sym.start_line}`;
            })
            .catch(() => { /* keep bare text */ });
        } else if (focus.kind === 'folder') {
          statusEl.textContent = `📁 ${focus.id}/`;
        } else if (focus.kind === 'mission') {
          statusEl.textContent = `🎯 mission: ${focus.id}`;
        }
      });
      unregisterFns.push(unStatus);

      // ── Palette ───────────────────────────────────────────────────────
      const palette = new SearchPalette(
        {
          onSelect: (entry) => {
            const kind = entry.kind === 'symbol'
              ? 'symbol'
              : entry.kind === 'mission' ? 'mission' : 'file';
            coordinator.dispatch({ kind, id: entry.id });
            palette.close();
          },
        },
        { parent: shellEl },
      );

      // Cmd-K handler + palette atlas-state auto-population
      const onKeyDown = (e: KeyboardEvent): void => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          if (palette.isOpen()) {
            palette.close();
          } else {
            palette.openPalette();
            void fetchAndPopulateAtlasState(palette);
          }
        }
        if (e.key === 'Escape' && palette.isOpen()) {
          palette.close();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      unregisterFns.push(() => document.removeEventListener('keydown', onKeyDown));

      // Invalidate atlas-state cache on indexing.completed and trigger
      // Rust-side connection cache invalidation (G2 event-driven wiring).
      intelligenceIpc.on.atlasIndexingCompleted((e) => {
        invalidateAtlasStateCache();
        const projectId = e?.payload?.project_id as string | undefined;
        const invalidate = (intelligenceIpc as { invalidateCache?: (id?: string) => Promise<unknown> }).invalidateCache;
        if (typeof invalidate === 'function') {
          invalidate(projectId).catch(() => {
            // Rust-side invalidation is best-effort; IPC unavailable in tests.
          });
        }
      }).then((unsub) => {
        unregisterFns.push(unsub);
      }).catch(() => { /* IPC unavailable in tests */ });

      // ── Splitters ────────────────────────────────────────────────────────
      const colSplitter = makeSplitter('col');
      const rowTopSplitter = makeSplitter('row-top');
      const rowMidSplitter = makeSplitter('row-mid');

      // Seed aria-valuenow
      colSplitter.setAttribute('aria-valuenow', String(Math.round(colLeft)));
      colSplitter.setAttribute('aria-valuemin', '10');
      colSplitter.setAttribute('aria-valuemax', '90');
      rowTopSplitter.setAttribute('aria-valuenow', String(Math.round(rowTop)));
      rowTopSplitter.setAttribute('aria-valuemin', '10');
      rowTopSplitter.setAttribute('aria-valuemax', '80');
      rowMidSplitter.setAttribute('aria-valuenow', String(Math.round(rowMid)));
      rowMidSplitter.setAttribute('aria-valuemin', '5');
      rowMidSplitter.setAttribute('aria-valuemax', '80');

      attachSplitter(colSplitter, 'col');
      attachSplitter(rowTopSplitter, 'row-top');
      attachSplitter(rowMidSplitter, 'row-mid');

      attachSplitterKeyboard(colSplitter, 'col');
      attachSplitterKeyboard(rowTopSplitter, 'row-top');
      attachSplitterKeyboard(rowMidSplitter, 'row-mid');

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      unregisterFns.push(() => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      });

      // ── Assemble ────────────────────────────────────────────────────────
      shellEl.appendChild(smPane);
      shellEl.appendChild(sgPane);
      shellEl.appendChild(avPane);
      shellEl.appendChild(stPane);
      shellEl.appendChild(cvPane);
      shellEl.appendChild(colSplitter);
      shellEl.appendChild(rowTopSplitter);
      shellEl.appendChild(rowMidSplitter);

      host.appendChild(shellEl);
    },

    unmount(): void {
      // Flush any pending layout save before tearing down.
      if (saveDebounceTimer !== null) {
        clearTimeout(saveDebounceTimer);
        saveDebounceTimer = null;
      }
      flushSave();

      graphView?.dispose();
      graphView = null;
      graphCanvas = null;
      systemMapRef = null;
      loadedSnapshotId = null;

      for (const fn of unregisterFns) fn();
      unregisterFns.length = 0;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      shellEl?.parentElement?.removeChild(shellEl);
      shellEl = null;
      hostEl = null;
    },

    async loadSnapshot(snapshotId: string): Promise<number> {
      if (!systemMapRef) return 0;
      // Page through symbols until the snapshot is fully covered; dedup file
      // paths in a Set. Page size mirrors SymbolsKB's default (500) but caller
      // can use bridge command directly with bigger limit if needed.
      const PAGE = 5000;
      const seenFiles = new Set<string>();
      let offset = 0;
      // Safety cap — a single snapshot in this codebase is < 500K symbols.
      const MAX_PAGES = 200;
      for (let i = 0; i < MAX_PAGES; i++) {
        const rows = await intelligenceIpc.listSymbolsInSnapshot(snapshotId, {
          limit: PAGE,
          offset,
        });
        if (rows.length === 0) break;
        for (const r of rows) seenFiles.add(r.file_path);
        if (rows.length < PAGE) break;
        offset += PAGE;
      }
      const filePaths = [...seenFiles].sort();
      if (filePaths.length === 0) return 0;
      await systemMapRef.load(snapshotId, filePaths);
      loadedSnapshotId = snapshotId;
      // Seed the symbol graph with a snapshot-wide overview so the right pane
      // isn't empty until the user clicks a file. The view is constructed
      // inside a 2-rAF defer (canvas-sizing wait), so retry up to 1.5s in
      // 100ms ticks until graphView is available before giving up.
      let attempts = 0;
      const tryGraphSeed = (): void => {
        attempts++;
        if (graphView) {
          // eslint-disable-next-line no-console
          console.log('[atlas] Seeding symbol graph with snapshot', snapshotId);
          graphView
            .setFocus({ snapshotId: snapshotId as never })
            .then(() => console.log('[atlas] Symbol graph seed completed'))
            .catch((e) => console.warn('[atlas] Symbol graph seed failed:', e));
          return;
        }
        if (attempts < 15) setTimeout(tryGraphSeed, 100);
        else console.warn('[atlas] graphView never became available — symbol graph empty');
      };
      tryGraphSeed();
      return filePaths.length;
    },
  };
}
