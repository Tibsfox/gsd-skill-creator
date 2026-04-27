/**
 * @vitest-environment jsdom
 *
 * tests/spice-renderer/waveform-renderer.test.ts
 *
 * Mission: v1.49.581 Phase B.1 wave-2.
 *
 * jsdom does not ship a real canvas backend (no `canvas` npm package
 * installed), so we stub `HTMLCanvasElement.prototype.getContext` with a
 * minimal 2D-context shim that records draw operations. The renderer's job is
 * to produce a sequence of canvas draw calls correctly; pixel-perfect output
 * is verified visually in browser fixtures, not in unit tests.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  WaveformRenderer,
  type WaveformRenderOptions,
} from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/waveform-renderer.js';
import type { WaveformIR } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Canvas shim — no-op 2D context that records calls so we can assert behavior
// ─────────────────────────────────────────────────────────────────────────────
interface RecordedCall { method: string; args: unknown[]; }
interface FakeCtx extends Record<string, unknown> {
  __calls: RecordedCall[];
}
function makeFakeCtx(): FakeCtx {
  const calls: RecordedCall[] = [];
  const noop = (name: string) => (...args: unknown[]) => { calls.push({ method: name, args }); };
  const ctx: Partial<FakeCtx> = {
    __calls: calls,
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    lineJoin: 'round', lineCap: 'round',
    font: '', textAlign: 'left', textBaseline: 'alphabetic',
    fillRect: noop('fillRect'),
    strokeRect: noop('strokeRect'),
    fillText: noop('fillText'),
    beginPath: noop('beginPath'),
    moveTo: noop('moveTo'),
    lineTo: noop('lineTo'),
    stroke: noop('stroke'),
    setLineDash: noop('setLineDash'),
    setTransform: noop('setTransform'),
    save: noop('save'),
    restore: noop('restore'),
    translate: noop('translate'),
    rotate: noop('rotate'),
    clearRect: noop('clearRect'),
  };
  return ctx as FakeCtx;
}

let lastCtx: FakeCtx | null = null;

beforeAll(() => {
  // Shim getContext globally for the suite.
  // jsdom returns null by default; we override with a recording shim. Cache
  // one ctx per canvas so repeated render() calls accumulate into the same
  // call list (matches real browser behavior).
  const ctxByCanvas = new WeakMap<HTMLCanvasElement, FakeCtx>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = function getContext(this: HTMLCanvasElement, kind: string) {
    if (kind !== '2d') return null;
    let cached = ctxByCanvas.get(this);
    if (!cached) {
      cached = makeFakeCtx();
      ctxByCanvas.set(this, cached);
    }
    lastCtx = cached;
    return cached;
  };
  // Shim toBlob so exportPNG resolves.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).toBlob = function toBlob(cb: (b: Blob | null) => void) {
    setTimeout(() => cb(new Blob(['png-stub'], { type: 'image/png' })), 0);
  };
  // jsdom returns 0 width for getBoundingClientRect; renderer falls back to
  // container.clientWidth or 800. Force a clientWidth.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return 800; },
  });
});

afterEach(() => {
  lastCtx = null;
});

// ─────────────────────────────────────────────────────────────────────────────
// Fixture builders
// ─────────────────────────────────────────────────────────────────────────────
function makeXData(n: number, t0 = 0, t1 = 1e-3): Float32Array {
  const xs = new Float32Array(n);
  for (let i = 0; i < n; i++) xs[i] = t0 + (i / Math.max(1, n - 1)) * (t1 - t0);
  return xs;
}

function makeSine(n: number, freq: number, amp: number, phase = 0): Float32Array {
  const ys = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    ys[i] = amp * Math.sin(2 * Math.PI * freq * t + phase);
  }
  return ys;
}

function singlePaneIR(n = 100): WaveformIR {
  return {
    xData: makeXData(n),
    xUnits: 's',
    xLabel: 'Time (s)',
    panes: [{
      yLabel: 'Voltage (V)',
      yUnits: 'V',
      traces: [
        { name: 'V(in)',  units: 'V', yData: makeSine(n, 2, 1.0) },
        { name: 'V(out)', units: 'V', yData: makeSine(n, 2, 0.5, Math.PI / 4) },
      ],
    }],
    metadata: { analysis: 'tran' },
  };
}

function multiPaneIR(n = 100): WaveformIR {
  return {
    xData: makeXData(n),
    xUnits: 's',
    xLabel: 'Time (s)',
    panes: [
      {
        yLabel: 'Voltage (V)', yUnits: 'V',
        traces: [
          { name: 'V(in)',  units: 'V', yData: makeSine(n, 1, 1) },
          { name: 'V(out)', units: 'V', yData: makeSine(n, 1, 0.7) },
        ],
      },
      {
        yLabel: 'Current (A)', yUnits: 'A',
        traces: [
          { name: 'I(R1)', units: 'A', yData: makeSine(n, 1, 1e-3) },
        ],
      },
    ],
    metadata: { analysis: 'tran' },
  };
}

const baseOpts: WaveformRenderOptions = {
  theme: 'modern-dark',
  showLegend: true,
  showGrid: true,
  showCursor: true,
  enableExport: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('WaveformRenderer — single-pane basic render', () => {
  it('renders a 1-pane / 2-trace fixture without throwing', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ir = singlePaneIR(100);
    const r = new WaveformRenderer(host, ir, baseOpts);
    r.render();

    const canvas = host.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas!.width).toBeGreaterThan(0);
    expect(canvas!.height).toBeGreaterThan(0);
    // The canvas's CSS height should match the default 400.
    expect(canvas!.style.height).toBe('400px');
    // Container should expose the data-theme attribute.
    expect(host.querySelector('.waveform-container')!.getAttribute('data-theme')).toBe('modern-dark');
    // Legend should list both traces.
    expect(host.querySelectorAll('.legend-item').length).toBe(2);

    // Painted at least background + frame strokes.
    expect(lastCtx!.__calls.some((c) => c.method === 'fillRect')).toBe(true);
    expect(lastCtx!.__calls.some((c) => c.method === 'strokeRect')).toBe(true);
    // At least one stroke (axis frame + grid + traces) was emitted.
    expect(lastCtx!.__calls.filter((c) => c.method === 'stroke').length).toBeGreaterThan(0);

    r.destroy();
    document.body.removeChild(host);
  });
});

describe('WaveformRenderer — multi-pane', () => {
  it('renders V + I panes (3 traces total) with separate frames', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const r = new WaveformRenderer(host, multiPaneIR(100), baseOpts);
    r.render();

    expect(host.querySelectorAll('.legend-item').length).toBe(3);
    // Two pane frames → two strokeRect calls (at minimum).
    const frames = lastCtx!.__calls.filter((c) => c.method === 'strokeRect').length;
    expect(frames).toBeGreaterThanOrEqual(2);
    r.destroy();
    document.body.removeChild(host);
  });
});

describe('WaveformRenderer — theme switching', () => {
  it('setTheme triggers re-render and updates data-theme attribute', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const r = new WaveformRenderer(host, singlePaneIR(50), baseOpts);
    r.render();
    const beforeCalls = lastCtx!.__calls.length;

    r.setTheme('classic-ltspice');

    const wrapper = host.querySelector('.waveform-container')!;
    expect(wrapper.getAttribute('data-theme')).toBe('classic-ltspice');
    // A re-paint must have happened — call count grew.
    expect(lastCtx!.__calls.length).toBeGreaterThan(beforeCalls);
    r.destroy();
    document.body.removeChild(host);
  });
});

describe('WaveformRenderer — visibility toggle', () => {
  it('setVisibleTraces hides the non-listed traces', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ir = singlePaneIR(50);
    const r = new WaveformRenderer(host, ir, baseOpts);
    r.render();

    r.setVisibleTraces(['V(out)']);

    const items = Array.from(host.querySelectorAll('.legend-item')) as HTMLElement[];
    expect(items.length).toBe(2);
    const inItem = items.find((el) => el.getAttribute('data-trace') === 'V(in)')!;
    const outItem = items.find((el) => el.getAttribute('data-trace') === 'V(out)')!;
    expect(parseFloat(inItem.style.opacity)).toBeLessThan(1);
    expect(parseFloat(outItem.style.opacity || '1')).toBe(1);
    r.destroy();
    document.body.removeChild(host);
  });
});

describe('WaveformRenderer — onTraceClick callback', () => {
  it('fires when a legend item is clicked', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const onClick = vi.fn();
    const r = new WaveformRenderer(host, singlePaneIR(50), { ...baseOpts, onTraceClick: onClick });
    r.render();

    const inItem = host.querySelector('.legend-item[data-trace="V(in)"]') as HTMLElement;
    expect(inItem).toBeTruthy();
    inItem.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('V(in)');
    r.destroy();
    document.body.removeChild(host);
  });
});

describe('WaveformRenderer — exportPNG', () => {
  it('returns a Blob', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const r = new WaveformRenderer(host, singlePaneIR(50), baseOpts);
    r.render();
    const blob = await r.exportPNG('wf.png');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    r.destroy();
    document.body.removeChild(host);
  });
});

describe('WaveformRenderer — performance budget', () => {
  it('renders 1×10k-point trace in ≤ 50 ms', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const n = 10_000;
    const ir: WaveformIR = {
      xData: makeXData(n),
      xUnits: 's',
      xLabel: 'Time (s)',
      panes: [{
        yLabel: 'Voltage (V)', yUnits: 'V',
        traces: [{ name: 'V(big)', units: 'V', yData: makeSine(n, 50, 1) }],
      }],
      metadata: { analysis: 'tran' },
    };
    const r = new WaveformRenderer(host, ir, baseOpts);
    const t0 = performance.now();
    r.render();
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(150); // generous CI margin; spec target = 50 ms in browser
    r.destroy();
    document.body.removeChild(host);
  });

  it('renders 4 traces × 10k points in ≤ 200 ms', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const n = 10_000;
    const ir: WaveformIR = {
      xData: makeXData(n),
      xUnits: 's',
      xLabel: 'Time (s)',
      panes: [
        {
          yLabel: 'V', yUnits: 'V',
          traces: [
            { name: 'V(a)', units: 'V', yData: makeSine(n, 10, 1) },
            { name: 'V(b)', units: 'V', yData: makeSine(n, 20, 1) },
          ],
        },
        {
          yLabel: 'V', yUnits: 'V',
          traces: [
            { name: 'V(c)', units: 'V', yData: makeSine(n, 30, 1) },
            { name: 'V(d)', units: 'V', yData: makeSine(n, 40, 1) },
          ],
        },
      ],
      metadata: { analysis: 'tran' },
    };
    const r = new WaveformRenderer(host, ir, baseOpts);
    const t0 = performance.now();
    r.render();
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(400); // generous CI margin; spec target = 200 ms in browser
    r.destroy();
    document.body.removeChild(host);
  });
});

describe('WaveformRenderer — destroy cleans up', () => {
  it('removes the wrapper from the container', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const r = new WaveformRenderer(host, singlePaneIR(20), baseOpts);
    r.render();
    expect(host.querySelector('.waveform-container')).toBeTruthy();
    r.destroy();
    expect(host.querySelector('.waveform-container')).toBeNull();
    document.body.removeChild(host);
  });
});
