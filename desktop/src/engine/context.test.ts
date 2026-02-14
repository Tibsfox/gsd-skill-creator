import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGLContext, attachContextLossHandlers, resizeCanvas } from './context';

/**
 * Helper: create a minimal WebGL2RenderingContext mock.
 * vitest-webgl-canvas-mock only stubs WebGL1, so we build a WebGL2 mock
 * and override getContext to return it for 'webgl2'.
 */
function createMockGL(): WebGL2RenderingContext {
  return {
    viewport: vi.fn(),
    // WebGL2-specific methods used by other modules
    createVertexArray: vi.fn(() => ({})),
    bindVertexArray: vi.fn(),
    deleteVertexArray: vi.fn(),
    texStorage2D: vi.fn(),
  } as unknown as WebGL2RenderingContext;
}

describe('createGLContext', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('returns webgl2 result when WebGL2 is available', () => {
    const mockGL = createMockGL();
    // Override getContext on any canvas created inside createGLContext
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'canvas') {
        vi.spyOn(el as HTMLCanvasElement, 'getContext').mockImplementation(
          (id: string) => (id === 'webgl2' ? mockGL : null) as any
        );
      }
      return el;
    });

    const result = createGLContext(container);
    expect(result.type).toBe('webgl2');
    if (result.type === 'webgl2') {
      expect(result.gl).toBe(mockGL);
      expect(result.canvas).toBeInstanceOf(HTMLCanvasElement);

      // Canvas style checks
      const style = result.canvas.style;
      expect(style.position).toBe('fixed');
      expect(style.top).toBe('0px');
      expect(style.left).toBe('0px');
      expect(style.width).toBe('100vw');
      expect(style.height).toBe('100vh');
      expect(style.zIndex).toBe('0');
      expect(style.pointerEvents).toBe('none');
    }

    vi.restoreAllMocks();
  });

  it('returns css-fallback when WebGL2 is unavailable', () => {
    // Mock getContext to return null for webgl2
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'canvas') {
        vi.spyOn(el as HTMLCanvasElement, 'getContext').mockReturnValue(null);
      }
      return el;
    });

    const result = createGLContext(container);
    expect(result.type).toBe('css-fallback');
    expect(result.gl).toBeNull();
    expect(result.canvas).toBeNull();

    vi.restoreAllMocks();
  });
});

describe('attachContextLossHandlers', () => {
  it('calls onLost and preventDefault on webglcontextlost', () => {
    const canvas = document.createElement('canvas');
    const onLost = vi.fn();
    const onRestored = vi.fn();

    attachContextLossHandlers(canvas, onLost, onRestored);

    const event = new Event('webglcontextlost');
    vi.spyOn(event, 'preventDefault');
    canvas.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onLost).toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('calls onRestored on webglcontextrestored', () => {
    const canvas = document.createElement('canvas');
    const onLost = vi.fn();
    const onRestored = vi.fn();

    attachContextLossHandlers(canvas, onLost, onRestored);

    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(onRestored).toHaveBeenCalled();
  });
});

describe('resizeCanvas', () => {
  it('sets canvas dimensions and calls gl.viewport', () => {
    const canvas = document.createElement('canvas');
    // Simulate clientWidth/clientHeight
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });

    // devicePixelRatio
    const origDPR = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });

    const gl = createMockGL();
    resizeCanvas(canvas, gl);

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, 1600, 1200);

    Object.defineProperty(window, 'devicePixelRatio', { value: origDPR, configurable: true });
  });
});
