// ─── Canvas System Tests ─────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasManager, BaseCanvasRenderer } from '../../src/visualization/canvas.js';
import type { InteractiveParam, ParamValue, VizType } from '../../src/types/index.js';

// ─── Mock Setup ──────────────────────────────────────────

// Save the real createElement before any mocking
const realCreateElement = document.createElement.bind(document);

function createMockCtx() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    font: '',
  };
}

function createMockCanvas(): HTMLCanvasElement {
  const canvas = realCreateElement('canvas');
  vi.spyOn(canvas, 'getContext').mockReturnValue(createMockCtx() as unknown as CanvasRenderingContext2D);
  vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,MOCK');
  return canvas;
}

function createMockContainer(): HTMLElement {
  const container = realCreateElement('div');
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, width: 800, height: 600,
    top: 0, left: 0, right: 800, bottom: 600,
    toJSON: () => ({}),
  });
  return container;
}

/**
 * Install a createElement mock that intercepts 'canvas' creation.
 * Returns a cleanup function.
 */
function mockCanvasCreation(): () => void {
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return createMockCanvas();
    return realCreateElement(tag);
  });
  return () => spy.mockRestore();
}

// Stub ResizeObserver since jsdom doesn't have it
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// ─── Test Renderer ───────────────────────────────────────

class TestRenderer extends BaseCanvasRenderer {
  renderCount = 0;
  lastTime = 0;
  lastParams: Map<string, ParamValue> = new Map();
  paramChanges: Array<{ name: string; value: ParamValue }> = [];

  constructor(id = 'test-renderer', type: VizType = 'canvas-2d') {
    super(id, type);
  }

  render(time: number, params: Map<string, ParamValue>): void {
    this.renderCount++;
    this.lastTime = time;
    this.lastParams = new Map(params);
  }

  onParamChange(name: string, value: ParamValue): void {
    this.paramChanges.push({ name, value });
  }
}

// ─── Tests ───────────────────────────────────────────────

describe('CanvasManager', () => {
  let manager: CanvasManager;
  let originalRAF: typeof globalThis.requestAnimationFrame;
  let originalCAF: typeof globalThis.cancelAnimationFrame;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;
  let originalResizeObserver: typeof globalThis.ResizeObserver;
  let cleanupMock: (() => void) | null = null;

  beforeEach(() => {
    manager = new CanvasManager();
    rafCallbacks = new Map();
    rafId = 0;

    // Mock requestAnimationFrame
    originalRAF = globalThis.requestAnimationFrame;
    originalCAF = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      return id;
    });
    globalThis.cancelAnimationFrame = vi.fn((id: number) => {
      rafCallbacks.delete(id);
    });

    // Mock ResizeObserver
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    if (cleanupMock) { cleanupMock(); cleanupMock = null; }
    manager.destroy();
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
    globalThis.ResizeObserver = originalResizeObserver;
  });

  function makeParams(...names: string[]): InteractiveParam[] {
    return names.map((name) => ({
      name,
      label: name,
      type: 'slider' as const,
      default: 0.5,
      description: `Test param ${name}`,
    }));
  }

  function tickRAF(time = 16.67): void {
    const cbs = [...rafCallbacks.values()];
    rafCallbacks.clear();
    for (const cb of cbs) {
      cb(time);
    }
  }

  describe('register and mount', () => {
    it('registers a renderer', () => {
      const renderer = new TestRenderer();
      expect(() => manager.register(renderer)).not.toThrow();
    });

    it('throws when mounting unregistered renderer', () => {
      const container = createMockContainer();
      expect(() => manager.mount('nonexistent', container, [])).toThrow(
        'Renderer "nonexistent" not registered',
      );
    });

    it('mounts a registered renderer into a container', () => {
      cleanupMock = mockCanvasCreation();
      const renderer = new TestRenderer();
      const container = createMockContainer();

      manager.register(renderer);
      manager.mount('test-renderer', container, makeParams('speed', 'scale'));

      expect(container.querySelector('canvas')).not.toBeNull();
      expect(manager.isRunning()).toBe(true);
    });

    it('starts RAF loop on first mount', () => {
      cleanupMock = mockCanvasCreation();
      const renderer = new TestRenderer();
      const container = createMockContainer();

      expect(manager.isRunning()).toBe(false);
      manager.register(renderer);
      manager.mount('test-renderer', container, []);
      expect(manager.isRunning()).toBe(true);
    });
  });

  describe('unmount', () => {
    it('stops loop when last renderer unmounts', () => {
      cleanupMock = mockCanvasCreation();
      const renderer = new TestRenderer();
      const container = createMockContainer();

      manager.register(renderer);
      manager.mount('test-renderer', container, []);
      expect(manager.isRunning()).toBe(true);

      manager.unmount('test-renderer');
      expect(manager.isRunning()).toBe(false);
    });

    it('unmounting non-mounted renderer does not throw', () => {
      expect(() => manager.unmount('nonexistent')).not.toThrow();
    });
  });

  describe('parameter updates', () => {
    it('flows parameter changes to renderer', () => {
      cleanupMock = mockCanvasCreation();
      const renderer = new TestRenderer();
      const container = createMockContainer();

      manager.register(renderer);
      manager.mount('test-renderer', container, makeParams('speed'));

      manager.updateParam('test-renderer', 'speed', 2.5);
      expect(renderer.paramChanges).toEqual([{ name: 'speed', value: 2.5 }]);

      manager.updateParam('test-renderer', 'speed', 5.0);
      expect(renderer.paramChanges).toHaveLength(2);
      expect(renderer.paramChanges[1]).toEqual({ name: 'speed', value: 5.0 });
    });

    it('ignores param updates for non-mounted renderer', () => {
      expect(() => manager.updateParam('nonexistent', 'x', 1)).not.toThrow();
    });
  });

  describe('FPS tracking', () => {
    it('returns 0 for non-mounted renderer', () => {
      expect(manager.getFps('nonexistent')).toBe(0);
    });

    it('computes FPS from frame deltas', () => {
      cleanupMock = mockCanvasCreation();
      const renderer = new TestRenderer();
      const container = createMockContainer();

      manager.register(renderer);
      manager.mount('test-renderer', container, []);

      // Simulate frames at ~60fps (16.67ms apart)
      for (let i = 0; i < 10; i++) {
        tickRAF(i * 16.67);
      }

      const fps = manager.getFps('test-renderer');
      expect(fps).toBeGreaterThan(50);
      expect(fps).toBeLessThan(70);
    });
  });

  describe('frame capture', () => {
    it('returns empty string for non-mounted renderer', () => {
      expect(manager.captureFrame('nonexistent')).toBe('');
    });

    it('returns data URL from canvas', () => {
      cleanupMock = mockCanvasCreation();
      const renderer = new TestRenderer();
      const container = createMockContainer();

      manager.register(renderer);
      manager.mount('test-renderer', container, []);

      const url = manager.captureFrame('test-renderer');
      expect(url).toBe('data:image/png;base64,MOCK');
    });
  });

  describe('destroy', () => {
    it('cleans up all renderers and stops loop', () => {
      cleanupMock = mockCanvasCreation();
      const r1 = new TestRenderer('r1');
      const r2 = new TestRenderer('r2');
      const c1 = createMockContainer();
      const c2 = createMockContainer();

      manager.register(r1);
      manager.register(r2);
      manager.mount('r1', c1, []);
      manager.mount('r2', c2, []);

      expect(manager.isRunning()).toBe(true);

      manager.destroy();
      expect(manager.isRunning()).toBe(false);

      // Should not throw after destroy (operations become no-ops)
      expect(() => manager.register(r1)).not.toThrow();
    });
  });
});

describe('BaseCanvasRenderer', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver;
  let cleanupMock: (() => void) | null = null;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    if (cleanupMock) { cleanupMock(); cleanupMock = null; }
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('creates canvas and context on init', () => {
    cleanupMock = mockCanvasCreation();
    const renderer = new TestRenderer();
    const container = createMockContainer();

    renderer.init(container, new Map([['x', 1]]));

    expect(container.querySelector('canvas')).not.toBeNull();
    expect(renderer['canvas']).not.toBeNull();
    expect(renderer['ctx']).not.toBeNull();
  });

  it('sets dimensions on resize', () => {
    cleanupMock = mockCanvasCreation();
    const renderer = new TestRenderer();
    const container = createMockContainer();

    renderer.init(container, new Map());
    renderer.resize(1024, 768);

    expect(renderer['width']).toBe(1024);
    expect(renderer['height']).toBe(768);
  });

  it('removes canvas from DOM on destroy', () => {
    cleanupMock = mockCanvasCreation();
    const renderer = new TestRenderer();
    const container = createMockContainer();

    renderer.init(container, new Map());
    expect(container.querySelector('canvas')).not.toBeNull();

    renderer.destroy();
    expect(renderer['canvas']).toBeNull();
    expect(renderer['ctx']).toBeNull();
  });

  it('has correct id and type', () => {
    const renderer = new TestRenderer('my-viz', 'webgl-3d');
    expect(renderer.id).toBe('my-viz');
    expect(renderer.type).toBe('webgl-3d');
  });
});
