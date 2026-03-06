// Canvas System Tests — VZ-01:08
// Tests CanvasManager logic: creation, FPS tracking, parameter binding,
// resize handling, pointer normalization, frame capture, cleanup, multi-renderer.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasManager } from '../../src/visualization/canvas';
import type { VisualizationConfig } from '../../src/types/index';

// ─── Helpers ──────────────────────────────────────────────

function makeConfig(overrides?: Partial<VisualizationConfig>): VisualizationConfig {
  return {
    type: 'canvas-2d',
    componentId: 'test',
    interactiveParams: [
      { name: 'speed', label: 'Speed', type: 'slider', min: 0, max: 10, step: 0.1, default: 1, description: 'Speed' },
      { name: 'show', label: 'Show', type: 'toggle', default: true, description: 'Show' },
    ],
    minFps: 30,
    responsive: false,
    ...overrides,
  };
}

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;

  // jsdom does not implement getContext — mock a minimal CanvasRenderingContext2D
  const mockCtx = {
    canvas,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
    drawImage: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineDashOffset: 0,
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);

  return canvas;
}

// ─── Tests ────────────────────────────────────────────────

describe('CanvasManager', () => {
  let manager: CanvasManager;

  beforeEach(() => {
    manager = new CanvasManager();
    // Mock requestAnimationFrame / cancelAnimationFrame for jsdom
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 0) as unknown as number;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    manager.destroyAll();
    vi.restoreAllMocks();
  });

  // VZ-01: Canvas manager creates with valid config
  it('VZ-01: creates a renderer with valid config and returns an id', () => {
    const canvas = makeCanvas();
    const draw = vi.fn();
    const id = manager.createRenderer(canvas, makeConfig(), draw);

    expect(typeof id).toBe('string');
    expect(id).toMatch(/^renderer-/);
    expect(manager.rendererCount).toBe(1);
    expect(manager.isRunning).toBe(true);
  });

  // VZ-02: FPS tracking returns reasonable values
  it('VZ-02: FPS tracking returns reasonable values after simulated frames', () => {
    const canvas = makeCanvas();
    const draw = vi.fn();
    const id = manager.createRenderer(canvas, makeConfig(), draw);

    // Manually populate frame times (16.67ms per frame = ~60fps)
    const state = manager.getRenderer(id);
    expect(state).not.toBeNull();

    for (let i = 0; i < 30; i++) {
      state!.frameTimes.push(16.67);
    }

    const fps = manager.getFps(id);
    expect(fps).toBeGreaterThan(55);
    expect(fps).toBeLessThan(65);
  });

  // VZ-03: Parameter updates are stored and accessible
  it('VZ-03: parameter updates are stored and accessible', () => {
    const canvas = makeCanvas();
    const draw = vi.fn();
    const id = manager.createRenderer(canvas, makeConfig(), draw);

    // Default params from config
    expect(manager.getParam(id, 'speed')).toBe(1);
    expect(manager.getParam(id, 'show')).toBe(true);

    // Update
    manager.setParam(id, 'speed', 5.5);
    manager.setParam(id, 'show', false);

    expect(manager.getParam(id, 'speed')).toBe(5.5);
    expect(manager.getParam(id, 'show')).toBe(false);

    // getParams returns a copy
    const all = manager.getParams(id);
    expect(all.speed).toBe(5.5);
    expect(all.show).toBe(false);
  });

  // VZ-04: Resize handling updates dimensions
  it('VZ-04: resize handling updates canvas dimensions', () => {
    const canvas = makeCanvas();
    const parent = document.createElement('div');
    parent.appendChild(canvas);
    document.body.appendChild(parent);

    const draw = vi.fn();
    const id = manager.createRenderer(canvas, makeConfig(), draw);

    // Mock parent getBoundingClientRect
    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      width: 1024,
      height: 768,
      top: 0, left: 0, bottom: 768, right: 1024, x: 0, y: 0,
      toJSON() { return {}; },
    });

    manager.resize(id);

    // Canvas should have been resized (accounting for devicePixelRatio)
    const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
    expect(canvas.width).toBe(Math.round(1024 * dpr));
    expect(canvas.height).toBe(Math.round(768 * dpr));

    document.body.removeChild(parent);
  });

  // VZ-05: Pointer event normalization computes correct 0-1 coordinates
  it('VZ-05: pointer event normalization computes correct 0-1 coordinates', () => {
    const canvas = makeCanvas();
    document.body.appendChild(canvas);

    const draw = vi.fn();
    const id = manager.createRenderer(canvas, makeConfig(), draw);

    const received: Array<{ x: number; y: number; type: string }> = [];
    manager.onPointerEvent(id, (evt) => {
      received.push({ x: evt.x, y: evt.y, type: evt.type });
    });

    // Mock getBoundingClientRect for the canvas
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 50, width: 400, height: 200,
      bottom: 250, right: 500, x: 100, y: 50,
      toJSON() { return {}; },
    });

    // jsdom doesn't have PointerEvent — use MouseEvent with the right event name
    const pointerDown = new MouseEvent('pointerdown', {
      clientX: 300, // 200px from left edge of canvas -> 200/400 = 0.5
      clientY: 150, // 100px from top edge of canvas -> 100/200 = 0.5
      bubbles: true,
    });
    canvas.dispatchEvent(pointerDown);

    expect(received.length).toBe(1);
    expect(received[0]!.type).toBe('down');
    expect(received[0]!.x).toBeCloseTo(0.5, 1);
    expect(received[0]!.y).toBeCloseTo(0.5, 1);

    document.body.removeChild(canvas);
  });

  // VZ-06: Frame capture calls toDataURL
  it('VZ-06: frame capture calls toDataURL', () => {
    const canvas = makeCanvas();
    const draw = vi.fn();
    const id = manager.createRenderer(canvas, makeConfig(), draw);

    const spy = vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,mockdata');

    const result = manager.captureFrame(id);
    expect(spy).toHaveBeenCalledWith('image/png');
    expect(result).toBe('data:image/png;base64,mockdata');
  });

  // VZ-07: Cleanup stops animation and removes listeners
  it('VZ-07: cleanup stops animation and removes listeners', () => {
    const canvas = makeCanvas();
    const removeSpy = vi.spyOn(canvas, 'removeEventListener');

    const draw = vi.fn();
    const id = manager.createRenderer(canvas, makeConfig(), draw);

    expect(manager.isRunning).toBe(true);
    expect(manager.rendererCount).toBe(1);

    manager.destroyRenderer(id);

    expect(manager.rendererCount).toBe(0);
    expect(manager.isRunning).toBe(false);
    expect(manager.getRenderer(id)).toBeNull();

    // Event listeners should have been removed (pointerdown, pointermove, pointerup, touch*)
    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });

  // VZ-08: Multiple renderers can be registered simultaneously
  it('VZ-08: multiple renderers can be registered simultaneously', () => {
    const canvas1 = makeCanvas();
    const canvas2 = makeCanvas();
    const canvas3 = makeCanvas();

    const draw = vi.fn();
    const id1 = manager.createRenderer(canvas1, makeConfig(), draw);
    const id2 = manager.createRenderer(canvas2, makeConfig(), draw);
    const id3 = manager.createRenderer(canvas3, makeConfig(), draw);

    expect(manager.rendererCount).toBe(3);
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);

    // Each has independent params
    manager.setParam(id1, 'speed', 2);
    manager.setParam(id2, 'speed', 5);
    manager.setParam(id3, 'speed', 9);

    expect(manager.getParam(id1, 'speed')).toBe(2);
    expect(manager.getParam(id2, 'speed')).toBe(5);
    expect(manager.getParam(id3, 'speed')).toBe(9);

    // Destroy one, others remain
    manager.destroyRenderer(id2);
    expect(manager.rendererCount).toBe(2);
    expect(manager.isRunning).toBe(true);
    expect(manager.getRenderer(id1)).not.toBeNull();
    expect(manager.getRenderer(id2)).toBeNull();
    expect(manager.getRenderer(id3)).not.toBeNull();
  });
});
