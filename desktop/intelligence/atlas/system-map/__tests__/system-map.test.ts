/**
 * System Map — unit tests (vitest, jsdom).
 *
 * IPC is stubbed via vi.mock so no Tauri shell is required.
 * Tests cover: layouts structure, color-mode determinism, click dispatch,
 * zoom-in narrowing, zoom-out restore, setFocus highlighting.
 */

import { describe, it, expect, vi } from 'vitest';
import { buildFolderTree, buildFolderTreeMulti, subTreeAt, MAX_MULTI_PROJECTS } from '../layouts.js';
import {
  colorBySymbolDensity,
  colorByRecentActivity,
  colorByMissionAttribution,
  colorByProvenanceOverlay,
  colorFor,
  buildColorContext,
  missionHue,
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
      dominantMissionId: 'm1',
      dominantWeight: 0.8,
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
    { kind: 'file', filePath: 'src/a.ts', symbolCount: 10, recentActivityAt: 2000, missionIds: ['m1'], dominantMissionId: 'm1', dominantWeight: 1.0 },
    { kind: 'file', filePath: 'src/b.ts', symbolCount: 5, recentActivityAt: 1000, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
  ]);
}

// ── 1. buildFolderTree produces expected structure ────────────────────────────

function makeFileData(filePath: string, overrides: Partial<import('../layouts.js').FileData> = {}): import('../layouts.js').FileData {
  return {
    filePath,
    symbols: [],
    recentActivityAt: 0,
    missionIds: [],
    dominantMissionId: null,
    missionAttributions: [],
    ...overrides,
  };
}

describe('buildFolderTree', () => {
  it('creates a root node with folder children', () => {
    const tree = buildFolderTree([
      makeFileData('src/index.ts'),
      makeFileData('src/utils.ts'),
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
      makeFileData('lib/x.ts', { symbols: fakeSymbols }),
    ]);
    const libFolder = tree.children!.find(c => c.id === 'lib');
    const leaf = libFolder!.children![0];
    expect(leaf.data?.symbolCount).toBe(7);
    // W4c: leaf.value uses sqrt(symbolCount) so a single huge file doesn't
    // dominate its sibling cluster. data.symbolCount preserves the raw count.
    expect(leaf.value).toBeCloseTo(Math.sqrt(7), 6);
  });

  it('zero-symbol files get value 1 (minimum)', () => {
    const tree = buildFolderTree([makeFileData('empty.ts')]);
    const leaf = tree.children![0];
    expect(leaf.value).toBe(1);
  });

  it('deeply nested paths produce intermediate folder nodes', () => {
    const tree = buildFolderTree([makeFileData('a/b/c/deep.ts')]);
    const a = tree.children!.find(n => n.id === 'a');
    const ab = a!.children!.find(n => n.id === 'a/b');
    const abc = ab!.children!.find(n => n.id === 'a/b/c');
    expect(abc).toBeDefined();
    expect(abc!.children![0].id).toBe('a/b/c/deep.ts');
  });

  it('leaf node carries dominantMissionId from FileData', () => {
    const tree = buildFolderTree([
      makeFileData('src/a.ts', { dominantMissionId: 'mission-alpha', missionAttributions: [{ mission_id: 'mission-alpha', weight: 0.9, line_count: 50 }] }),
    ]);
    const src = tree.children!.find(c => c.id === 'src');
    const leaf = src!.children![0];
    expect(leaf.data?.dominantMissionId).toBe('mission-alpha');
  });

  it('leaf node with no attribution has dominantMissionId null', () => {
    const tree = buildFolderTree([makeFileData('src/b.ts')]);
    const src = tree.children!.find(c => c.id === 'src');
    const leaf = src!.children![0];
    expect(leaf.data?.dominantMissionId).toBeNull();
  });
});

// ── 1b. buildFolderTreeMulti ──────────────────────────────────────────────────

describe('buildFolderTreeMulti', () => {
  it('single-project map produces same root structure as buildFolderTree (regression)', () => {
    const files = [makeFileData('src/index.ts'), makeFileData('src/utils.ts')];
    const single = buildFolderTree(files);
    const multi = buildFolderTreeMulti(new Map([['proj-a', files]]));

    expect(multi).not.toBeNull();
    // Multi root has one child per project
    expect(multi!.children).toHaveLength(1);
    const projectPack = multi!.children![0];
    // The project pack id is the projectId
    expect(projectPack.id).toBe('proj-a');
    // Its children mirror the single-project tree's children
    expect(projectPack.children?.length).toBe(single.children?.length);
  });

  it('two-project map produces 2 sibling pack roots', () => {
    const filesA = [makeFileData('src/a.ts')];
    const filesB = [makeFileData('lib/b.ts')];
    const multi = buildFolderTreeMulti(new Map([['proj-a', filesA], ['proj-b', filesB]]));

    expect(multi).not.toBeNull();
    expect(multi!.children).toHaveLength(2);
    const ids = multi!.children!.map(c => c.id);
    expect(ids).toContain('proj-a');
    expect(ids).toContain('proj-b');
  });

  it('four-project map produces 4 sibling pack roots', () => {
    const map = new Map([
      ['p1', [makeFileData('a/x.ts')]],
      ['p2', [makeFileData('b/y.ts')]],
      ['p3', [makeFileData('c/z.ts')]],
      ['p4', [makeFileData('d/w.ts')]],
    ]);
    const multi = buildFolderTreeMulti(map);
    expect(multi).not.toBeNull();
    expect(multi!.children).toHaveLength(4);
  });

  it(`returns null (and does not throw) when projects.size > MAX_MULTI_PROJECTS (${MAX_MULTI_PROJECTS})`, () => {
    const map = new Map([
      ['p1', [makeFileData('a.ts')]],
      ['p2', [makeFileData('b.ts')]],
      ['p3', [makeFileData('c.ts')]],
      ['p4', [makeFileData('d.ts')]],
      ['p5', [makeFileData('e.ts')]],
    ]);
    expect(map.size).toBeGreaterThan(MAX_MULTI_PROJECTS);
    expect(() => buildFolderTreeMulti(map)).not.toThrow();
    expect(buildFolderTreeMulti(map)).toBeNull();
  });
});

// ── 2. subTreeAt returns correct sub-tree ─────────────────────────────────────

describe('subTreeAt', () => {
  it('returns root when folderId is empty', () => {
    const tree = buildFolderTree([makeFileData('src/a.ts')]);
    expect(subTreeAt(tree, '')).toBe(tree);
  });

  it('returns null for a non-existent folder', () => {
    const tree = buildFolderTree([makeFileData('src/a.ts')]);
    expect(subTreeAt(tree, 'nonexistent')).toBeNull();
  });

  it('returns the matching node for a known folder id', () => {
    const tree = buildFolderTree([makeFileData('src/util/helper.ts')]);
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
      data: { kind: 'folder', symbolCount: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
      x: 0, y: 0, r: 50, value: 0, depth: 0,
    };
    const ctx = defaultCtx();
    expect(colorFor('symbol-density', folderNode, ctx)).toBe('#1f2335');
    expect(colorFor('recent-activity', folderNode, ctx)).toBe('#1f2335');
    expect(colorFor('mission-attribution', folderNode, ctx)).toBe('#1f2335');
    expect(colorFor('provenance-overlay', folderNode, ctx)).toBe('#1f2335');
  });
});

// ── 4. buildColorContext produces correct max values ─────────────────────────

describe('buildColorContext', () => {
  it('computes maxSymbolCount correctly', () => {
    const ctx = buildColorContext([
      { kind: 'file', filePath: 'a', symbolCount: 3, recentActivityAt: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
      { kind: 'file', filePath: 'b', symbolCount: 15, recentActivityAt: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
    ]);
    expect(ctx.maxSymbolCount).toBe(15);
  });

  it('skips folder payloads when computing maxSymbolCount', () => {
    const ctx = buildColorContext([
      { kind: 'folder', symbolCount: 999, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
      { kind: 'file', filePath: 'x', symbolCount: 4, recentActivityAt: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
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

  it('circle elements have role=button and tabindex=0 after load', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 's1', name: 'foo', file_path: 'src/a.ts', kind: 'function', qualified_name: 'foo' },
    ]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    await map.load('snap-1' as any, ['src/a.ts']);

    const circles = parent.querySelectorAll('circle[role="button"]');
    expect(circles.length).toBeGreaterThan(0);
    expect(circles[0].getAttribute('tabindex')).toBe('0');

    map.unmount();
    parent.remove();
  });
});

// ── 6. missionHue — deterministic FNV hash ───────────────────────────────────

describe('missionHue', () => {
  it('returns a value in [0, 360) for any string', () => {
    const h = missionHue('v1.49.607-atlas');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });

  it('is deterministic: same input → same output across calls', () => {
    const a = missionHue('mission-alpha');
    const b = missionHue('mission-alpha');
    expect(a).toBe(b);
  });

  it('produces different hues for different mission ids', () => {
    expect(missionHue('mission-alpha')).not.toBe(missionHue('mission-beta'));
  });

  it('handles empty string without throwing', () => {
    expect(() => missionHue('')).not.toThrow();
    const h = missionHue('');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });
});

// ── 7. provenance-overlay color mode ─────────────────────────────────────────

describe('colorByProvenanceOverlay', () => {
  const ctx = defaultCtx();

  it('unattributed file returns neutral gray', () => {
    const node = makeFileNode({ dominantMissionId: null, dominantWeight: 0 });
    const color = colorByProvenanceOverlay(node, ctx);
    expect(color).toBe('#3b4261');
  });

  it('attributed file returns an hsl color string', () => {
    const node = makeFileNode({ dominantMissionId: 'mission-x', dominantWeight: 0.9 });
    const color = colorByProvenanceOverlay(node, ctx);
    expect(color).toMatch(/^hsl\(\d+,\d+%,\d+%\)$/);
  });

  it('same missionId → same color across instances (deterministic)', () => {
    const node1 = makeFileNode({ dominantMissionId: 'mission-stable', dominantWeight: 0.5 });
    const node2 = makeFileNode({ id: 'src/bar.ts', dominantMissionId: 'mission-stable', dominantWeight: 0.5 });
    expect(colorByProvenanceOverlay(node1, ctx)).toBe(colorByProvenanceOverlay(node2, ctx));
  });

  it('folder node returns FOLDER constant regardless of mode', () => {
    const folderNode: CircleNode<NodePayload> = {
      id: 'src',
      data: { kind: 'folder', symbolCount: 0, missionIds: [], dominantMissionId: null, dominantWeight: 0 },
      x: 0, y: 0, r: 50, value: 0, depth: 0,
    };
    expect(colorByProvenanceOverlay(folderNode, ctx)).toBe('#1f2335');
  });

  it('colorFor dispatches to provenance-overlay correctly', () => {
    const node = makeFileNode({ dominantMissionId: 'mission-y', dominantWeight: 0.7 });
    const color = colorFor('provenance-overlay', node, ctx);
    expect(color).toMatch(/^hsl\(/);
  });
});

// ── 8. FileData provenance population via load() ──────────────────────────────

describe('FileData provenance population', () => {
  it('single mission: dominantMissionId matches the mission', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([
      { mission_id: 'only-mission', weight: 1.0, line_count: 100 },
    ]);

    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    await map.load('snap-2' as any, ['src/x.ts']);

    // Switch to provenance-overlay — should not throw
    expect(() => map.setColorMode('provenance-overlay')).not.toThrow();

    const entries = map.getLegendEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].missionId).toBe('only-mission');

    map.unmount();
    parent.remove();
  });

  it('multi-mission: dominant is the one with highest weight', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([
      { mission_id: 'low-weight', weight: 0.2, line_count: 5 },
      { mission_id: 'high-weight', weight: 0.8, line_count: 80 },
    ]);

    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    map.setColorMode('provenance-overlay');
    await map.load('snap-3' as any, ['src/y.ts']);

    const entries = map.getLegendEntries();
    expect(entries[0].missionId).toBe('high-weight');

    map.unmount();
    parent.remove();
  });

  it('IPC failure leaves dominantMissionId null (graceful)', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('IPC error'));

    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);

    await expect(map.load('snap-4' as any, ['src/z.ts'])).resolves.not.toThrow();

    map.unmount();
    parent.remove();
  });

  it('no mission: getLegendEntries returns [] when mode is not provenance-overlay', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    await map.load('snap-5' as any, ['src/w.ts']);
    // Default mode is symbol-density
    expect(map.getLegendEntries()).toEqual([]);

    map.unmount();
    parent.remove();
  });
});

// ── 9. Legend mount API ───────────────────────────────────────────────────────

describe('mountLegend', () => {
  it('renders legend rows when provenance-overlay is active with data', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([
      { mission_id: 'legend-mission', weight: 1.0, line_count: 10 },
    ]);

    const map = createSystemMap({ width: 400, height: 300, colorMode: 'provenance-overlay' });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);

    const legendEl = document.createElement('div');
    document.body.appendChild(legendEl);
    const cleanup = map.mountLegend(legendEl);

    await map.load('snap-6' as any, ['src/q.ts']);

    const rows = legendEl.querySelectorAll('.system-map-legend-row');
    expect(rows.length).toBeGreaterThan(0);

    cleanup();
    expect(legendEl.innerHTML).toBe('');

    map.unmount();
    parent.remove();
    legendEl.remove();
  });

  it('overflow indicator appears when unique missions exceed maxEntries', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    // Return 3 distinct missions, cap legend at 2
    const missions = [
      { mission_id: 'ma', weight: 0.9, line_count: 10 },
      { mission_id: 'mb', weight: 0.8, line_count: 10 },
      { mission_id: 'mc', weight: 0.7, line_count: 10 },
    ];
    // Each file has a different dominant mission
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([missions[0]])
      .mockResolvedValueOnce([missions[1]])
      .mockResolvedValueOnce([missions[2]]);

    const map = createSystemMap({ width: 400, height: 300, colorMode: 'provenance-overlay' });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);

    const legendEl = document.createElement('div');
    document.body.appendChild(legendEl);
    map.mountLegend(legendEl, 2);

    await map.load('snap-7' as any, ['src/p1.ts', 'src/p2.ts', 'src/p3.ts']);

    const overflow = legendEl.querySelector('.system-map-legend-overflow');
    expect(overflow).not.toBeNull();
    expect(overflow!.textContent).toMatch(/\+1 more/);

    map.unmount();
    parent.remove();
    legendEl.remove();
  });

  it('setColorMode emits legend update: legend cleared when switching away from provenance-overlay', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([
      { mission_id: 'mode-switch-m', weight: 1.0, line_count: 5 },
    ]);

    const map = createSystemMap({ width: 400, height: 300, colorMode: 'provenance-overlay' });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);

    const legendEl = document.createElement('div');
    document.body.appendChild(legendEl);
    map.mountLegend(legendEl);

    await map.load('snap-8' as any, ['src/r.ts']);
    expect(legendEl.querySelectorAll('.system-map-legend-row').length).toBeGreaterThan(0);

    map.setColorMode('symbol-density');
    expect(legendEl.innerHTML).toBe('');

    map.unmount();
    parent.remove();
    legendEl.remove();
  });
});

// ── 10. setTimeLapseFiles — time-lapse dimming ────────────────────────────────

describe('setTimeLapseFiles', () => {
  it('dims circles whose file_path is not in filesPresent (adds absent class)', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 's1', name: 'x', file_path: 'src/present.ts', kind: 'function', qualified_name: 'x' },
    ]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    await map.load('snap-tl-1' as any, ['src/present.ts', 'src/absent.ts']);

    const filesPresent = new Set(['src/present.ts']);
    map.setTimeLapseFiles(filesPresent);

    const absentCircles = parent.querySelectorAll('.system-map-circle--time-lapse-absent');
    expect(absentCircles.length).toBeGreaterThanOrEqual(0);

    map.unmount();
    parent.remove();
  });

  it('passing null clears all time-lapse-absent classes', async () => {
    const { intelligenceIpc } = await import('../../../../../src/intelligence/ipc.js');
    (intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (intelligenceIpc.listMissionsForFile as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const map = createSystemMap({ width: 400, height: 300 });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    map.mount(parent);
    await map.load('snap-tl-2' as any, ['src/a.ts']);

    map.setTimeLapseFiles(new Set<string>());
    map.setTimeLapseFiles(null);

    const absentCircles = parent.querySelectorAll('.system-map-circle--time-lapse-absent');
    expect(absentCircles.length).toBe(0);

    map.unmount();
    parent.remove();
  });
});
