/**
 * @vitest-environment jsdom
 *
 * tests/spice-renderer/viewer-shell.test.ts
 *
 * Mission v1.49.581 Phase B.1 wave-3 — <spice-viewer> custom element.
 *
 * jsdom + Vitest. Canvas is shimmed because jsdom has no canvas backend.
 * fetch is mocked per-test for cir/raw URLs.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SpiceViewer, registerViewer } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/viewer-shell.js';
import type { Theme } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/types.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SYMBOL_DIR = resolve(
  REPO_ROOT,
  'www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/spice-symbols',
);

// ── Symbol cache (so the embedded SchematicRenderer doesn't fetch) ─────────
function loadSymbolCache(): Map<string, string> {
  const cache = new Map<string, string>();
  for (const f of readdirSync(SYMBOL_DIR).filter((n) => n.endsWith('.svg'))) {
    cache.set(`./${f}`, readFileSync(resolve(SYMBOL_DIR, f), 'utf8'));
  }
  return cache;
}
const SYMBOL_CACHE = loadSymbolCache();

// ── Tiny fixtures ─────────────────────────────────────────────────────────
const SIMPLE_CIR = `* simple
.title Simple RC
V1 in 0 DC 5
R1 in mid 1k
C1 mid 0 1u
.tran 1u 1m
.end
`;

// ── Canvas shim ───────────────────────────────────────────────────────────
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = function () {
    return {
      fillStyle: '', strokeStyle: '', lineWidth: 1, font: '',
      textAlign: 'left', textBaseline: 'alphabetic',
      lineJoin: 'round', lineCap: 'round',
      fillRect: () => {}, strokeRect: () => {}, fillText: () => {},
      beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
      stroke: () => {}, setLineDash: () => {}, setTransform: () => {},
      save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {},
      clearRect: () => {}, drawImage: () => {},
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).toBlob = function (cb: (b: Blob) => void) {
    setTimeout(() => cb(new Blob(['png-stub'], { type: 'image/png' })), 0);
  };
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true, get() { return 800; },
  });

  // Polyfill ResizeObserver if missing.
  if (typeof (globalThis as any).ResizeObserver === 'undefined') {
    (globalThis as any).ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }

  // jsdom requires registration before `SpiceViewer.create()` works. Register
  // here so all tests can construct directly. The class supports an optional
  // init bag — but since custom-element constructors cannot accept args, we
  // also expose a static helper for tests that need init.
  registerViewer();
});

beforeEach(() => {
  // Clear any registered handlers / DOM each test.
  document.body.innerHTML = '';
  try { localStorage.clear(); } catch { /* noop */ }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper: wait for next microtask to allow async init to settle.
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

// ─────────────────────────────────────────────────────────────────────────
describe('SpiceViewer — construction', () => {
  it('extends HTMLElement and is instantiable programmatically', () => {
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    expect(v).toBeInstanceOf(HTMLElement);
    expect(v.shadowRoot).toBeNull(); // built on connect
  });

  it('builds shadow DOM on connect with toolbar + panes + sidebar', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    expect(v.shadowRoot).not.toBeNull();
    const root = v.shadowRoot!;
    expect(root.querySelector('.toolbar')).toBeTruthy();
    expect(root.querySelector('.split-container')).toBeTruthy();
    expect(root.querySelector('.sidebar')).toBeTruthy();
    expect(root.querySelector('.schematic-pane')).toBeTruthy();
    expect(root.querySelector('.waveform-pane')).toBeTruthy();
    expect(root.querySelector('.split-handle')).toBeTruthy();
  });
});

describe('SpiceViewer — schematic mounting from cirText', () => {
  it('mounts the schematic renderer when cirText is provided', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    const svg = v.shadowRoot!.querySelector('.schematic-pane svg');
    expect(svg).toBeTruthy();
    expect(v.schematic).not.toBeNull();
    expect(v.schematic!.components.length).toBeGreaterThan(0);
  });

  it('shows the placeholder when no rawSrc is configured', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    const ph = v.shadowRoot!.querySelector('.waveform-placeholder');
    expect(ph).toBeTruthy();
    expect(ph!.textContent).toMatch(/Run analysis/);
  });
});

describe('SpiceViewer — theme', () => {
  it('applies default modern-dark theme to host', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    expect(v.getAttribute('data-theme')).toBe('modern-dark');
  });

  it('setTheme propagates to data-theme and persists to localStorage', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    v.setTheme('classic-ltspice');
    expect(v.getAttribute('data-theme')).toBe('classic-ltspice');
    expect(localStorage.getItem('nasa-spice-theme')).toBe('classic-ltspice');
  });

  it('rejects unknown themes', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    v.setTheme('not-a-theme' as unknown as Theme);
    expect(v.getAttribute('data-theme')).toBe('modern-dark');
  });

  it('reads stored theme from localStorage when no init/attribute provided', async () => {
    localStorage.setItem('nasa-spice-theme', 'pro-qspice');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    expect(v.getAttribute('data-theme')).toBe('pro-qspice');
  });
});

describe('SpiceViewer — sidebar visibility per theme', () => {
  it('hides sidebar by default for classic-ltspice', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({
      cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE,
      theme: 'classic-ltspice',
    });
    host.appendChild(v);
    await flush();
    const sidebar = v.shadowRoot!.querySelector('.sidebar');
    expect(sidebar!.classList.contains('hidden')).toBe(true);
  });

  it('shows sidebar by default for modern-dark', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({
      cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE,
      theme: 'modern-dark',
    });
    host.appendChild(v);
    await flush();
    const sidebar = v.shadowRoot!.querySelector('.sidebar');
    expect(sidebar!.classList.contains('hidden')).toBe(false);
  });

  it('honours show-sidebar="true" override for non-modern-dark themes', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({
      cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE,
      theme: 'pro-qspice', showSidebar: true,
    });
    host.appendChild(v);
    await flush();
    const sidebar = v.shadowRoot!.querySelector('.sidebar');
    expect(sidebar!.classList.contains('hidden')).toBe(false);
  });
});

describe('SpiceViewer — probes', () => {
  it('addProbe inserts an entry in the probe list', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();

    v.addProbe('mid');
    const items = v.shadowRoot!.querySelectorAll('.probe-list li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toMatch(/mid/);
    expect(v.getProbes()).toEqual(['mid']);
  });

  it('removeProbe deletes the entry', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    v.addProbe('mid');
    v.addProbe('in');
    expect(v.getProbes()).toEqual(['mid', 'in']);
    v.removeProbe('mid');
    expect(v.getProbes()).toEqual(['in']);
    expect(v.shadowRoot!.querySelectorAll('.probe-list li').length).toBe(1);
  });

  it('does not duplicate an existing probe', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    v.addProbe('mid');
    v.addProbe('mid');
    expect(v.getProbes()).toEqual(['mid']);
  });
});

describe('SpiceViewer — split ratio', () => {
  it('applies initial split ratio as a CSS variable on the host', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({
      cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE, splitRatio: 0.4,
    });
    host.appendChild(v);
    await flush();
    expect(v.style.getPropertyValue('--split-ratio')).toBe('0.4');
  });

  it('clamps split-ratio attribute changes between 0.2 and 0.8', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    v.setAttribute('split-ratio', '0.9');
    expect(parseFloat(v.style.getPropertyValue('--split-ratio'))).toBeLessThanOrEqual(0.8);
    v.setAttribute('split-ratio', '0.05');
    expect(parseFloat(v.style.getPropertyValue('--split-ratio'))).toBeGreaterThanOrEqual(0.2);
  });
});

describe('SpiceViewer — export', () => {
  it('exportPNG returns a Blob', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    const blob = await v.exportPNG();
    expect(blob).toBeInstanceOf(Blob);
  });

  it('exportSVG returns serialized SVG of the schematic', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    const svg = await v.exportSVG();
    expect(typeof svg).toBe('string');
    expect(svg).toMatch(/<svg/);
  });
});

describe('SpiceViewer — destroy', () => {
  it('removes itself from DOM and tears down sub-renderers', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    expect(host.contains(v)).toBe(true);
    v.destroy();
    expect(host.contains(v)).toBe(false);
  });
});

describe('SpiceViewer — fetch path', () => {
  it('fetches cir-src URL when cirText not provided', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('.cir')) {
        return new Response(SIMPLE_CIR, { status: 200 });
      }
      return new Response('', { status: 404 });
    });
    (globalThis as any).fetch = fetchMock as any;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirSrc: 'http://test/circuit.cir', symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    await flush();
    expect(fetchMock).toHaveBeenCalled();
    expect(v.schematic).not.toBeNull();
  });
});

describe('registerViewer', () => {
  it('registers <spice-viewer> with customElements (idempotent)', () => {
    registerViewer();
    expect(customElements.get('spice-viewer')).toBeTruthy();
    // calling again is a no-op
    registerViewer();
    expect(customElements.get('spice-viewer')).toBeTruthy();
  });
});

describe('SpiceViewer — analysis sidebar', () => {
  it('populates analysis list from .tran directive in the netlist', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    const items = v.shadowRoot!.querySelectorAll('.analysis-list li');
    expect(items.length).toBeGreaterThanOrEqual(1);
    const tran = Array.from(items).find((li) => (li as HTMLElement).dataset.kind === 'tran');
    expect(tran).toBeTruthy();
    expect(tran!.classList.contains('active')).toBe(true);
  });
});

describe('SpiceViewer — components sidebar', () => {
  it('lists every component ref from the netlist', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    const items = v.shadowRoot!.querySelectorAll('.component-list li');
    const refs = Array.from(items).map((li) => (li as HTMLElement).dataset.ref);
    expect(refs).toContain('R1');
    expect(refs).toContain('C1');
    expect(refs).toContain('V1');
  });

  it('clicking a component adds a probe', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    const r1 = v.shadowRoot!.querySelector('.component-list li[data-ref="R1"]') as HTMLElement | null;
    expect(r1).toBeTruthy();
    r1!.click();
    expect(v.getProbes().length).toBeGreaterThan(0);
  });
});

describe('SpiceViewer — reset', () => {
  it('clears probes and waveform pane', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({ cirText: SIMPLE_CIR, symbolCache: SYMBOL_CACHE });
    host.appendChild(v);
    await flush();
    v.addProbe('mid');
    v.addProbe('in');
    expect(v.getProbes().length).toBe(2);
    v.reset();
    expect(v.getProbes()).toEqual([]);
    expect(v.shadowRoot!.querySelector('.waveform-placeholder')).toBeTruthy();
  });
});
