/**
 * @vitest-environment jsdom
 *
 * tests/spice-renderer/integration.test.ts
 *
 * Mission v1.49.581 Phase B.1 wave-3 — full pipeline integration test.
 *
 * Loads the real alpha-scattering-detector.cir fixture (NASA 1.62), runs
 * parseCir → autoLayout → SchematicRenderer → SpiceViewer, and verifies the
 * whole pipeline produces the expected DOM artifacts under each of the three
 * canonical themes.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SpiceViewer, registerViewer } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/viewer-shell.js';
import { parseCir } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/cir-parser.js';
import { autoLayout } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/auto-layout.js';
import type { Theme } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/types.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SYMBOL_DIR = resolve(
  REPO_ROOT,
  'www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/spice-symbols',
);
const ALPHA_CIR_PATH = resolve(
  REPO_ROOT,
  'www/tibsfox/com/Research/NASA/1.62/artifacts/circuits/alpha-scattering-detector.cir',
);

function loadSymbolCache(): Map<string, string> {
  const cache = new Map<string, string>();
  for (const f of readdirSync(SYMBOL_DIR).filter((n) => n.endsWith('.svg'))) {
    cache.set(`./${f}`, readFileSync(resolve(SYMBOL_DIR, f), 'utf8'));
  }
  return cache;
}
const SYMBOL_CACHE = loadSymbolCache();

const ALPHA_CIR = existsSync(ALPHA_CIR_PATH)
  ? readFileSync(ALPHA_CIR_PATH, 'utf8')
  : null;

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
  if (typeof (globalThis as any).ResizeObserver === 'undefined') {
    (globalThis as any).ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
  registerViewer();
});

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

describe('SpiceViewer integration — alpha-scattering-detector pipeline', () => {
  it('loads the real .cir fixture from disk', () => {
    expect(ALPHA_CIR).not.toBeNull();
    expect(ALPHA_CIR!.length).toBeGreaterThan(0);
    expect(ALPHA_CIR).toMatch(/Surveyor 5 alpha-scattering/);
  });

  it('parseCir + autoLayout produce a non-empty IR', () => {
    if (!ALPHA_CIR) return;
    const parsed = parseCir(ALPHA_CIR);
    expect(parsed.ir.components.length).toBeGreaterThan(5);
    const laid = autoLayout(parsed.ir);
    expect(laid.ir.components.every((c) =>
      Number.isFinite(c.geom.pos.x) && Number.isFinite(c.geom.pos.y),
    )).toBe(true);
    expect(laid.ir.bbox.w).toBeGreaterThan(0);
    expect(laid.ir.bbox.h).toBeGreaterThan(0);
  });

  it('mounts the full viewer with an SVG and a populated component list', async () => {
    if (!ALPHA_CIR) return;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({
      cirText: ALPHA_CIR,
      theme: 'modern-dark',
      symbolCache: SYMBOL_CACHE,
    });
    host.appendChild(v);
    await flush();

    const svg = v.shadowRoot!.querySelector('.schematic-pane svg');
    expect(svg).toBeTruthy();
    const components = v.shadowRoot!.querySelectorAll('.component-list li');
    expect(components.length).toBeGreaterThan(5);

    // Ref check — the netlist contains R_BIAS, V_BIAS, C_F etc.
    const refs = Array.from(components).map((li) => (li as HTMLElement).dataset.ref);
    expect(refs).toContain('R_BIAS');
    expect(refs).toContain('V_BIAS');
    expect(refs).toContain('C_F');

    v.destroy();
  });

  it('renders correctly under all three themes', async () => {
    if (!ALPHA_CIR) return;
    const themes: Theme[] = ['classic-ltspice', 'pro-qspice', 'modern-dark'];
    for (const theme of themes) {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const v = SpiceViewer.create({
        cirText: ALPHA_CIR, theme, symbolCache: SYMBOL_CACHE,
      });
      host.appendChild(v);
      await flush();
      expect(v.getAttribute('data-theme')).toBe(theme);
      const svg = v.shadowRoot!.querySelector('.schematic-pane svg');
      expect(svg).toBeTruthy();
      v.destroy();
      host.remove();
    }
  });

  it('switches themes at runtime without re-parsing the netlist', async () => {
    if (!ALPHA_CIR) return;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({
      cirText: ALPHA_CIR, theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE,
    });
    host.appendChild(v);
    await flush();
    const componentCountBefore = v.shadowRoot!.querySelectorAll('.component-list li').length;
    v.setTheme('modern-dark');
    expect(v.getAttribute('data-theme')).toBe('modern-dark');
    v.setTheme('pro-qspice');
    expect(v.getAttribute('data-theme')).toBe('pro-qspice');
    const componentCountAfter = v.shadowRoot!.querySelectorAll('.component-list li').length;
    expect(componentCountAfter).toBe(componentCountBefore);
    v.destroy();
  });

  it('component count matches the netlist component count', async () => {
    if (!ALPHA_CIR) return;
    const parsed = parseCir(ALPHA_CIR);
    const expectedRefs = parsed.ir.components
      .map((c) => (c as { ref?: string }).ref)
      .filter((r): r is string => typeof r === 'string');

    const host = document.createElement('div');
    document.body.appendChild(host);
    const v = SpiceViewer.create({
      cirText: ALPHA_CIR, theme: 'modern-dark', symbolCache: SYMBOL_CACHE,
    });
    host.appendChild(v);
    await flush();
    const sidebarRefs = Array.from(
      v.shadowRoot!.querySelectorAll('.component-list li'),
    ).map((li) => (li as HTMLElement).dataset.ref);
    expect(sidebarRefs.length).toBe(expectedRefs.length);
    v.destroy();
  });
});
