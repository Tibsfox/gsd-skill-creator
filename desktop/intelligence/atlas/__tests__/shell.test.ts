/**
 * @vitest-environment jsdom
 *
 * shell.ts — unit tests (minimum 6).
 *
 * Child views are mocked so no WebGL / IPC / canvas is required.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Focus } from '../focus-state.js';

// ── Shared mock tracking ─────────────────────────────────────────────────────

interface MockView {
  focusCalls: Focus[];
  selectHandlers: Array<(f: Focus) => void>;
  triggerSelect(f: Focus): void;
}

function makeMockView(): MockView {
  const view: MockView = {
    focusCalls: [],
    selectHandlers: [],
    triggerSelect(f: Focus) {
      for (const h of view.selectHandlers) h(f);
    },
  };
  return view;
}

// Mocks must be declared before any imports of the mocked modules.
const systemMapView = makeMockView();
const archeologyView = makeMockView();
const codeView = makeMockView();
const paletteSelectHandlers: Array<(entry: { id: string; kind: string }) => void> = [];
let paletteIsOpen = false;

vi.mock('../system-map/index.js', () => ({
  createSystemMap: () => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    setFocus: (f: Focus) => systemMapView.focusCalls.push(f),
    onSelect: (h: (f: Focus) => void) => systemMapView.selectHandlers.push(h),
    load: vi.fn().mockResolvedValue(undefined),
    setColorMode: vi.fn(),
  }),
}));

vi.mock('../symbol-graph/index.js', () => ({
  SymbolGraphView: class {
    focusCalls: Focus[] = [];
    selectHandlers: Array<(sel: any) => void> = [];
    constructor(_canvas: HTMLCanvasElement) {}
    setFocus(_f: any) { return Promise.resolve(); }
    onSelect(h: (sel: any) => void) {
      this.selectHandlers.push(h);
      return () => {};
    }
    dispose() {}
  },
}));

vi.mock('../archeology/index.js', () => ({
  createArcheologyView: () => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    setMissions: vi.fn(),
    setFocus: (id: string | null) => {
      if (id) archeologyView.focusCalls.push({ kind: 'mission', id });
    },
    primeMissionRows: vi.fn(),
    onSelect: (h: (e: { missionId: string }) => void) =>
      archeologyView.selectHandlers.push((f: Focus) => h({ missionId: f.id })),
  }),
}));

vi.mock('../code-view/index.js', () => ({
  createCodeView: (_opts: any) => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    setFocus: (t: { file: string; line: number; symbol_id?: string }) =>
      codeView.focusCalls.push({ kind: t.symbol_id ? 'symbol' : 'file', id: t.file || t.symbol_id! }),
    bindSymbols: vi.fn(),
  }),
}));

vi.mock('../search-palette/index.js', () => ({
  SearchPalette: class {
    private events: { onSelect: (e: any) => void };
    constructor(events: { onSelect: (e: any) => void }, _opts?: any) {
      this.events = events;
      paletteSelectHandlers.push(events.onSelect);
    }
    setAtlasState(s: any) { paletteAtlasState = s; }
    openPalette() { paletteIsOpen = true; }
    close() { paletteIsOpen = false; }
    isOpen() { return paletteIsOpen; }
  },
}));

let indexingCompletedCb: (() => void) | null = null;
let paletteAtlasState: any = null;

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    listProvenanceForLine: vi.fn().mockResolvedValue([]),
    getSymbol: vi.fn().mockResolvedValue(null),
    listSymbolsForFile: vi.fn().mockResolvedValue([
      { id: 's1', name: 'parseHash', file_path: 'src/focus-state.ts' },
    ]),
    listFilesChangedByMission: vi.fn().mockResolvedValue([]),
    on: {
      atlasIndexingCompleted: vi.fn().mockImplementation((cb: () => void) => {
        indexingCompletedCb = cb;
        return Promise.resolve(() => {});
      }),
    },
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { createAtlasShell } from '../shell.js';
import { createCoordinator } from '../coordinator.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AtlasShell', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    systemMapView.focusCalls.length = 0;
    systemMapView.selectHandlers.length = 0;
    archeologyView.focusCalls.length = 0;
    archeologyView.selectHandlers.length = 0;
    codeView.focusCalls.length = 0;
    paletteIsOpen = false;
    paletteAtlasState = null;
    indexingCompletedCb = null;
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts a .atlas-shell element into the host', () => {
    const shell = createAtlasShell();
    shell.mount(host);
    expect(host.querySelector('.atlas-shell')).toBeTruthy();
    shell.unmount();
  });

  it('unmount removes the shell element', () => {
    const shell = createAtlasShell();
    shell.mount(host);
    shell.unmount();
    expect(host.querySelector('.atlas-shell')).toBeNull();
  });

  it('coordinator focus dispatches setFocus to all child views', () => {
    const coordinator = createCoordinator();
    const shell = createAtlasShell({ coordinator });
    shell.mount(host);

    coordinator.dispatch({ kind: 'mission', id: 'v1.49.606' });

    // archeology receives mission focus
    expect(archeologyView.focusCalls.some(f => f.id === 'v1.49.606')).toBe(true);

    shell.unmount();
  });

  it('coordinator file focus propagates to code view', () => {
    const coordinator = createCoordinator();
    const shell = createAtlasShell({ coordinator });
    shell.mount(host);

    coordinator.dispatch({ kind: 'file', id: 'src/main.ts' });

    expect(codeView.focusCalls.some(f => f.id === 'src/main.ts')).toBe(true);
    shell.unmount();
  });

  it('system-map selection triggers coordinator dispatch', () => {
    const coordinator = createCoordinator();
    const received: Array<Focus | null> = [];
    coordinator.subscribe(f => received.push(f));

    const shell = createAtlasShell({ coordinator });
    shell.mount(host);

    // Simulate system-map emitting a file selection
    systemMapView.triggerSelect({ kind: 'file', id: 'src/atlas.ts' });

    expect(received.some(f => f?.id === 'src/atlas.ts')).toBe(true);
    shell.unmount();
  });

  it('Cmd-K opens the palette', () => {
    const shell = createAtlasShell();
    shell.mount(host);

    const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
    document.dispatchEvent(ev);

    expect(paletteIsOpen).toBe(true);
    shell.unmount();
  });

  it('Escape closes the palette when open', () => {
    const shell = createAtlasShell();
    shell.mount(host);

    // Open first
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    expect(paletteIsOpen).toBe(true);

    // Then close
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(paletteIsOpen).toBe(false);

    shell.unmount();
  });

  it('splitter elements are present in DOM after mount', () => {
    const shell = createAtlasShell();
    shell.mount(host);

    const splitters = host.querySelectorAll('.atlas-splitter');
    expect(splitters.length).toBeGreaterThanOrEqual(3); // col + row-top + row-mid

    shell.unmount();
  });

  it('column splitter has tabindex=0 and role=separator', () => {
    const shell = createAtlasShell();
    shell.mount(host);

    const col = host.querySelector('.atlas-splitter--col');
    expect(col).not.toBeNull();
    expect(col!.getAttribute('tabindex')).toBe('0');
    expect(col!.getAttribute('role')).toBe('separator');

    shell.unmount();
  });

  it('ArrowRight on column splitter increments aria-valuenow by 2', () => {
    const shell = createAtlasShell();
    shell.mount(host);

    const col = host.querySelector<HTMLElement>('.atlas-splitter--col')!;
    const before = Number(col.getAttribute('aria-valuenow'));
    col.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const after = Number(col.getAttribute('aria-valuenow'));
    expect(after).toBe(before + 2);

    shell.unmount();
  });

  it('Home key on column splitter jumps to minimum (10)', () => {
    const shell = createAtlasShell();
    shell.mount(host);

    const col = host.querySelector<HTMLElement>('.atlas-splitter--col')!;
    col.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(Number(col.getAttribute('aria-valuenow'))).toBe(10);

    shell.unmount();
  });

  it('first Cmd-K open triggers IPC fetch and populates atlas state', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    const listSpy = intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>;
    listSpy.mockClear();

    const shell = createAtlasShell();
    shell.mount(host);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(paletteAtlasState).not.toBeNull();

    shell.unmount();
  });

  it('second Cmd-K open uses cache (no second IPC fetch)', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    const listSpy = intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>;
    listSpy.mockClear();

    const shell = createAtlasShell();
    shell.mount(host);

    // First open
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    // Close and reopen
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(listSpy).toHaveBeenCalledTimes(1); // still 1, no second call

    shell.unmount();
  });

  it('atlas:indexing.completed invalidates cache causing re-fetch on next open', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    const listSpy = intelligenceIpc.listSymbolsForFile as ReturnType<typeof vi.fn>;
    listSpy.mockClear();

    const shell = createAtlasShell();
    shell.mount(host);

    // First open — populates cache
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(listSpy).toHaveBeenCalledTimes(1);

    // Simulate indexing.completed → invalidates cache
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (indexingCompletedCb) indexingCompletedCb();

    // Second open — should re-fetch
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(listSpy).toHaveBeenCalledTimes(2);

    shell.unmount();
  });

  it('ARIA focus announcer element is present in shell DOM', () => {
    const shell = createAtlasShell();
    shell.mount(host);

    const announcer = host.querySelector('#atlas-focus-announcer');
    expect(announcer).not.toBeNull();
    expect(announcer!.getAttribute('role')).toBe('status');
    expect(announcer!.getAttribute('aria-live')).toBe('polite');

    shell.unmount();
  });
});
