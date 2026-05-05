/**
 * Symbol Graph — WebGL2 force-directed graph view.
 *
 * Manages a canvas via the W0.5 renderer. Loads graph data via IPC,
 * runs FR layout, and handles interactions (click node → emit selection;
 * hover edge → highlight; pan/zoom via viewport).
 */

import type { AtlasSymbol, AtlasCallEdge, AtlasTypeRelation, SnapshotId } from '../../../../src/intelligence/types.js';
import { intelligenceIpc } from '../../../../src/intelligence/ipc.js';
import {
  runFRLayout,
  createViewport,
  screenToWorld,
  pan,
  zoomAt,
  buildHitTestIndex,
  hitTest,
  createRenderer,
  uploadNodes,
  uploadEdges,
  drawFrame,
  disposeRenderer,
  computeLOD,
} from '../../../../src/atlas/graph-renderer/index.js';
import type {
  LayoutNode,
  LayoutEdge,
  ViewportState,
  RendererHandle,
  HitTestIndex,
  NodeVertex,
  EdgeVertex,
} from '../../../../src/atlas/graph-renderer/index.js';
import {
  filterSymbols,
  filterCallEdges,
  filterTypeRelations,
  DEFAULT_FILTER_CONFIG,
} from './filter-pipeline.js';
import type { FilterConfig } from './filter-pipeline.js';

export type { FilterConfig };

export interface FocusTarget {
  snapshotId: SnapshotId;
  symbolId?: string;
}

export interface GraphSelection {
  kind: 'node';
  symbol: AtlasSymbol;
}

// ─── color constants (packed 0xRRGGBBAA) ────────────────────────────────────

const COLOR_NODE_DEFAULT = 0x7aa2f7ff;
const COLOR_NODE_SELECTED = 0xff9e64ff;
const COLOR_NODE_HOVER = 0x9ece6aff;
const COLOR_EDGE_CALL = 0x9aa5ce66;
const COLOR_EDGE_CALL_HIGHLIGHT = 0x7aa2f7cc;
const COLOR_EDGE_TYPE = 0xbb9af766;
const COLOR_EDGE_TYPE_HIGHLIGHT = 0xbb9af7cc;
/** Accent color for cross-project edges (corresponds to CSS class .cross-project-edge). */
const COLOR_EDGE_CROSS_PROJECT = 0xe0af68cc;
const NODE_RADIUS = 6;

// ─── internal graph data ─────────────────────────────────────────────────────

interface GraphEdge {
  sourceId: string;
  targetId: string;
  kind: 'call' | 'type';
  /** True when caller and callee belong to different projects. */
  crossProject: boolean;
}

export class SymbolGraphView {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private renderer: RendererHandle;
  private viewport: ViewportState;
  private hitIndex: HitTestIndex | null = null;

  private symbols: AtlasSymbol[] = [];
  private edges: GraphEdge[] = [];

  private selectedId: string | null = null;
  private hoveredEdgeIdx: number | null = null;

  private nodeVertices: NodeVertex[] = [];
  private edgeVertices: EdgeVertex[] = [];

  private layoutNodes: LayoutNode[] = [];
  private idToLayout = new Map<string, LayoutNode>();

  /** Maps symbolId → projectId for cross-project edge detection. Populated in loadGraph. */
  private symbolProjectMap = new Map<string, string>();

  private filterConfig: FilterConfig = { ...DEFAULT_FILTER_CONFIG };
  private missionFilterId: string | null = null;
  private missionChipEl: HTMLElement | null = null;
  private selectHandlers: Array<(sel: GraphSelection | null) => void> = [];
  private missionFilterChangeHandlers: Array<(missionId: string | null) => void> = [];

  private rafId: number | null = null;
  private dirty = false;

  // Pointer state for pan
  private isPanning = false;
  private lastPointer = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;
    this.renderer = createRenderer(gl, { nodes: 4096, edges: 8192 });
    this.viewport = createViewport(canvas.offsetWidth || canvas.width, canvas.offsetHeight || canvas.height);
    this.attachPointerHandlers();
    this.scheduleFrame();
  }

  // ─── public API ─────────────────────────────────────────────────────────────

  setFilter(config: Partial<FilterConfig>): void {
    this.filterConfig = { ...this.filterConfig, ...config };
    this.rebuildVertices();
    this.dirty = true;
  }

  async setMissionFilter(missionId: string | null): Promise<void> {
    if (missionId === null) {
      this.missionFilterId = null;
      this.filterConfig = { ...this.filterConfig, missionFilePaths: null };
      this.updateChip();
      this.rebuildVertices();
      this.dirty = true;
      for (const h of this.missionFilterChangeHandlers) h(null);
      return;
    }

    let filePaths: Set<string>;
    try {
      const records = await intelligenceIpc.listFilesChangedByMission(missionId);
      filePaths = new Set(records.map((r) => r.file_path));
    } catch {
      return;
    }

    this.missionFilterId = missionId;
    this.filterConfig = { ...this.filterConfig, missionFilePaths: filePaths };
    this.updateChip();
    this.rebuildVertices();
    this.dirty = true;
    for (const h of this.missionFilterChangeHandlers) h(missionId);
  }

  mountChipContainer(container: HTMLElement): void {
    this.missionChipEl = document.createElement('div');
    this.missionChipEl.className = 'symbol-graph-mission-chip';
    container.prepend(this.missionChipEl);
    this.updateChip();
  }

  private updateChip(): void {
    if (!this.missionChipEl) return;
    if (this.missionFilterId === null) {
      this.missionChipEl.classList.remove('symbol-graph-mission-chip--visible');
      this.missionChipEl.textContent = '';
      return;
    }
    this.missionChipEl.classList.add('symbol-graph-mission-chip--visible');
    this.missionChipEl.innerHTML = '';

    const label = document.createElement('span');
    label.textContent = `Filtered to mission ${this.missionFilterId}`;

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '✕';
    clearBtn.className = 'symbol-graph-mission-chip-clear';
    clearBtn.setAttribute('aria-label', 'Clear mission filter');
    clearBtn.addEventListener('click', () => { void this.setMissionFilter(null); });

    this.missionChipEl.appendChild(label);
    this.missionChipEl.appendChild(clearBtn);
  }

  onSelect(handler: (sel: GraphSelection | null) => void): () => void {
    this.selectHandlers.push(handler);
    return () => {
      this.selectHandlers = this.selectHandlers.filter((h) => h !== handler);
    };
  }

  onMissionFilterChange(handler: (missionId: string | null) => void): () => void {
    this.missionFilterChangeHandlers.push(handler);
    return () => {
      this.missionFilterChangeHandlers = this.missionFilterChangeHandlers.filter(h => h !== handler);
    };
  }

  async setFocus(focus: FocusTarget): Promise<void> {
    const { snapshotId, symbolId } = focus;

    // Fetch all symbols for the snapshot. If a specific symbolId is given,
    // we expand the graph with its callers + callees.
    let rootSymbols: AtlasSymbol[];
    let callEdges: AtlasCallEdge[] = [];
    let typeRels: AtlasTypeRelation[] = [];

    if (symbolId) {
      const [sym, callers, callees, typeFrom, typeTo] = await Promise.all([
        intelligenceIpc.getSymbol(symbolId),
        intelligenceIpc.listCallers(symbolId),
        intelligenceIpc.listCallees(symbolId),
        intelligenceIpc.listTypeRelationsFrom(symbolId),
        intelligenceIpc.listTypeRelationsTo(symbolId),
      ]);
      rootSymbols = sym ? [sym] : [];
      callEdges = [...callers, ...callees];
      typeRels = [...typeFrom, ...typeTo];

      // Resolve neighbor symbols
      const neighborIds = new Set<string>([
        ...callEdges.map((e) => e.caller_symbol_id),
        ...callEdges.map((e) => e.callee_symbol_id),
        ...typeRels.map((r) => r.from_symbol_id),
        ...typeRels.map((r) => r.to_symbol_id),
      ]);
      neighborIds.delete(symbolId);

      const neighborSyms = await Promise.all(
        [...neighborIds].slice(0, 200).map((id) => intelligenceIpc.getSymbol(id)),
      );
      const resolved = neighborSyms.filter((s): s is AtlasSymbol => s !== null);
      rootSymbols = [...rootSymbols, ...resolved];
    } else {
      // No specific symbol — load snapshot-wide overview (up to 500 symbols).
      rootSymbols = await intelligenceIpc.listSymbolsInSnapshot(snapshotId, { limit: 500 });
    }

    this.loadGraph(rootSymbols, callEdges, typeRels);
  }

  dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detachPointerHandlers();
    disposeRenderer(this.renderer);
  }

  // ─── graph loading ───────────────────────────────────────────────────────────

  private loadGraph(
    rawSymbols: AtlasSymbol[],
    rawCallEdges: AtlasCallEdge[],
    rawTypeRels: AtlasTypeRelation[],
  ): void {
    const filtered = filterSymbols(rawSymbols, this.filterConfig);
    const survivingIds = new Set(filtered.map((s) => s.id));

    const fCallEdges = filterCallEdges(rawCallEdges, survivingIds, this.filterConfig);
    const fTypeRels = filterTypeRelations(rawTypeRels, survivingIds, this.filterConfig);

    // Rebuild the symbol→project index from the current symbol set.
    this.symbolProjectMap.clear();
    for (const sym of filtered) {
      if (sym.project_id) this.symbolProjectMap.set(sym.id, sym.project_id);
    }

    this.symbols = filtered;
    this.edges = [
      ...fCallEdges.map((e) => ({
        sourceId: e.caller_symbol_id,
        targetId: e.callee_symbol_id,
        kind: 'call' as const,
        crossProject:
          this.symbolProjectMap.has(e.caller_symbol_id) &&
          this.symbolProjectMap.has(e.callee_symbol_id) &&
          this.symbolProjectMap.get(e.caller_symbol_id) !==
            this.symbolProjectMap.get(e.callee_symbol_id),
      })),
      ...fTypeRels.map((r) => ({
        sourceId: r.from_symbol_id,
        targetId: r.to_symbol_id,
        kind: 'type' as const,
        crossProject:
          this.symbolProjectMap.has(r.from_symbol_id) &&
          this.symbolProjectMap.has(r.to_symbol_id) &&
          this.symbolProjectMap.get(r.from_symbol_id) !==
            this.symbolProjectMap.get(r.to_symbol_id),
      })),
    ];

    this.runLayout();
    this.rebuildVertices();
    this.dirty = true;
  }

  private runLayout(): void {
    this.idToLayout.clear();
    const layoutNodes: LayoutNode[] = this.symbols.map((sym, i) => ({
      id: i,
      x: 0,
      y: 0,
    }));
    const idToIdx = new Map<string, number>();
    this.symbols.forEach((sym, i) => idToIdx.set(sym.id, i));

    const layoutEdges: LayoutEdge[] = this.edges
      .map((e) => {
        const si = idToIdx.get(e.sourceId);
        const ti = idToIdx.get(e.targetId);
        if (si === undefined || ti === undefined) return null;
        return { source: si, target: ti };
      })
      .filter((e): e is LayoutEdge => e !== null);

    runFRLayout(layoutNodes, layoutEdges, { iterations: 150 });
    this.layoutNodes = layoutNodes;
    this.symbols.forEach((sym, i) => {
      this.idToLayout.set(sym.id, layoutNodes[i]!);
    });
  }

  private rebuildVertices(): void {
    const filtered = filterSymbols(this.symbols, this.filterConfig);
    const survivingIds = new Set(filtered.map((s) => s.id));

    this.nodeVertices = filtered.map((sym) => {
      const layout = this.idToLayout.get(sym.id);
      const color =
        sym.id === this.selectedId
          ? COLOR_NODE_SELECTED
          : COLOR_NODE_DEFAULT;
      return {
        x: layout?.x ?? 0,
        y: layout?.y ?? 0,
        radius: NODE_RADIUS,
        color,
      };
    });

    // Build cross-project lookup keyed by "sourceId:targetId".
    const crossProjectKey = new Map<string, boolean>();
    for (const e of this.edges) {
      crossProjectKey.set(`${e.sourceId}:${e.targetId}`, e.crossProject);
    }

    const filteredCallEdges = filterCallEdges(
      this.edges
        .filter((e) => e.kind === 'call')
        .map((e, i) => ({
          id: String(i),
          snapshot_id: '',
          caller_symbol_id: e.sourceId,
          callee_symbol_id: e.targetId,
          call_site_byte: 0,
          call_site_line: 0,
          confidence: 1,
        })),
      survivingIds,
      this.filterConfig,
    );

    const filteredTypeRels = filterTypeRelations(
      this.edges
        .filter((e) => e.kind === 'type')
        .map((e, i) => ({
          id: String(i),
          snapshot_id: '',
          from_symbol_id: e.sourceId,
          to_symbol_id: e.targetId,
          kind: 'uses_type' as const,
          confidence: 1,
        })),
      survivingIds,
      this.filterConfig,
    );

    this.edgeVertices = [
      ...filteredCallEdges.map((e, idx) => {
        const srcLayout = this.idToLayout.get(e.caller_symbol_id);
        const tgtLayout = this.idToLayout.get(e.callee_symbol_id);
        const isHighlighted = this.hoveredEdgeIdx === idx;
        const isCrossProject = crossProjectKey.get(`${e.caller_symbol_id}:${e.callee_symbol_id}`) ?? false;
        return {
          x0: srcLayout?.x ?? 0,
          y0: srcLayout?.y ?? 0,
          x1: tgtLayout?.x ?? 0,
          y1: tgtLayout?.y ?? 0,
          color: isCrossProject
            ? COLOR_EDGE_CROSS_PROJECT
            : isHighlighted ? COLOR_EDGE_CALL_HIGHLIGHT : COLOR_EDGE_CALL,
        };
      }),
      ...filteredTypeRels.map((r, idx) => {
        const srcLayout = this.idToLayout.get(r.from_symbol_id);
        const tgtLayout = this.idToLayout.get(r.to_symbol_id);
        const isHighlighted = this.hoveredEdgeIdx === filteredCallEdges.length + idx;
        const isCrossProject = crossProjectKey.get(`${r.from_symbol_id}:${r.to_symbol_id}`) ?? false;
        return {
          x0: srcLayout?.x ?? 0,
          y0: srcLayout?.y ?? 0,
          x1: tgtLayout?.x ?? 0,
          y1: tgtLayout?.y ?? 0,
          color: isCrossProject
            ? COLOR_EDGE_CROSS_PROJECT
            : isHighlighted ? COLOR_EDGE_TYPE_HIGHLIGHT : COLOR_EDGE_TYPE,
        };
      }),
    ];

    // Rebuild hit test index from filtered nodes
    this.hitIndex = buildHitTestIndex(
      filtered.map((sym) => {
        const layout = this.idToLayout.get(sym.id);
        return {
          id: this.symbols.indexOf(sym),
          x: layout?.x ?? 0,
          y: layout?.y ?? 0,
          radius: NODE_RADIUS,
        };
      }),
    );
  }

  // ─── render loop ─────────────────────────────────────────────────────────────

  private scheduleFrame(): void {
    this.rafId = requestAnimationFrame(() => {
      this.render();
      this.scheduleFrame();
    });
  }

  private render(): void {
    if (!this.dirty) return;
    this.dirty = false;

    uploadNodes(this.renderer, this.nodeVertices);
    uploadEdges(this.renderer, this.edgeVertices);

    const lod = computeLOD(this.nodeVertices.length, this.viewport.zoom);
    drawFrame(this.renderer, {
      nodeCount: this.nodeVertices.length,
      edgeCount: this.edgeVertices.length,
      viewport: this.viewport,
      drawNodes: true,
      drawEdges: lod.drawEdges,
    });
  }

  // ─── pointer handlers ────────────────────────────────────────────────────────

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.isPanning = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.canvas.setPointerCapture(e.pointerId);
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (this.isPanning) {
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      pan(this.viewport, -dx, -dy);
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.dirty = true;
    } else {
      // Edge hover hit test — skip for performance if no hit index
      if (!this.hitIndex) return;
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wp = screenToWorld(this.viewport, { x: sx, y: sy });
      // Find nearest edge within 8 world units
      let nearest: number | null = null;
      let nearestDist = 8;
      for (let i = 0; i < this.edgeVertices.length; i++) {
        const ev = this.edgeVertices[i]!;
        const d = pointToSegmentDist(wp.x, wp.y, ev.x0, ev.y0, ev.x1, ev.y1);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      }
      if (nearest !== this.hoveredEdgeIdx) {
        this.hoveredEdgeIdx = nearest;
        this.rebuildVertices();
        this.dirty = true;
      }
    }
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    this.isPanning = false;
    this.canvas.releasePointerCapture(e.pointerId);
  };

  private readonly onClick = (e: MouseEvent): void => {
    if (!this.hitIndex) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wp = screenToWorld(this.viewport, { x: sx, y: sy });
    const hit = hitTest(this.hitIndex, wp.x, wp.y);
    if (hit) {
      const sym = this.symbols[hit.id];
      if (sym) {
        this.selectedId = sym.id;
        this.rebuildVertices();
        this.dirty = true;
        const sel: GraphSelection = { kind: 'node', symbol: sym };
        for (const h of this.selectHandlers) h(sel);
        return;
      }
    }
    // Click on empty space — clear selection
    this.selectedId = null;
    this.rebuildVertices();
    this.dirty = true;
    for (const h of this.selectHandlers) h(null);
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoomAt(this.viewport, anchor, factor);
    this.dirty = true;
  };

  private attachPointerHandlers(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private detachPointerHandlers(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  // ─── test-surface accessors (package-internal) ───────────────────────────────

  get _symbols(): AtlasSymbol[] { return this.symbols; }
  get _edges(): GraphEdge[] { return this.edges; }
  get _selectedId(): string | null { return this.selectedId; }
  get _nodeVertices(): NodeVertex[] { return this.nodeVertices; }
  get _filterConfig(): FilterConfig { return this.filterConfig; }
  get _missionFilterId(): string | null { return this.missionFilterId; }
  get _missionChipEl(): HTMLElement | null { return this.missionChipEl; }
  /** Number of edges flagged as cross-project (for test assertions). */
  get _crossProjectEdgeCount(): number {
    return this.edges.filter((e) => e.crossProject).length;
  }
  /** Indices into edgeVertices that received COLOR_EDGE_CROSS_PROJECT. */
  get _crossProjectEdgeIndices(): number[] {
    return this.edges.reduce<number[]>((acc, e, i) => {
      if (e.crossProject) acc.push(i);
      return acc;
    }, []);
  }

  _loadGraphForTest(
    rawSymbols: AtlasSymbol[],
    rawCallEdges: AtlasCallEdge[],
    rawTypeRels: AtlasTypeRelation[],
  ): void {
    this.loadGraph(rawSymbols, rawCallEdges, rawTypeRels);
  }

  _clickAtWorld(wx: number, wy: number): void {
    if (!this.hitIndex) return;
    const hit = hitTest(this.hitIndex, wx, wy);
    if (hit) {
      const sym = this.symbols[hit.id];
      if (sym) {
        this.selectedId = sym.id;
        this.rebuildVertices();
        this.dirty = true;
        const sel: GraphSelection = { kind: 'node', symbol: sym };
        for (const h of this.selectHandlers) h(sel);
        return;
      }
    }
    this.selectedId = null;
    this.rebuildVertices();
    this.dirty = true;
    for (const h of this.selectHandlers) h(null);
  }
}

// ─── geometry helper ─────────────────────────────────────────────────────────

function pointToSegmentDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}
