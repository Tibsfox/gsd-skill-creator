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

export interface AtlasShellOptions {
  coordinator?: Coordinator;
}

export interface AtlasShell {
  mount(host: HTMLElement): void;
  unmount(): void;
  coordinator: Coordinator;
}

export function createAtlasShell(opts: AtlasShellOptions = {}): AtlasShell {
  const coordinator = opts.coordinator ?? createCoordinator();

  let hostEl: HTMLElement | null = null;
  let shellEl: HTMLDivElement | null = null;
  let graphCanvas: HTMLCanvasElement | null = null;
  let graphView: SymbolGraphView | null = null;

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

  function wrapCodeView(cv: CodeViewComponent): CoordinatedView {
    return {
      setFocus(focus: Focus): void {
        if (focus.kind === 'file') {
          cv.setFocus({ file: focus.id, line: 1 });
        } else if (focus.kind === 'symbol') {
          cv.setFocus({ file: '', line: 1, symbol_id: focus.id });
        }
      },
    };
  }

  // ── Symbol graph adapter ───────────────────────────────────────────────────

  function wrapSymbolGraph(sg: SymbolGraphView): CoordinatedView {
    return {
      setFocus(focus: Focus): void {
        // Graph setFocus is async; no-op if kind mismatch
        if (focus.kind === 'symbol') {
          // We need a snapshotId — pass empty string as placeholder
          sg.setFocus({ snapshotId: '' as any, symbolId: focus.id }).catch(() => {});
        }
      },
    };
  }

  // ── mount / unmount ────────────────────────────────────────────────────────

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
      const sm = createSystemMap();
      sm.mount(smBody);
      const smWrapper = wrapSystemMap(sm);
      const unSm = coordinator.registerView(smWrapper);
      unregisterFns.push(unSm);
      sm.onSelect((f: SmFocus) => {
        if (f.kind === null) return;
        coordinator.dispatch(f as Focus, smWrapper);
      });

      // ── Symbol Graph ────────────────────────────────────────────────────
      const { pane: sgPane, body: sgBody } = makePane('symbol-graph', 'Symbol Graph');
      graphCanvas = document.createElement('canvas');
      graphCanvas.style.cssText = 'width:100%;height:100%;display:block;';
      sgBody.appendChild(graphCanvas);

      let sgView: SymbolGraphView | null = null;
      let sgWrapper: CoordinatedView | null = null;
      // Defer construction until paint so canvas has dimensions
      requestAnimationFrame(() => {
        if (!graphCanvas || !shellEl) return;
        try {
          sgView = new SymbolGraphView(graphCanvas);
          graphView = sgView;
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
          // Replay current focus
          const cur = coordinator.current();
          if (cur) sgWrapper.setFocus(cur);
        } catch {
          // WebGL2 unavailable (e.g. jsdom) — skip
        }
      });

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
      const cv = createCodeView({
        snapshotId: '' as any,
        filePath: '',
        source: '// Select a file to view source.',
        fetchProvenance: (sid, fp, ln) =>
          intelligenceIpc.listProvenanceForLine(sid, fp, ln),
        fetchSymbol: (id) => intelligenceIpc.getSymbol(id),
      });
      cv.mount(cvBody);
      const cvWrapper = wrapCodeView(cv);
      const unCv = coordinator.registerView(cvWrapper);
      unregisterFns.push(unCv);

      // ── Status pane ──────────────────────────────────────────────────────
      const { pane: stPane } = makePane('status', '');
      const unStatus = coordinator.subscribe((focus) => {
        const statusEl = stPane.querySelector('.atlas-pane-body');
        if (statusEl && focus) {
          statusEl.textContent = `${focus.kind}: ${focus.id}`;
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

      // Invalidate atlas-state cache on indexing.completed
      intelligenceIpc.on.atlasIndexingCompleted(() => {
        invalidateAtlasStateCache();
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
      graphView?.dispose();
      graphView = null;
      graphCanvas = null;

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
  };
}
