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
          // Resolve the file's first non-import symbol and focus on it so the
          // graph shows that file's call neighborhood.
          intelligenceIpc.listSymbolsForFile(sid as never, focus.id)
            .then((rows) => {
              const pick = rows.find((r) => r.kind !== 'import') ?? rows[0];
              if (!pick) return;
              return sg.setFocus({ snapshotId: sid as never, symbolId: pick.id });
            })
            .catch(() => { /* IPC unavailable in tests */ });
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
      // Mutable wrapper: re-create the code-view on file focus so source loads.
      const cvWrapper: CoordinatedView = {
        setFocus(focus: Focus): void {
          if (focus.kind === 'file') {
            // Fetch source via the dashboard's /api/atlas/source helper, then
            // mount a fresh CodeView. (createCodeView's source/filePath are
            // captured at construction; recreating is the cheapest way to
            // re-render without refactoring the component's internal state.)
            void (async () => {
              try {
                const resp = await fetch(
                  '/api/atlas/source?path=' + encodeURIComponent(focus.id),
                );
                if (!resp.ok) throw new Error(`source ${resp.status}`);
                const body = await resp.json() as { source: string };
                cv?.unmount();
                cv = createCodeView({
                  snapshotId: (loadedSnapshotId ?? '') as never,
                  filePath: focus.id,
                  source: body.source,
                  fetchProvenance: (sid, fp, ln) =>
                    intelligenceIpc.listProvenanceForLine(sid, fp, ln),
                  fetchSymbol: (id) => intelligenceIpc.getSymbol(id),
                });
                cv.mount(cvBody);
                if (loadedSnapshotId) {
                  intelligenceIpc.listSymbolsForFile(loadedSnapshotId as never, focus.id)
                    .then((rows) => cv?.bindSymbols(rows))
                    .catch(() => { /* IPC unavailable in tests */ });
                }
                cv.setFocus({ file: focus.id, line: 1 });
              } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[atlas] code-view source fetch failed:', e);
              }
            })();
          } else if (focus.kind === 'symbol') {
            cv?.setFocus({ file: '', line: 1, symbol_id: focus.id });
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
