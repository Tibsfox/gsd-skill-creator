import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from './engine';
import type { PalettePreset } from './palette';

/**
 * Create a mock WebGL2RenderingContext with all methods used by Engine
 * and its dependency chain (ShaderProgram, FullscreenQuad, RenderTarget, CRTPipeline).
 */
function createMockGL() {
  return {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    LINK_STATUS: 0x8b82,
    COMPILE_STATUS: 0x8b81,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    FRAMEBUFFER: 0x8d40,
    TEXTURE_2D: 0x0de1,
    TEXTURE0: 0x84c0,
    COLOR_BUFFER_BIT: 0x4000,
    TRIANGLES: 0x0004,
    RGBA: 0x1908,
    RGBA8: 0x8058,
    UNSIGNED_BYTE: 0x1401,
    LINEAR: 0x2601,
    NEAREST: 0x2600,
    CLAMP_TO_EDGE: 0x812f,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    COLOR_ATTACHMENT0: 0x8ce0,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),
    getUniformLocation: vi.fn((_p: unknown, name: string) => name),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform1i: vi.fn(),
    createVertexArray: vi.fn(() => ({})),
    bindVertexArray: vi.fn(),
    deleteVertexArray: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    deleteBuffer: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texSubImage2D: vi.fn(),
    texStorage2D: vi.fn(),
    texParameteri: vi.fn(),
    createFramebuffer: vi.fn(() => ({})),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteFramebuffer: vi.fn(),
    deleteTexture: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    activeTexture: vi.fn(),
    drawArrays: vi.fn(),
  } as unknown as WebGL2RenderingContext;
}

describe('Engine', () => {
  let container: HTMLElement;
  let mockGL: WebGL2RenderingContext;
  let origRAF: typeof requestAnimationFrame;
  let origCAF: typeof cancelAnimationFrame;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockGL = createMockGL();

    // Mock canvas creation to return WebGL2 context
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'canvas') {
        Object.defineProperty(el, 'clientWidth', { value: 800 });
        Object.defineProperty(el, 'clientHeight', { value: 600 });
        vi.spyOn(el as HTMLCanvasElement, 'getContext').mockImplementation(
          (id: string) => (id === 'webgl2' ? mockGL : null) as any,
        );
      }
      return el;
    });

    // Store original rAF/cAF and mock them
    origRAF = globalThis.requestAnimationFrame;
    origCAF = globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.requestAnimationFrame = origRAF;
    globalThis.cancelAnimationFrame = origCAF;
  });

  describe('Engine.create', () => {
    it('returns engine in webgl2 mode when WebGL2 is available', () => {
      const engine = Engine.create(container);

      expect(engine.mode).toBe('webgl2');
      // Canvas should be prepended to container
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
    });

    it('returns engine in css-fallback mode when WebGL2 is unavailable', () => {
      // Override to return null for WebGL2
      vi.restoreAllMocks();
      const origCreate = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === 'canvas') {
          vi.spyOn(el as HTMLCanvasElement, 'getContext').mockReturnValue(null);
        }
        return el;
      });

      const engine = Engine.create(container);

      expect(engine.mode).toBe('css-fallback');
      // CSS fallback overlays should be present
      expect(container.querySelector('.crt-fallback-overlay')).not.toBeNull();
      expect(container.querySelector('.crt-fallback-vignette')).not.toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('merges partial config into current config', () => {
      const engine = Engine.create(container);
      const original = engine.getConfig();

      engine.updateConfig({ scanlineIntensity: 0 });
      const updated = engine.getConfig();

      expect(updated.scanlineIntensity).toBe(0);
      // Other fields unchanged
      expect(updated.barrelDistortion).toBe(original.barrelDistortion);
      expect(updated.enabled).toBe(original.enabled);
    });
  });

  describe('getConfig', () => {
    it('returns a copy, not a reference to internal config', () => {
      const engine = Engine.create(container);

      const config1 = engine.getConfig();
      const config2 = engine.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe('getPerformance', () => {
    it('returns performance metrics with averageMs, maxMs, withinBudget', () => {
      const engine = Engine.create(container);

      const perf = engine.getPerformance();

      expect(typeof perf.averageMs).toBe('number');
      expect(typeof perf.maxMs).toBe('number');
      expect(typeof perf.withinBudget).toBe('boolean');
    });
  });

  describe('start/stop', () => {
    it('start() begins animation frame loop', () => {
      const rafCalls: FrameRequestCallback[] = [];
      globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
        rafCalls.push(cb);
        return rafCalls.length;
      }) as any;
      globalThis.cancelAnimationFrame = vi.fn();

      const engine = Engine.create(container);
      engine.start();

      // requestAnimationFrame should have been called
      expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

      // Simulate one animation frame
      if (rafCalls.length > 0) {
        rafCalls[rafCalls.length - 1](16.67);
      }

      // After frame callback, rAF should be called again (loop continues)
      expect(vi.mocked(globalThis.requestAnimationFrame).mock.calls.length).toBeGreaterThanOrEqual(2);

      engine.destroy();
    });

    it('stop() cancels animation frame', () => {
      globalThis.requestAnimationFrame = vi.fn(() => 42) as any;
      globalThis.cancelAnimationFrame = vi.fn();

      const engine = Engine.create(container);
      engine.start();
      engine.stop();

      expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(42);
    });
  });

  describe('destroy', () => {
    it('stops loop and cleans up resources for webgl2 engine', () => {
      globalThis.requestAnimationFrame = vi.fn(() => 99) as any;
      globalThis.cancelAnimationFrame = vi.fn();

      const engine = Engine.create(container);
      engine.start();
      engine.destroy();

      expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
      // Canvas should be removed from container
      expect(container.querySelector('canvas')).toBeNull();
    });

    it('removes CSS fallback for css-fallback engine', () => {
      vi.restoreAllMocks();
      const origCreate = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === 'canvas') {
          vi.spyOn(el as HTMLCanvasElement, 'getContext').mockReturnValue(null);
        }
        return el;
      });
      globalThis.requestAnimationFrame = vi.fn(() => 1) as any;
      globalThis.cancelAnimationFrame = vi.fn();

      const engine = Engine.create(container);
      expect(container.querySelector('.crt-fallback-overlay')).not.toBeNull();

      engine.destroy();

      expect(container.querySelector('.crt-fallback-overlay')).toBeNull();
      expect(container.querySelector('.crt-fallback-vignette')).toBeNull();
    });
  });

  describe('palette integration', () => {
    it('creates engine with default amiga-3.1 palette in webgl2 mode', () => {
      const engine = Engine.create(container);

      expect(engine.mode).toBe('webgl2');
      expect(engine.getPalette()).toBe('amiga-3.1');
    });

    it('setPalette changes the active palette preset', () => {
      const engine = Engine.create(container);

      engine.setPalette('amiga-1.3');

      expect(engine.getPalette()).toBe('amiga-1.3');
    });

    it('setPalette to c64 returns c64 from getPalette', () => {
      const engine = Engine.create(container);

      engine.setPalette('c64');

      expect(engine.getPalette()).toBe('c64');
    });

    it('setPaletteColors sets a custom palette with exact colors', () => {
      const engine = Engine.create(container);
      const customColors: string[] = [];
      for (let i = 0; i < 32; i++) {
        customColors.push(`#FF${i.toString(16).padStart(2, '0')}00`);
      }

      engine.setPaletteColors(customColors);

      expect(engine.getPalette()).toBe('custom');
    });
  });
});
