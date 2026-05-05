/**
 * Symbol Graph — unit tests.
 *
 * Filter-pipeline correctness + click-handler dispatch + mock-renderer integration.
 * WebGL2 context is stubbed; tests exercise filter+select logic, not the GL pipeline.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AtlasSymbol, AtlasCallEdge, AtlasTypeRelation } from '../../../../../src/intelligence/types.js';
import {
  filterSymbols,
  filterCallEdges,
  filterTypeRelations,
  DEFAULT_FILTER_CONFIG,
} from '../filter-pipeline.js';
import type { FilterConfig } from '../filter-pipeline.js';
import { SymbolGraphView } from '../symbol-graph.js';
import * as ipcModule from '../../../../../src/intelligence/ipc.js';

// ─── WebGL2 stub ─────────────────────────────────────────────────────────────

function makeGl2Stub(): WebGL2RenderingContext {
  const stub: Partial<WebGL2RenderingContext> = {
    createProgram: vi.fn(() => ({} as WebGLProgram)),
    createShader: vi.fn(() => ({} as WebGLShader)),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => null),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => null),
    createBuffer: vi.fn(() => ({} as WebGLBuffer)),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    bufferSubData: vi.fn(),
    createVertexArray: vi.fn(() => ({} as WebGLVertexArrayObject)),
    bindVertexArray: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    vertexAttribDivisor: vi.fn(),
    getUniformLocation: vi.fn(() => ({} as WebGLUniformLocation)),
    useProgram: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    viewport: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    drawArraysInstanced: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88b4,
    DYNAMIC_DRAW: 0x88b8,
    FLOAT: 0x1406,
    BLEND: 0x0be2,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    COLOR_BUFFER_BIT: 0x4000,
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    LINK_STATUS: 0x8b82,
    COMPILE_STATUS: 0x8b81,
    LINES: 0x0001,
    TRIANGLE_STRIP: 0x0005,
  };
  return stub as WebGL2RenderingContext;
}

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const gl = makeGl2Stub();
  vi.spyOn(canvas, 'getContext').mockReturnValue(gl as never);
  // Stub pointer capture methods
  canvas.setPointerCapture = vi.fn();
  canvas.releasePointerCapture = vi.fn();
  return canvas;
}

// ─── symbol/edge factories ────────────────────────────────────────────────────

function makeSymbol(overrides: Partial<AtlasSymbol> = {}): AtlasSymbol {
  return {
    id: 'sym-1',
    snapshot_id: 'snap-1',
    project_id: 'proj-1',
    file_path: 'src/foo.ts',
    kind: 'function',
    name: 'myFn',
    qualified_name: 'src/foo.myFn',
    start_byte: 0,
    end_byte: 100,
    start_line: 1,
    end_line: 10,
    signature_hash: null,
    modifiers: [],
    language: 'ts',
    parent_symbol_id: null,
    ...overrides,
  };
}

function makeCallEdge(callerId: string, calleeId: string, confidence = 1): AtlasCallEdge {
  return {
    id: `edge-${callerId}-${calleeId}`,
    snapshot_id: 'snap-1',
    caller_symbol_id: callerId,
    callee_symbol_id: calleeId,
    call_site_byte: 0,
    call_site_line: 5,
    confidence,
  };
}

function makeTypeRel(fromId: string, toId: string, confidence = 1): AtlasTypeRelation {
  return {
    id: `rel-${fromId}-${toId}`,
    snapshot_id: 'snap-1',
    from_symbol_id: fromId,
    to_symbol_id: toId,
    kind: 'uses_type',
    confidence,
  };
}

// ─── filter-pipeline tests ───────────────────────────────────────────────────

describe('filterSymbols — hideTestFiles', () => {
  it('passes through non-test symbols when hideTestFiles is false', () => {
    const sym = makeSymbol({ file_path: 'src/foo.ts' });
    const result = filterSymbols([sym], { ...DEFAULT_FILTER_CONFIG, hideTestFiles: false });
    expect(result).toHaveLength(1);
  });

  it('removes __tests__ files when hideTestFiles is true', () => {
    const sym = makeSymbol({ file_path: 'src/__tests__/foo.test.ts' });
    const result = filterSymbols([sym], { ...DEFAULT_FILTER_CONFIG, hideTestFiles: true });
    expect(result).toHaveLength(0);
  });

  it('removes .spec.ts files when hideTestFiles is true', () => {
    const sym = makeSymbol({ file_path: 'src/foo.spec.ts' });
    const result = filterSymbols([sym], { ...DEFAULT_FILTER_CONFIG, hideTestFiles: true });
    expect(result).toHaveLength(0);
  });

  it('keeps src files when hideTestFiles is true', () => {
    const sym = makeSymbol({ file_path: 'src/foo.ts' });
    const result = filterSymbols([sym], { ...DEFAULT_FILTER_CONFIG, hideTestFiles: true });
    expect(result).toHaveLength(1);
  });
});

describe('filterSymbols — hidePrivateSymbols', () => {
  it('hides symbols with underscore prefix when hidePrivateSymbols is true', () => {
    const sym = makeSymbol({ name: '_internal', modifiers: [] });
    const result = filterSymbols([sym], { ...DEFAULT_FILTER_CONFIG, hidePrivateSymbols: true });
    expect(result).toHaveLength(0);
  });

  it('hides symbols with private modifier when hidePrivateSymbols is true', () => {
    const sym = makeSymbol({ name: 'myField', modifiers: ['private'] });
    const result = filterSymbols([sym], { ...DEFAULT_FILTER_CONFIG, hidePrivateSymbols: true });
    expect(result).toHaveLength(0);
  });

  it('keeps public symbols when hidePrivateSymbols is true', () => {
    const sym = makeSymbol({ name: 'myFn', modifiers: [] });
    const result = filterSymbols([sym], { ...DEFAULT_FILTER_CONFIG, hidePrivateSymbols: true });
    expect(result).toHaveLength(1);
  });
});

describe('filterCallEdges — edgeType filter', () => {
  it('returns empty array when edgeType is type-rels', () => {
    const edge = makeCallEdge('sym-1', 'sym-2');
    const ids = new Set(['sym-1', 'sym-2']);
    const result = filterCallEdges([edge], ids, { ...DEFAULT_FILTER_CONFIG, edgeType: 'type-rels' });
    expect(result).toHaveLength(0);
  });

  it('returns edges when edgeType is calls', () => {
    const edge = makeCallEdge('sym-1', 'sym-2');
    const ids = new Set(['sym-1', 'sym-2']);
    const result = filterCallEdges([edge], ids, { ...DEFAULT_FILTER_CONFIG, edgeType: 'calls' });
    expect(result).toHaveLength(1);
  });

  it('filters edges below confidence threshold', () => {
    const edge = makeCallEdge('sym-1', 'sym-2', 0.3);
    const ids = new Set(['sym-1', 'sym-2']);
    const result = filterCallEdges([edge], ids, { ...DEFAULT_FILTER_CONFIG, confidenceThreshold: 0.5 });
    expect(result).toHaveLength(0);
  });

  it('keeps edges at or above confidence threshold', () => {
    const edge = makeCallEdge('sym-1', 'sym-2', 0.5);
    const ids = new Set(['sym-1', 'sym-2']);
    const result = filterCallEdges([edge], ids, { ...DEFAULT_FILTER_CONFIG, confidenceThreshold: 0.5 });
    expect(result).toHaveLength(1);
  });

  it('drops edges where caller is not in surviving set', () => {
    const edge = makeCallEdge('sym-99', 'sym-2');
    const ids = new Set(['sym-2']);
    const result = filterCallEdges([edge], ids, DEFAULT_FILTER_CONFIG);
    expect(result).toHaveLength(0);
  });
});

describe('filterTypeRelations — edgeType filter', () => {
  it('returns empty array when edgeType is calls', () => {
    const rel = makeTypeRel('sym-1', 'sym-2');
    const ids = new Set(['sym-1', 'sym-2']);
    const result = filterTypeRelations([rel], ids, { ...DEFAULT_FILTER_CONFIG, edgeType: 'calls' });
    expect(result).toHaveLength(0);
  });

  it('returns relations when edgeType is type-rels', () => {
    const rel = makeTypeRel('sym-1', 'sym-2');
    const ids = new Set(['sym-1', 'sym-2']);
    const result = filterTypeRelations([rel], ids, { ...DEFAULT_FILTER_CONFIG, edgeType: 'type-rels' });
    expect(result).toHaveLength(1);
  });

  it('filters relations below confidence threshold', () => {
    const rel = makeTypeRel('sym-1', 'sym-2', 0.2);
    const ids = new Set(['sym-1', 'sym-2']);
    const result = filterTypeRelations([rel], ids, { ...DEFAULT_FILTER_CONFIG, confidenceThreshold: 0.5 });
    expect(result).toHaveLength(0);
  });
});

// ─── SymbolGraphView mock-renderer tests ─────────────────────────────────────

describe('SymbolGraphView — click-handler dispatch', () => {
  let canvas: HTMLCanvasElement;
  let view: SymbolGraphView;

  beforeEach(() => {
    // Stub requestAnimationFrame / cancelAnimationFrame to avoid real RAF loop
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    canvas = makeCanvas();
    view = new SymbolGraphView(canvas);
  });

  it('calls select handler with null when clicking empty world-space after graph loaded', () => {
    const sym = makeSymbol({ id: 'sym-1' });
    view._loadGraphForTest([sym], [], []);
    const handler = vi.fn();
    view.onSelect(handler);
    // Click far from the node; hitTest returns null → null emitted
    view._clickAtWorld(9999, 9999);
    expect(handler).toHaveBeenCalledWith(null);
  });

  it('calls select handler with symbol after loading and clicking node', () => {
    const sym = makeSymbol({ id: 'sym-1' });
    view._loadGraphForTest([sym], [], []);

    const handler = vi.fn();
    view.onSelect(handler);

    // The node will be positioned at its layout coords after FR layout runs.
    // Since there's only one node, we know it lands near origin.
    const layout = view._nodeVertices[0];
    const x = layout?.x ?? 0;
    const y = layout?.y ?? 0;
    view._clickAtWorld(x, y);

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'node', symbol: expect.objectContaining({ id: 'sym-1' }) }),
    );
  });

  it('unsubscribe removes handler', () => {
    const handler = vi.fn();
    const unsub = view.onSelect(handler);
    unsub();
    view._clickAtWorld(9999, 9999);
    expect(handler).not.toHaveBeenCalled();
  });

  it('selectedId is set after clicking a node', () => {
    const sym = makeSymbol({ id: 'sym-42' });
    view._loadGraphForTest([sym], [], []);
    const layout = view._nodeVertices[0];
    view._clickAtWorld(layout?.x ?? 0, layout?.y ?? 0);
    expect(view._selectedId).toBe('sym-42');
  });

  it('selectedId is cleared when clicking empty space', () => {
    const sym = makeSymbol({ id: 'sym-42' });
    view._loadGraphForTest([sym], [], []);
    const layout = view._nodeVertices[0];
    view._clickAtWorld(layout?.x ?? 0, layout?.y ?? 0);
    expect(view._selectedId).toBe('sym-42');
    view._clickAtWorld(9999, 9999);
    expect(view._selectedId).toBeNull();
  });

  it('setFilter updates filter config and retains symbols', () => {
    const sym = makeSymbol({ id: 'sym-1', file_path: 'src/foo.ts' });
    view._loadGraphForTest([sym], [], []);
    view.setFilter({ hideTestFiles: true });
    expect(view._filterConfig.hideTestFiles).toBe(true);
    // src/foo.ts is not a test file; symbol should survive
    expect(view._symbols).toHaveLength(1);
  });

  it('multiple select handlers all fire on click', () => {
    const sym = makeSymbol({ id: 'sym-1' });
    view._loadGraphForTest([sym], [], []);
    const h1 = vi.fn();
    const h2 = vi.fn();
    view.onSelect(h1);
    view.onSelect(h2);
    const layout = view._nodeVertices[0];
    view._clickAtWorld(layout?.x ?? 0, layout?.y ?? 0);
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});

// ─── filterByMission tests ───────────────────────────────────────────────────

describe('filterSymbols — missionFilePaths gate', () => {
  it('passes all symbols when missionFilePaths is null', () => {
    const s1 = makeSymbol({ id: 's1', file_path: 'src/a.ts' });
    const s2 = makeSymbol({ id: 's2', file_path: 'src/b.ts' });
    const result = filterSymbols([s1, s2], { ...DEFAULT_FILTER_CONFIG, missionFilePaths: null });
    expect(result).toHaveLength(2);
  });

  it('retains only symbols whose file_path is in the mission set', () => {
    const s1 = makeSymbol({ id: 's1', file_path: 'src/a.ts' });
    const s2 = makeSymbol({ id: 's2', file_path: 'src/b.ts' });
    const paths = new Set(['src/a.ts']);
    const result = filterSymbols([s1, s2], { ...DEFAULT_FILTER_CONFIG, missionFilePaths: paths });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('s1');
  });

  it('returns empty array when no symbol file_path matches', () => {
    const s1 = makeSymbol({ id: 's1', file_path: 'src/x.ts' });
    const paths = new Set(['src/other.ts']);
    const result = filterSymbols([s1], { ...DEFAULT_FILTER_CONFIG, missionFilePaths: paths });
    expect(result).toHaveLength(0);
  });

  it('mission gate applies before hideTestFiles (both must pass)', () => {
    const s1 = makeSymbol({ id: 's1', file_path: 'src/__tests__/foo.test.ts' });
    const paths = new Set(['src/__tests__/foo.test.ts']);
    const result = filterSymbols([s1], {
      ...DEFAULT_FILTER_CONFIG,
      missionFilePaths: paths,
      hideTestFiles: true,
    });
    expect(result).toHaveLength(0);
  });
});

// ─── setMissionFilter API tests ──────────────────────────────────────────────

describe('SymbolGraphView — setMissionFilter', () => {
  let canvas: HTMLCanvasElement;
  let view: SymbolGraphView;

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    canvas = makeCanvas();
    view = new SymbolGraphView(canvas);
  });

  it('setMissionFilter narrows symbols to mission-touched files', async () => {
    const s1 = makeSymbol({ id: 's1', file_path: 'src/a.ts' });
    const s2 = makeSymbol({ id: 's2', file_path: 'src/b.ts' });
    view._loadGraphForTest([s1, s2], [], []);

    const spy = vi.spyOn(ipcModule.intelligenceIpc, 'listFilesChangedByMission')
      .mockResolvedValueOnce([
        { id: 'fc-1', mission_id: 'v1.49.605', commit_sha: 'abc', file_path: 'src/a.ts', change_kind: 'M', rename_from: null, added_lines: 5, removed_lines: 2 },
      ]);

    await view.setMissionFilter('v1.49.605');

    expect(spy).toHaveBeenCalledWith('v1.49.605');
    expect(view._missionFilterId).toBe('v1.49.605');
    expect(view._filterConfig.missionFilePaths).not.toBeNull();
    expect(view._filterConfig.missionFilePaths!.has('src/a.ts')).toBe(true);
    expect(view._filterConfig.missionFilePaths!.has('src/b.ts')).toBe(false);

    spy.mockRestore();
  });

  it('setMissionFilter(null) clears the filter', async () => {
    const spy = vi.spyOn(ipcModule.intelligenceIpc, 'listFilesChangedByMission')
      .mockResolvedValueOnce([
        { id: 'fc-1', mission_id: 'v1.49.605', commit_sha: 'abc', file_path: 'src/a.ts', change_kind: 'M', rename_from: null, added_lines: 5, removed_lines: 2 },
      ]);

    await view.setMissionFilter('v1.49.605');
    await view.setMissionFilter(null);

    expect(view._missionFilterId).toBeNull();
    expect(view._filterConfig.missionFilePaths).toBeNull();

    spy.mockRestore();
  });

  it('IPC fetch failure leaves view in clean state (no crash, filter unchanged)', async () => {
    const spy = vi.spyOn(ipcModule.intelligenceIpc, 'listFilesChangedByMission')
      .mockRejectedValueOnce(new Error('mission not found'));

    const prevId = view._missionFilterId;
    const prevPaths = view._filterConfig.missionFilePaths;

    await view.setMissionFilter('nonexistent-mission');

    expect(view._missionFilterId).toBe(prevId);
    expect(view._filterConfig.missionFilePaths).toBe(prevPaths);

    spy.mockRestore();
  });

  it('chip renders with mission ID and clear button when filter is active', async () => {
    const container = document.createElement('div');
    view.mountChipContainer(container);

    const spy = vi.spyOn(ipcModule.intelligenceIpc, 'listFilesChangedByMission')
      .mockResolvedValueOnce([
        { id: 'fc-1', mission_id: 'v1.49.605', commit_sha: 'abc', file_path: 'src/a.ts', change_kind: 'M', rename_from: null, added_lines: 5, removed_lines: 2 },
      ]);

    await view.setMissionFilter('v1.49.605');

    const chip = view._missionChipEl!;
    expect(chip.classList.contains('symbol-graph-mission-chip--visible')).toBe(true);
    expect(chip.textContent).toContain('v1.49.605');
    expect(chip.querySelector('.symbol-graph-mission-chip-clear')).not.toBeNull();

    spy.mockRestore();
  });

  it('chip is hidden when filter is cleared', async () => {
    const container = document.createElement('div');
    view.mountChipContainer(container);

    const spy = vi.spyOn(ipcModule.intelligenceIpc, 'listFilesChangedByMission')
      .mockResolvedValueOnce([
        { id: 'fc-1', mission_id: 'v1.49.605', commit_sha: 'abc', file_path: 'src/a.ts', change_kind: 'M', rename_from: null, added_lines: 5, removed_lines: 2 },
      ]);

    await view.setMissionFilter('v1.49.605');
    await view.setMissionFilter(null);

    expect(view._missionChipEl!.classList.contains('symbol-graph-mission-chip--visible')).toBe(false);

    spy.mockRestore();
  });

  it('chip element exists in DOM at construction with --visible class absent', () => {
    const container = document.createElement('div');
    view.mountChipContainer(container);

    const chip = view._missionChipEl!;
    expect(chip).not.toBeNull();
    expect(chip.parentElement).toBe(container);
    expect(chip.classList.contains('symbol-graph-mission-chip--visible')).toBe(false);
  });

  it('setMissionFilter adds --visible class after IPC resolves', async () => {
    const container = document.createElement('div');
    view.mountChipContainer(container);

    const spy = vi.spyOn(ipcModule.intelligenceIpc, 'listFilesChangedByMission')
      .mockResolvedValueOnce([
        { id: 'fc-2', mission_id: 'mission-x', commit_sha: 'def', file_path: 'src/c.ts', change_kind: 'A', rename_from: null, added_lines: 10, removed_lines: 0 },
      ]);

    await view.setMissionFilter('mission-x');

    expect(view._missionChipEl!.classList.contains('symbol-graph-mission-chip--visible')).toBe(true);

    spy.mockRestore();
  });

  it('setMissionFilter(null) removes --visible class', async () => {
    const container = document.createElement('div');
    view.mountChipContainer(container);

    const spy = vi.spyOn(ipcModule.intelligenceIpc, 'listFilesChangedByMission')
      .mockResolvedValueOnce([
        { id: 'fc-3', mission_id: 'mission-x', commit_sha: 'ghi', file_path: 'src/d.ts', change_kind: 'M', rename_from: null, added_lines: 2, removed_lines: 1 },
      ]);

    await view.setMissionFilter('mission-x');
    expect(view._missionChipEl!.classList.contains('symbol-graph-mission-chip--visible')).toBe(true);

    await view.setMissionFilter(null);
    expect(view._missionChipEl!.classList.contains('symbol-graph-mission-chip--visible')).toBe(false);

    spy.mockRestore();
  });
});

// ─── setFocus IPC routing tests ──────────────────────────────────────────────

describe('SymbolGraphView — setFocus IPC routing', () => {
  let canvas: HTMLCanvasElement;
  let view: SymbolGraphView;

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    canvas = makeCanvas();
    view = new SymbolGraphView(canvas);
  });

  it('setFocus without symbolId calls listSymbolsInSnapshot, not listSymbolsForFile', async () => {
    const sym = makeSymbol({ id: 'snap-sym-1' });
    const listInSnap = vi.spyOn(ipcModule.intelligenceIpc, 'listSymbolsInSnapshot')
      .mockResolvedValueOnce([sym]);
    const listForFile = vi.spyOn(ipcModule.intelligenceIpc, 'listSymbolsForFile')
      .mockResolvedValue([]);

    await view.setFocus({ snapshotId: 'snap-abc' });

    expect(listInSnap).toHaveBeenCalledOnce();
    expect(listInSnap).toHaveBeenCalledWith('snap-abc', { limit: 500 });
    expect(listForFile).not.toHaveBeenCalled();

    listInSnap.mockRestore();
    listForFile.mockRestore();
  });

  it('setFocus with symbolId calls getSymbol + call-graph methods, not listSymbolsInSnapshot', async () => {
    const sym = makeSymbol({ id: 'sym-focus' });
    const getSym = vi.spyOn(ipcModule.intelligenceIpc, 'getSymbol').mockResolvedValue(sym);
    const listCallers = vi.spyOn(ipcModule.intelligenceIpc, 'listCallers').mockResolvedValue([]);
    const listCallees = vi.spyOn(ipcModule.intelligenceIpc, 'listCallees').mockResolvedValue([]);
    const listTypeFrom = vi.spyOn(ipcModule.intelligenceIpc, 'listTypeRelationsFrom').mockResolvedValue([]);
    const listTypeTo = vi.spyOn(ipcModule.intelligenceIpc, 'listTypeRelationsTo').mockResolvedValue([]);
    const listInSnap = vi.spyOn(ipcModule.intelligenceIpc, 'listSymbolsInSnapshot')
      .mockResolvedValue([]);

    await view.setFocus({ snapshotId: 'snap-abc', symbolId: 'sym-focus' });

    expect(getSym).toHaveBeenCalledWith('sym-focus');
    expect(listInSnap).not.toHaveBeenCalled();

    getSym.mockRestore();
    listCallers.mockRestore();
    listCallees.mockRestore();
    listTypeFrom.mockRestore();
    listTypeTo.mockRestore();
    listInSnap.mockRestore();
  });
});
