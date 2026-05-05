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
  packConfig,
  subTreeAt,
  type BuildOptions,
  type FileData,
  type NodePayload,
} from './layouts.js';
import {
  buildColorContext,
  colorFor,
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

export interface SystemMapComponent {
  mount(parent: HTMLElement): void;
  unmount(): void;
  /** Set the currently highlighted selection from an external shell. */
  setFocus(focus: Focus): void;
  /** Register a callback fired when the user clicks a circle. */
  onSelect(handler: SelectHandler): void;
  /** Load and render data for the given snapshot + file list. */
  load(snapshotId: SnapshotId, filePaths: string[]): Promise<void>;
  /** Switch color mode without reloading data. */
  setColorMode(mode: ColorMode): void;
}

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
    const size = Math.min(vw, vh) * 0.92;

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
    circle.setAttribute('data-id', node.id);

    const isFolder = node.data?.kind === 'folder' || (node.children && node.children.length > 0);
    circle.setAttribute('role', 'button');
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('aria-label', (isFolder ? 'folder ' : 'file ') + (node.id.split('/').pop() ?? node.id));

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
    const path = zoomStack.filter(Boolean);
    breadcrumbEl.textContent = path.length === 0 ? '/' : '/' + path.join('/');
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
      // Fetch symbols for each file in parallel (bounded to avoid request storm).
      const BATCH = 20;
      const results: FileData[] = [];
      for (let i = 0; i < filePaths.length; i += BATCH) {
        const batch = filePaths.slice(i, i + BATCH);
        const settled = await Promise.allSettled(
          batch.map(async (fp): Promise<FileData> => {
            const symbols = await intelligenceIpc.listSymbolsForFile(snapshotId, fp);
            const missions = await intelligenceIpc.listMissionsForFile(snapshotId, fp);
            const recentActivityAt = missions.reduce((max, m) => {
              // mission_id may encode timestamp; fallback to 0.
              return Math.max(max, 0);
            }, 0);
            return {
              filePath: fp,
              symbols,
              recentActivityAt,
              missionIds: missions.map(m => m.mission_id),
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
      const size = Math.min(vw, vh) * 0.92;
      packedRoot = wangWangPack(tree, { ...pOpts, size });
      colorCtx = buildColorContext(collectPayloads(packedRoot));

      renderPack();
      updateBreadcrumb();
    },

    setColorMode(mode: ColorMode): void {
      colorMode = mode;
      renderPack();
    },
  };
}
