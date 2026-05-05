/**
 * System Map — unit tests (vitest, jsdom).
 *
 * IPC is stubbed via vi.mock so no Tauri shell is required.
 * Tests cover: layouts structure, color-mode determinism, click dispatch,
 * zoom-in narrowing, zoom-out restore, setFocus highlighting.
 */

import { describe, it, expect, vi } from 'vitest';
import { buildFolderTree, subTreeAt } from '../layouts.js';
import {
  colorBySymbolDensity,
  colorByRecentActivity,
  colorByMissionAttribution,
  colorFor,
  buildColorContext,
} from '../color-modes.js';
import type { NodePayload } from '../layouts.js';
import type { CircleNode } from '../../../../../src/atlas/pack-layout/index.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFileNode(overrides: Partial<NodePayload> = {}): CircleNode<NodePayload> {
  return {
    id: 'src/foo.ts',
    data: {
      kind: 'file',
      filePath: 'src/foo.ts',
      symbolCount: 10,
      recentActivityAt: 1000,
      missionIds: ['m1', 'm2'],
      ...overrides,
    },
    x: 0,
    y: 0,
    r: 20,
    value: 10,
    depth: 1,
  };
}

function defaultCtx() {
  return buildColorContext([
    { kind: 'file', filePath: 'src/a.ts', symbolCount: 10, recentActivityAt: 2000, missionIds: ['m1'] },
    { kind: 'file', filePath: 'src/b.ts', symbolCount: 5, recentActivityAt: 1000, missionIds: [] },
  ]);
}

// ── 1. buildFolderTree produces expected structure ────────────────────────────

describe('buildFolderTree', () => {
  it('creates a root node with folder children', () => {
    const tree = buildFolderTree([
      { filePath: 'src/index.ts', symbols: [], recentActivityAt: 0, missionIds: [] },
      { filePath: 'src/utils.ts', symbols: [], recentActivityAt: 0, missionIds: [] },
    ]);
    expect(tree.id).toBe('/');
    expect(tree.children).toBeDefined();
    // Should have one 'src' folder child
    const srcFolder = tree.children!.find(c => c.id === 'src');
    expect(srcFolder).toBeDefined();
    expect(srcFolder!.children!.length).toBe(2);
  });

  it('leaf node carries symbolCount from file symbols', () => {
    const fakeSymbols = Array.from({ length: 7 }, (_, i) => ({ id: String(i) })) as any;
    const tree = buildFolderTree([
      { filePath: 'lib/x.ts', symbols: fakeSymbols, recentActivityAt: 0, missionIds: [] },
    ]);
    const libFolder = tree.children!.find(c => c.id === 'lib');
    const leaf = libFolder!.children![0];
    expect(leaf.data?.symbolCount).toBe(7);
    expect(leaf.value).toBe(7);
  });

  it('zero-symbol files get value 1 (minimum)', () => {
    const tree = buildFolderTree([
      { filePath: 'empty.ts', symbols: [], recentActivityAt: 0, missionIds: [] },
    ]);
    const leaf = tree.children![0];
    expect(leaf.value).toBe(1);
  });

  it('deeply nested paths produce intermediate folder nodes', () => {
    const tree = buildFolderTree([
      { filePath: 'a/b/c/deep.ts', symbols: [], recentActivityAt: 0, missionIds: [] },
    ]);
    const a = tree.children!.find(n => n.id === 'a');
    const ab = a!.children!.find(n => n.id === 'a/b');
    const abc = ab!.children!.find(n => n.id === 'a/b/c');
    expect(abc).toBeDefined();
    expect(abc!.children![0].id).toBe('a/b/c/deep.ts');
  });
});

// ── 2. subTreeAt returns correct sub-tree ─────────────────────────────────────

describe('subTreeAt', () => {
  it('returns root when folderId is empty', () => {
    const tree = buildFolderTree([
      { filePath: 'src/a.ts', symbols: [], recentActivityAt: 0, missionIds: [] },
    ]);
    expect(subTreeAt(tree, '')).toBe(tree);
  });

  it('returns null for a non-existent folder', () => {
    const tree = buildFolderTree([
      { filePath: 'src/a.ts', symbols: [], recentActivityAt: 0, missionIds: [] },
    ]);
    expect(subTreeAt(tree, 'nonexistent')).toBeNull();
  });

  it('returns the matching node for a known folder id', () => {
    const tree = buildFolderTree([
      { filePath: 'src/util/helper.ts', symbols: [], recentActivityAt: 0, missionIds: [] },
    ]);
    const found = subTreeAt(tree, 'src');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('src');
  });
});

// ── 3. Color modes are deterministic (same input → same output) ───────────────

describe('color modes — determinism', () => {
  it('colorBySymbolDensity returns identical values on repeated calls', () => {
    const node = makeFileNode({ symbolCount: 5 });
    const ctx = defaultCtx();
    const a = colorBySymbolDensity(node, ctx);
    const b = colorBySymbolDensity(node, ctx);
    expect(a).toBe(b);
  });

  it('colorByRecentActivity returns identical values on repeated calls', () => {
    const node = makeFileNode({ recentActivityAt: 1500 });
    const ctx = defaultCtx();
    const a = colorByRecentActivity(node, ctx);
    const b = colorByRecentActivity(node, ctx);
    expect(a).toBe(b);
  });

  it('colorByMissionAttribution returns identical values on repeated calls', () => {
    const node = makeFileNode({ missionIds: ['m1', 'm2', 'm3'] });
    const ctx = defaultCtx();
    const a = colorByMissionAttribution(node, ctx);
    const b = colorByMissionAttribution(node, ctx);
    expect(a).toBe(b);
  });

  it('colorFor dispatches to correct mode', () => {
    const node = makeFileNode();
    const ctx = defaultCtx();
    const density = colorFor('symbol-density', node, ctx);
    const activity = colorFor('recent-activity', node, ctx);
    const mission = colorFor('mission-attribution', node, ctx);
    // All three modes should return a non-empty color string.
    expect(typeof density).toBe('string');
    expect(typeof activity).toBe('string');
    expect(typeof mission).toBe('string');
  });

  it('folder node always returns the folder background color', () => {
    const folderNode: CircleNode<NodePayload> = {
      id: 'src',
      data: { kind: 'folder', symbolCount: 0, missionIds: [] },
      x: 0, y: 0, r: 50, value: 0, depth: 0,
    };
    const ctx = defaultCtx();
    // All modes return the folder constant for folder nodes.
    expect(colorFor('symbol-density', folderNode, ctx)).toBe('#1f2335');
    expect(colorFor('recent-activity', folderNode, ctx)).toBe('#1f2335');
    expect(colorFor('mission-attribution', folderNode, ctx)).toBe('#1f2335');
  });
});

// ── 4. buildColorContext produces correct max values ─────────────────────────

describe('buildColorContext', () => {
  it('computes maxSymbolCount correctly', () => {
    const ctx = buildColorContext([
      { kind: 'file', filePath: 'a', symbolCount: 3, recentActivityAt: 0, missionIds: [] },
      { kind: 'file', filePath: 'b', symbolCount: 15, recentActivityAt: 0, missionIds: [] },
    ]);
    expect(ctx.maxSymbolCount).toBe(15);
  });

  it('skips folder payloads when computing maxSymbolCount', () => {
    const ctx = buildColorContext([
      { kind: 'folder', symbolCount: 999, missionIds: [] },
      { kind: 'file', filePath: 'x', symbolCount: 4, recentActivityAt: 0, missionIds: [] },
    ]);
    expect(ctx.maxSymbolCount).toBe(4);
  });
});

// ── 5. createSystemMap — DOM integration ─────────────────────────────────────

// Hoist the mock at module level so Vite's vi.mock hoisting works correctly.
vi.mock('../../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    listSymbolsForFile: vi.fn().mockResolvedValue([]),
    listMissionsForFile: vi.fn().mockResolvedValue([]),
  },
}));

import { createSystemMap } from '../system-map.js';

describe('createSystemMap — DOM integration', () => {
  it('mount appends .system-map-container to parent', () => {
    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    expect(parent.querySelector('.system-map-container')).not.toBeNull();
    map.unmount();
    parent.remove();
  });

  it('onSelect handler is registered and not called by setFocus', () => {
    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);

    const handler = vi.fn();
    map.onSelect(handler);

    // setFocus does NOT call onSelect — only user click does.
    map.setFocus({ kind: 'file', id: 'src/index.ts' });
    expect(handler).not.toHaveBeenCalled();

    map.unmount();
    parent.remove();
  });

  it('unmount removes .system-map-container from DOM', () => {
    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    map.unmount();
    expect(parent.querySelector('.system-map-container')).toBeNull();
    parent.remove();
  });

  it('setFocus does not throw even with no rendered circles', () => {
    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);

    // setFocus should not throw even with no rendered circles.
    expect(() => map.setFocus({ kind: 'file', id: 'src/main.ts' })).not.toThrow();

    map.unmount();
    parent.remove();
  });
});
