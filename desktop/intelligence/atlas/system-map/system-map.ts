/**
 * System Map — hierarchical circle-pack view of the codebase by folder.
 *
 * Renders nested SVG circles from the W0.5 pack-layout primitive.
 * Pointer events: left-click → zoom in; right-click / contextmenu → zoom out.
 * Exposes setFocus(focus) and onSelect(handler) API for shell integration (W3).
 */

import { wangWangPack } from '../../../../src/atlas/pack-layout/index.js';
import type { CircleNode } from '../../../../src/atlas/pack-layout/index.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';
import type { SnapshotId } from '../../../../src/intelligence/types.js';
import {
  buildFolderTree,
  buildFolderTreeMulti,
  packConfig,
  subTreeAt,
  type BuildOptions,
  type FileData,
  type NodePayload,
} from './layouts.js';
import {
  buildColorContext,
  colorFor,
  missionHue,
  type ColorContext,
  type ColorMode,
} from './color-modes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Cross-view selection state (consumed from and emitted to the W3 shell). */
export interface Focus {
  kind: 'file' | 'folder' | 'symbol' | 'mission' | null;
  id: string;
}

/** Handler called whenever the user selects a node. */
export type SelectHandler = (focus: Focus) => void;

export interface SystemMapOptions extends BuildOptions {
  /** Initial color mode. Default: 'symbol-density'. */
  colorMode?: ColorMode;
  /** Width of the SVG viewport. Default: container clientWidth or 800. */
  width?: number;
  /** Height of the SVG viewport. Default: container clientHeight or 600. */
  height?: number;
}

/** Collect all CircleNode payloads via BFS. */
function collectPayloads(root: CircleNode<NodePayload>): Array<NodePayload | undefined> {
  const out: Array<NodePayload | undefined> = [];
  const queue: CircleNode<NodePayload>[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    out.push(node.data);
    if (node.children) queue.push(...node.children);
  }
  return out;
}

/** Legend entry passed to host when provenance-overlay is active. */
export interface LegendEntry {
  missionId: string;
  color: string;
  count: number;
}

export type ColorModeChangeHandler = (mode: ColorMode) => void;

export interface SystemMapComponent {
  mount(parent: HTMLElement): void;
  unmount(): void;
  /** Set the currently highlighted selection from an external shell. */
  setFocus(focus: Focus): void;
  /** Register a callback fired when the user clicks a circle. */
  onSelect(handler: SelectHandler): void;
  /** Load and render data for the given snapshot + file list. */
  load(snapshotId: SnapshotId, filePaths: string[]): Promise<void>;
  /**
   * Load union data for multiple projects in parallel.
   *
   * Each project fetches its file symbols independently (chunks of 8 concurrent
   * requests). The resulting trees are merged via buildFolderTreeMulti into a
   * synthetic root with one child pack per project.
   *
   * projectIds beyond MAX_SELECTED_PROJECTS are silently dropped (the picker
   * already enforces the limit; this is defense-in-depth).
   */
  setSelectedProjects(
    projectIds: string[],
    snapshotId: SnapshotId,
    filePathsByProject: Map<string, string[]>,
  ): Promise<void>;
  /** Switch color mode without reloading data. */
  setColorMode(mode: ColorMode): void;
  /** Register a callback fired when setColorMode is called. Returns unregister fn. */
  onColorModeChange(handler: ColorModeChangeHandler): () => void;
  /**
   * Mount the provenance legend into the given container element.
   * The host shell is responsible for placement (typically top-right of the pane).
   * Call before or after load(); legend updates whenever setColorMode is called.
   * Returns a cleanup function.
   */
  mountLegend(container: HTMLElement, maxEntries?: number): () => void;
  /** Current legend entries (empty when mode is not 'provenance-overlay'). */
  getLegendEntries(maxEntries?: number): LegendEntry[];
  /**
   * Time-lapse overlay: dim all circles whose file_path is NOT in filesPresent.
   * Pass null to clear the overlay and restore normal rendering.
   */
  setTimeLapseFiles(filesPresent: Set<string> | null): void;
}

const LEGEND_DEFAULT_MAX = 8;

export function createSystemMap(opts: SystemMapOptions = {}): SystemMapComponent {
  let containerEl: HTMLElement | null = null;
  let svgEl: SVGSVGElement | null = null;
  let layerEl: SVGGElement | null = null;
  let breadcrumbEl: HTMLElement | null = null;

  let fileDataCache: FileData[] = [];
  let packedRoot: CircleNode<NodePayload> | null = null;
  let colorCtx: ColorContext | null = null;

  let colorMode: ColorMode = opts.colorMode ?? 'symbol-density';
  let focus: Focus = { kind: null, id: '' };
  let selectHandlers: SelectHandler[] = [];
  let colorModeChangeHandlers: ColorModeChangeHandler[] = [];
  let timeLapseFiles: Set<string> | null = null;

  /** Legend containers registered by mountLegend(). */
  const legendContainers: Array<{ el: HTMLElement; maxEntries: number }> = [];

  /** Stack of folder IDs from root → current view ('' = filesystem root). */
  const zoomStack: string[] = [''];

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function currentFolderId(): string {
    return zoomStack[zoomStack.length - 1];
  }

  function notify(f: Focus): void {
    focus = f;
    for (const h of selectHandlers) h(f);
  }

  function svgText(text: string, x: number, y: number, cls: string): SVGTextElement {
    const el = document.createElementNS(SVG_NS, 'text');
    el.setAttribute('class', cls);
    el.setAttribute('x', String(x));
    el.setAttribute('y', String(y));
    el.textContent = text;
    return el;
  }

  function truncateLabel(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 1) + '…';
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  function renderPack(): void {
    if (!layerEl || !packedRoot || !colorCtx) return;

    const folderId = currentFolderId();
    const subTree = subTreeAt(packedRoot, folderId) ?? packedRoot;

    // Re-pack just the current sub-tree.
    const pOpts = packConfig(opts);
    const vw = opts.width ?? (containerEl?.clientWidth ?? 800);
    const vh = opts.height ?? (containerEl?.clientHeight ?? 600);
    // wangWangPack `size` is the ROOT RADIUS, not the container side. Use half
    // the smaller dimension so the root circle's diameter fits inside the
    // viewport with a 4% margin on each side.
    const size = Math.min(vw, vh) * 0.46;

    // Sync SVG viewBox to current container dimensions so the rendered pack
    // is not clipped by the stale 800×600 box set at mount time. This is the
    // browser-mode fix (W4c) — under the Tauri shell the container is sized
    // before mount runs, so the original viewBox happened to match.
    if (svgEl) {
      svgEl.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    }

    const localTree = buildFolderTree(fileDataCache);
    const subInput = subTreeAt(localTree, folderId) ?? localTree;
    const packed = wangWangPack(subInput, { ...pOpts, size });
    const cx = vw / 2;
    const cy = vh / 2;

    layerEl.innerHTML = '';
    renderNode(packed, cx, cy, layerEl, colorCtx, opts.labelCutoffRadius ?? 12, 0);
  }

  function renderNode(
    node: CircleNode<NodePayload>,
    cx: number,
    cy: number,
    parent: SVGElement,
    ctx: ColorContext,
    labelCutoff: number,
    depth: number,
  ): void {
    const fill = colorFor(colorMode, node, ctx);
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'system-map-node');

    const circle = document.createElementNS(SVG_NS, 'circle');
    const absX = cx + node.x;
    const absY = cy + node.y;
    circle.setAttribute('cx', String(absX));
    circle.setAttribute('cy', String(absY));
    circle.setAttribute('r', String(Math.max(1, node.r)));
    circle.setAttribute('fill', fill);
    circle.setAttribute('class', 'system-map-circle');
    if (node.id === focus.id) circle.classList.add('system-map-circle--selected');
    if (timeLapseFiles !== null && node.data?.kind !== 'folder' && !timeLapseFiles.has(node.id)) {
      circle.classList.add('system-map-circle--time-lapse-absent');
    }
    circle.setAttribute('data-id', node.id);

    const isFolder = node.data?.kind === 'folder' || (node.children && node.children.length > 0);
    circle.setAttribute('role', 'button');
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('aria-label', (isFolder ? 'folder ' : 'file ') + (node.id.split('/').pop() ?? node.id));

    // Native SVG <title> tooltip — shows on hover, no JS or extra DOM needed.
    // Surfaces full path + symbol count + dominant mission (when present).
    const title = document.createElementNS(SVG_NS, 'title');
    const symCount = node.data?.symbolCount ?? 0;
    const missionPart = node.data?.dominantMissionId
      ? ` · mission ${node.data.dominantMissionId}`
      : '';
    const kindLabel = isFolder ? 'folder' : 'file';
    title.textContent = `${node.id} (${kindLabel}, ${symCount} symbol${symCount === 1 ? '' : 's'})${missionPart}`;
    g.appendChild(title);

    function activate(e: Event): void {
      e.stopPropagation();
      if (isFolder) {
        zoomStack.push(node.id);
        renderPack();
        updateBreadcrumb();
        notify({ kind: 'folder', id: node.id });
      } else {
        notify({ kind: 'file', id: node.id });
      }
    }

    // Pointer events
    circle.addEventListener('click', activate);

    circle.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate(e);
      }
    });

    circle.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      zoomOut();
    });

    g.appendChild(circle);

    if (node.r >= labelCutoff) {
      const baseName = node.id.split('/').pop() ?? node.id;
      const maxChars = Math.floor(node.r / 4.5);
      const label = truncateLabel(baseName, Math.max(3, maxChars));
      const cls = node.data?.kind === 'folder'
        ? 'system-map-label system-map-label--folder'
        : 'system-map-label';
      g.appendChild(svgText(label, absX, absY, cls));
    }

    parent.appendChild(g);

    if (node.children) {
      for (const child of node.children) {
        renderNode(child, cx, cy, parent, ctx, labelCutoff, depth + 1);
      }
    }
  }

  function zoomOut(): void {
    if (zoomStack.length > 1) {
      zoomStack.pop();
      renderPack();
      updateBreadcrumb();
    }
  }

  function updateBreadcrumb(): void {
    if (!breadcrumbEl) return;
    breadcrumbEl.textContent = '';

    // Always-visible "←" back button (greyed out at root). Cheaper than the
    // right-click contextmenu zoom-out which users couldn't discover.
    const back = document.createElement('button');
    back.className = 'system-map-back';
    back.textContent = '←';
    back.setAttribute('aria-label', 'zoom out one level');
    back.disabled = zoomStack.length <= 1;
    back.addEventListener('click', (e) => {
      e.stopPropagation();
      zoomOut();
    });
    breadcrumbEl.appendChild(back);

    // Clickable path segments. Click any segment to jump up to that level.
    const path = zoomStack.filter(Boolean);
    const root = document.createElement('span');
    root.className = 'system-map-breadcrumb-seg' + (path.length === 0 ? ' is-current' : '');
    root.textContent = '/';
    if (path.length > 0) {
      root.addEventListener('click', () => {
        zoomStack.length = 1;
        zoomStack[0] = '';
        renderPack();
        updateBreadcrumb();
      });
    }
    breadcrumbEl.appendChild(root);

    path.forEach((seg, i) => {
      const sep = document.createElement('span');
      sep.className = 'system-map-breadcrumb-sep';
      sep.textContent = i === 0 ? '' : '/';
      breadcrumbEl!.appendChild(sep);
      const segEl = document.createElement('span');
      const isCurrent = i === path.length - 1;
      segEl.className = 'system-map-breadcrumb-seg' + (isCurrent ? ' is-current' : '');
      segEl.textContent = seg.split('/').pop() ?? seg;
      if (!isCurrent) {
        segEl.addEventListener('click', () => {
          zoomStack.length = i + 2; // root sentinel + path[0..i]
          renderPack();
          updateBreadcrumb();
        });
      }
      breadcrumbEl!.appendChild(segEl);
    });
  }

  // ─── Legend helpers ────────────────────────────────────────────────────────

  function buildLegendEntries(files: FileData[], maxEntries: number): LegendEntry[] {
    if (colorMode !== 'provenance-overlay') return [];
    const counts = new Map<string, number>();
    for (const f of files) {
      if (f.dominantMissionId) {
        counts.set(f.dominantMissionId, (counts.get(f.dominantMissionId) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxEntries)
      .map(([missionId, count]) => ({
        missionId,
        color: `hsl(${missionHue(missionId)},70%,42%)`,
        count,
      }));
  }

  function renderLegend(container: HTMLElement, entries: LegendEntry[], maxEntries: number): void {
    container.innerHTML = '';
    if (colorMode !== 'provenance-overlay' || entries.length === 0) return;

    container.className = 'system-map-legend';
    const totalUnique = fileDataCache.filter(f => f.dominantMissionId).reduce((acc, f) => {
      if (f.dominantMissionId) acc.add(f.dominantMissionId);
      return acc;
    }, new Set<string>()).size;

    for (const entry of entries) {
      const row = document.createElement('div');
      row.className = 'system-map-legend-row';

      const swatch = document.createElement('span');
      swatch.className = 'system-map-legend-swatch';
      swatch.style.background = entry.color;

      const label = document.createElement('span');
      label.className = 'system-map-legend-label';
      label.textContent = entry.missionId;
      label.title = entry.missionId;

      row.appendChild(swatch);
      row.appendChild(label);
      container.appendChild(row);
    }

    const overflow = totalUnique - maxEntries;
    if (overflow > 0) {
      const more = document.createElement('div');
      more.className = 'system-map-legend-overflow';
      more.textContent = `+${overflow} more`;
      container.appendChild(more);
    }
  }

  function updateAllLegends(): void {
    for (const { el, maxEntries } of legendContainers) {
      renderLegend(el, buildLegendEntries(fileDataCache, maxEntries), maxEntries);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    mount(parent: HTMLElement): void {
      containerEl = document.createElement('div');
      containerEl.className = 'system-map-container';

      const vw = opts.width ?? (parent.clientWidth || 800);
      const vh = opts.height ?? (parent.clientHeight || 600);

      svgEl = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
      svgEl.setAttribute('class', 'system-map-svg');
      svgEl.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      svgEl.setAttribute('role', 'img');
      svgEl.setAttribute('aria-label', 'Codebase system map');

      layerEl = document.createElementNS(SVG_NS, 'g') as SVGGElement;
      layerEl.setAttribute('class', 'system-map-layer');
      svgEl.appendChild(layerEl);

      containerEl.appendChild(svgEl);

      breadcrumbEl = document.createElement('div');
      breadcrumbEl.className = 'system-map-breadcrumb';
      breadcrumbEl.textContent = '/';
      containerEl.appendChild(breadcrumbEl);

      parent.appendChild(containerEl);
    },

    unmount(): void {
      selectHandlers = [];
      containerEl?.parentElement?.removeChild(containerEl);
      containerEl = null;
      svgEl = null;
      layerEl = null;
      breadcrumbEl = null;
    },

    setFocus(f: Focus): void {
      focus = f;
      if (!layerEl) return;
      // Update selected ring without full re-render.
      layerEl.querySelectorAll('.system-map-circle--selected').forEach(el => {
        el.classList.remove('system-map-circle--selected');
      });
      if (f.id) {
        // CSS.escape not available in all environments; use attribute equality selector directly.
        const escaped = f.id.replace(/"/g, '\\"');
        layerEl.querySelector(`[data-id="${escaped}"]`)
          ?.classList.add('system-map-circle--selected');
      }
    },

    onSelect(handler: SelectHandler): void {
      selectHandlers.push(handler);
    },

    async load(snapshotId: SnapshotId, filePaths: string[]): Promise<void> {
      const BATCH = 20;
      const results: FileData[] = [];
      for (let i = 0; i < filePaths.length; i += BATCH) {
        const batch = filePaths.slice(i, i + BATCH);
        const settled = await Promise.allSettled(
          batch.map(async (fp): Promise<FileData> => {
            const [symbols, attributions] = await Promise.all([
              intelligenceIpc.listSymbolsForFile(snapshotId, fp),
              intelligenceIpc.listMissionsForFile(snapshotId, fp).catch(() => []),
            ]);
            const sorted = [...attributions].sort((a, b) => b.weight - a.weight);
            const dominantMissionId = sorted[0]?.mission_id ?? null;
            return {
              filePath: fp,
              symbols,
              recentActivityAt: 0,
              missionIds: sorted.map(m => m.mission_id),
              dominantMissionId,
              missionAttributions: sorted,
            };
          }),
        );
        for (const r of settled) {
          if (r.status === 'fulfilled') results.push(r.value);
        }
      }

      fileDataCache = results;
      const tree = buildFolderTree(results);
      const pOpts = packConfig(opts);
      const vw = opts.width ?? (containerEl?.clientWidth ?? 800);
      const vh = opts.height ?? (containerEl?.clientHeight ?? 600);
      // wangWangPack `size` is the ROOT RADIUS, not the container side. Use half
    // the smaller dimension so the root circle's diameter fits inside the
    // viewport with a 4% margin on each side.
    const size = Math.min(vw, vh) * 0.46;
      packedRoot = wangWangPack(tree, { ...pOpts, size });
      colorCtx = buildColorContext(collectPayloads(packedRoot));

      renderPack();
      updateBreadcrumb();
      updateAllLegends();
    },

    async setSelectedProjects(
      projectIds: string[],
      snapshotId: SnapshotId,
      filePathsByProject: Map<string, string[]>,
    ): Promise<void> {
      const CHUNK = 8;

      async function fetchProjectFiles(filePaths: string[]): Promise<FileData[]> {
        const results: FileData[] = [];
        for (let i = 0; i < filePaths.length; i += CHUNK) {
          const batch = filePaths.slice(i, i + CHUNK);
          const settled = await Promise.allSettled(
            batch.map(async (fp): Promise<FileData> => {
              const [symbols, attributions] = await Promise.all([
                intelligenceIpc.listSymbolsForFile(snapshotId, fp),
                intelligenceIpc.listMissionsForFile(snapshotId, fp).catch(() => []),
              ]);
              const sorted = [...attributions].sort((a, b) => b.weight - a.weight);
              return {
                filePath: fp,
                symbols,
                recentActivityAt: 0,
                missionIds: sorted.map(m => m.mission_id),
                dominantMissionId: sorted[0]?.mission_id ?? null,
                missionAttributions: sorted,
              };
            }),
          );
          for (const r of settled) {
            if (r.status === 'fulfilled') results.push(r.value);
          }
        }
        return results;
      }

      const allProjectData = await Promise.all(
        projectIds.map(async (pid) => {
          const paths = filePathsByProject.get(pid) ?? [];
          const data = await fetchProjectFiles(paths);
          return [pid, data] as [string, FileData[]];
        }),
      );

      const projectMap = new Map(allProjectData);
      const multiTree = buildFolderTreeMulti(projectMap);

      if (multiTree === null) return;

      fileDataCache = allProjectData.flatMap(([, d]) => d);
      const pOpts = packConfig(opts);
      const vw = opts.width ?? (containerEl?.clientWidth ?? 800);
      const vh = opts.height ?? (containerEl?.clientHeight ?? 600);
      // wangWangPack `size` is the ROOT RADIUS, not the container side. Use half
    // the smaller dimension so the root circle's diameter fits inside the
    // viewport with a 4% margin on each side.
    const size = Math.min(vw, vh) * 0.46;
      packedRoot = wangWangPack(multiTree, { ...pOpts, size });
      colorCtx = buildColorContext(collectPayloads(packedRoot));

      renderPack();
      updateBreadcrumb();
      updateAllLegends();
    },

    setColorMode(mode: ColorMode): void {
      colorMode = mode;
      renderPack();
      updateAllLegends();
      for (const h of colorModeChangeHandlers) h(mode);
    },

    onColorModeChange(handler: ColorModeChangeHandler): () => void {
      colorModeChangeHandlers.push(handler);
      return () => {
        colorModeChangeHandlers = colorModeChangeHandlers.filter(h => h !== handler);
      };
    },

    getLegendEntries(maxEntries = LEGEND_DEFAULT_MAX): LegendEntry[] {
      if (colorMode !== 'provenance-overlay') return [];
      return buildLegendEntries(fileDataCache, maxEntries);
    },

    mountLegend(container: HTMLElement, maxEntries = LEGEND_DEFAULT_MAX): () => void {
      legendContainers.push({ el: container, maxEntries });
      renderLegend(container, buildLegendEntries(fileDataCache, maxEntries), maxEntries);
      return () => {
        const idx = legendContainers.findIndex(l => l.el === container);
        if (idx >= 0) legendContainers.splice(idx, 1);
        container.innerHTML = '';
      };
    },

    setTimeLapseFiles(filesPresent: Set<string> | null): void {
      timeLapseFiles = filesPresent;
      if (!layerEl) return;
      layerEl.querySelectorAll('.system-map-circle').forEach((el) => {
        const circle = el as SVGCircleElement;
        const dataId = circle.getAttribute('data-id') ?? '';
        if (filesPresent === null) {
          circle.classList.remove('system-map-circle--time-lapse-absent');
        } else {
          const isFolder = circle.closest('.system-map-node')?.querySelector('.system-map-label--folder') !== null
            || !dataId.includes('.');
          if (!isFolder && !filesPresent.has(dataId)) {
            circle.classList.add('system-map-circle--time-lapse-absent');
          } else {
            circle.classList.remove('system-map-circle--time-lapse-absent');
          }
        }
      });
    },
  };
}
