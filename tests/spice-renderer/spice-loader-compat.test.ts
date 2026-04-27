/**
 * @vitest-environment jsdom
 *
 * tests/spice-renderer/spice-loader-compat.test.ts
 *
 * Migration Option A backward-compat tests for the v2.0.0 spice-loader.js.
 * The loader now mounts the new <spice-viewer> custom element internally
 * but preserves the v1.0 SpiceRuntime API (.start/.pause/.reset/.setMode/
 * .destroy/.getProbes) so that the 62 existing per-degree NASA HTML files
 * keep working without per-file edits.
 *
 * Strategy:
 *   - Stub the dynamic import path via the loader's __setRendererModuleForTests
 *     hook (avoids touching the real spice-renderer/index.js at module-resolve
 *     time, which may not be built yet).
 *   - Build a fake <spice-viewer> with hooks that record calls; assert the
 *     adapter delegates correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Fake <spice-viewer> custom element. Records calls so we can assert
// delegation behaviour from the adapter wrapper returned by loadSpiceNet.
// ---------------------------------------------------------------------------

interface ViewerCallLog {
  start: number;
  pause: number;
  reset: number;
  destroy: number;
  setTheme: string[];
  getProbes: number;
  ready: number;
}

let viewerLog: ViewerCallLog;

function freshViewerLog(): ViewerCallLog {
  return { start: 0, pause: 0, reset: 0, destroy: 0, setTheme: [], getProbes: 0, ready: 0 };
}

function defineFakeViewer(): void {
  if (customElements.get('spice-viewer')) return;
  class FakeSpiceViewer extends HTMLElement {
    private _ready = Promise.resolve();
    ready() { viewerLog.ready++; return this._ready; }
    start() { viewerLog.start++; }
    pause() { viewerLog.pause++; }
    reset() { viewerLog.reset++; }
    destroy() { viewerLog.destroy++; }
    getProbes() { viewerLog.getProbes++; return ['out', 'mid']; }
    setTheme(t: string) { viewerLog.setTheme.push(t); this.setAttribute('theme', t); }
  }
  customElements.define('spice-viewer', FakeSpiceViewer);
}

const fakeRendererModule = {
  registerViewer: () => defineFakeViewer(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const LOADER_PATH =
  '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-loader.js';

async function importLoaderFresh() {
  vi.resetModules();
  return await import(LOADER_PATH);
}

describe('spice-loader v2.0.0 — Migration Option A backward-compat', () => {
  let container: HTMLElement;

  beforeEach(() => {
    viewerLog = freshViewerLog();
    container = document.createElement('div');
    document.body.appendChild(container);
    defineFakeViewer();
    // Stub fetch so the legacy fallback path can also run if exercised.
    (globalThis as any).fetch = vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve('* empty netlist\n.tran 1m 1\n'),
    }));
    // jsdom does not implement requestAnimationFrame in older versions; polyfill.
    if (typeof (globalThis as any).requestAnimationFrame !== 'function') {
      (globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
      (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
    }
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('exports LOADER_VERSION = "2.0.0"', async () => {
    const mod = await importLoaderFresh();
    expect(mod.LOADER_VERSION).toBe('2.0.0');
    expect(mod.__harnessVersion).toBe('2.0.0');
  });

  it('mounts <spice-viewer> when renderer module is available and returns runtime with v1 API', async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);

    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    // Legacy API surface must be present
    expect(typeof runtime.start).toBe('function');
    expect(typeof runtime.pause).toBe('function');
    expect(typeof runtime.reset).toBe('function');
    expect(typeof runtime.setMode).toBe('function');
    expect(typeof runtime.destroy).toBe('function');
    expect(typeof runtime.getProbes).toBe('function');

    // <spice-viewer> mounted with theme='modern-dark' (NASA per-degree default)
    const viewer = container.querySelector('spice-viewer');
    expect(viewer).not.toBeNull();
    expect(viewer!.getAttribute('cir-src')).toBe('./fake.cir');
    expect(viewer!.getAttribute('theme')).toBe('modern-dark');
    expect(viewer!.getAttribute('show-sidebar')).toBe('true');

    // ready() was awaited
    expect(viewerLog.ready).toBe(1);

    // delegation
    runtime.start(); expect(viewerLog.start).toBe(1);
    runtime.pause(); expect(viewerLog.pause).toBe(1);
    runtime.reset(); expect(viewerLog.reset).toBe(1);
    expect(runtime.getProbes()).toEqual(['out', 'mid']);
  });

  it('falls back to legacy v1 path when renderer module fails to import', async () => {
    const mod = await importLoaderFresh();
    // Force the fallback by providing a null renderer module
    mod.__setRendererModuleForTests(null);

    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    // Legacy path constructs its own DOM (hud + viz + status), NOT a <spice-viewer>
    expect(container.querySelector('spice-viewer')).toBeNull();
    expect(container.querySelector('.runner-hud')).not.toBeNull();
    expect(container.querySelector('.runner-status')).not.toBeNull();

    // API surface still intact
    expect(typeof runtime.start).toBe('function');
    expect(typeof runtime.setMode).toBe('function');
    expect(typeof runtime.destroy).toBe('function');

    runtime.destroy();
  });

  it("setMode('classic-ltspice') triggers theme switch on viewer", async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    await runtime.setMode('classic-ltspice');

    expect(viewerLog.setTheme).toContain('classic-ltspice');
    const viewer = container.querySelector('spice-viewer')!;
    expect(viewer.getAttribute('theme')).toBe('classic-ltspice');
  });

  it("setMode('pro-qspice') triggers theme switch on viewer", async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    await runtime.setMode('pro-qspice');

    expect(viewerLog.setTheme).toContain('pro-qspice');
  });

  it("setMode('circuitjs2') is a silent no-op + console.info (legacy engine toggle)", async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await runtime.setMode('circuitjs2');

    expect(viewerLog.setTheme).toEqual([]); // no theme switch
    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy.mock.calls[0][0]).toMatch(/legacy engine toggle is now a no-op/);

    infoSpy.mockRestore();
  });

  it("setMode('ngspice-wasm') is a silent no-op + console.info", async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await runtime.setMode('ngspice-wasm');

    expect(viewerLog.setTheme).toEqual([]);
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });

  it('setMode rejects unknown modes', async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    await expect(runtime.setMode('not-a-real-mode')).rejects.toBeInstanceOf(RangeError);
  });

  it('destroy clears the container and delegates to viewer', async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    const runtime = await mod.loadSpiceNet('./fake.cir', container, 'circuitjs2');

    expect(container.querySelector('spice-viewer')).not.toBeNull();
    runtime.destroy();
    expect(viewerLog.destroy).toBe(1);
    expect(container.children.length).toBe(0);
    expect(container.dataset.runnerType).toBeUndefined();
  });

  it('throws TypeError on bad cirUrl', async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    await expect(mod.loadSpiceNet('', container)).rejects.toBeInstanceOf(TypeError);
  });

  it('throws TypeError on bad container', async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    await expect(mod.loadSpiceNet('./x.cir', null as any)).rejects.toBeInstanceOf(TypeError);
  });

  it('throws RangeError on unknown initial mode', async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    await expect(mod.loadSpiceNet('./x.cir', container, 'fictional-engine' as any))
      .rejects.toBeInstanceOf(RangeError);
  });

  it('passes through a theme string as initial mode and uses it directly', async () => {
    const mod = await importLoaderFresh();
    mod.__setRendererModuleForTests(fakeRendererModule);
    await mod.loadSpiceNet('./fake.cir', container, 'pro-qspice');

    const viewer = container.querySelector('spice-viewer')!;
    expect(viewer.getAttribute('theme')).toBe('pro-qspice');
    expect(viewer.getAttribute('show-sidebar')).toBe('false'); // sidebar only for modern-dark
  });
});
