// ─── Interactive Canvas System ───────────────────────────
// Unified rendering abstraction with RAF loop, FPS tracking,
// pointer normalization, and responsive container sizing.

import type { CanvasRenderer, InteractiveParam, ParamValue, VizType } from '../types/index.js';

// ─── FPS Tracker ─────────────────────────────────────────

interface FpsTracker {
  frameTimes: number[];
  lastTime: number;
}

function createFpsTracker(): FpsTracker {
  return { frameTimes: [], lastTime: 0 };
}

function recordFrame(tracker: FpsTracker, time: number): void {
  if (tracker.lastTime > 0) {
    const delta = time - tracker.lastTime;
    tracker.frameTimes.push(delta);
    // Rolling window of last 60 frames
    if (tracker.frameTimes.length > 60) {
      tracker.frameTimes.shift();
    }
  }
  tracker.lastTime = time;
}

function computeFps(tracker: FpsTracker): number {
  if (tracker.frameTimes.length === 0) return 0;
  const avgDelta =
    tracker.frameTimes.reduce((sum, d) => sum + d, 0) / tracker.frameTimes.length;
  if (avgDelta === 0) return 0;
  return 1000 / avgDelta;
}

// ─── Mounted Renderer State ──────────────────────────────

interface MountedRenderer {
  renderer: CanvasRenderer;
  container: HTMLElement;
  params: Map<string, ParamValue>;
  resizeObserver: ResizeObserver;
  pointerCleanup: (() => void) | null;
}

// ─── Pointer Normalization ───────────────────────────────

function findCanvasIn(container: HTMLElement): HTMLCanvasElement | null {
  return container.querySelector('canvas');
}

function normalizePointerCoords(
  event: MouseEvent | Touch,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

function attachPointerEvents(
  container: HTMLElement,
  renderer: CanvasRenderer,
): () => void {
  const getCanvas = () => findCanvasIn(container);

  const onMouseDown = (e: MouseEvent) => {
    const canvas = getCanvas();
    if (!canvas || !renderer.onPointerDown) return;
    const { x, y } = normalizePointerCoords(e, canvas);
    renderer.onPointerDown(x, y);
  };

  const onMouseMove = (e: MouseEvent) => {
    const canvas = getCanvas();
    if (!canvas || !renderer.onPointerMove) return;
    const { x, y } = normalizePointerCoords(e, canvas);
    renderer.onPointerMove(x, y);
  };

  const onMouseUp = () => {
    renderer.onPointerUp?.();
  };

  const onTouchStart = (e: TouchEvent) => {
    const canvas = getCanvas();
    if (!canvas || !renderer.onPointerDown || e.touches.length === 0) return;
    const { x, y } = normalizePointerCoords(e.touches[0], canvas);
    renderer.onPointerDown(x, y);
  };

  const onTouchMove = (e: TouchEvent) => {
    const canvas = getCanvas();
    if (!canvas || !renderer.onPointerMove || e.touches.length === 0) return;
    e.preventDefault(); // prevent scroll during drag
    const { x, y } = normalizePointerCoords(e.touches[0], canvas);
    renderer.onPointerMove(x, y);
  };

  const onTouchEnd = () => {
    renderer.onPointerUp?.();
  };

  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('mouseleave', onMouseUp);
  container.addEventListener('touchstart', onTouchStart, { passive: false });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd);

  return () => {
    container.removeEventListener('mousedown', onMouseDown);
    container.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('mouseup', onMouseUp);
    container.removeEventListener('mouseleave', onMouseUp);
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
  };
}

// ─── Canvas Manager ──────────────────────────────────────

export class CanvasManager {
  private renderers: Map<string, CanvasRenderer> = new Map();
  private mounted: Map<string, MountedRenderer> = new Map();
  private animationId: number | null = null;
  private fpsTrackers: Map<string, FpsTracker> = new Map();
  private destroyed = false;

  /**
   * Register a renderer so it can later be mounted.
   */
  register(renderer: CanvasRenderer): void {
    if (this.destroyed) return;
    this.renderers.set(renderer.id, renderer);
  }

  /**
   * Mount a registered renderer into a DOM container and start rendering.
   */
  mount(rendererId: string, container: HTMLElement, params: InteractiveParam[]): void {
    if (this.destroyed) return;

    const renderer = this.renderers.get(rendererId);
    if (!renderer) {
      throw new Error(`Renderer "${rendererId}" not registered. Call register() first.`);
    }

    // Unmount if already mounted
    if (this.mounted.has(rendererId)) {
      this.unmount(rendererId);
    }

    // Build param map from InteractiveParam defaults
    const paramMap = new Map<string, ParamValue>();
    for (const p of params) {
      paramMap.set(p.name, p.default);
    }

    // Initialize renderer
    renderer.init(container, paramMap);

    // Set up resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          renderer.resize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // Attach pointer events
    const pointerCleanup = attachPointerEvents(container, renderer);

    // Create FPS tracker
    this.fpsTrackers.set(rendererId, createFpsTracker());

    // Store mounted state
    this.mounted.set(rendererId, {
      renderer,
      container,
      params: paramMap,
      resizeObserver,
      pointerCleanup,
    });

    // Start animation loop if not running
    if (this.animationId === null) {
      this.startLoop();
    }
  }

  /**
   * Unmount a renderer, cleaning up all resources.
   */
  unmount(rendererId: string): void {
    const entry = this.mounted.get(rendererId);
    if (!entry) return;

    // Disconnect observer
    entry.resizeObserver.disconnect();

    // Remove pointer listeners
    if (entry.pointerCleanup) {
      entry.pointerCleanup();
    }

    // Destroy the renderer
    entry.renderer.destroy();

    // Remove tracking
    this.mounted.delete(rendererId);
    this.fpsTrackers.delete(rendererId);

    // Stop loop if nothing mounted
    if (this.mounted.size === 0) {
      this.stopLoop();
    }
  }

  /**
   * Update a parameter on a mounted renderer.
   */
  updateParam(rendererId: string, name: string, value: ParamValue): void {
    const entry = this.mounted.get(rendererId);
    if (!entry) return;

    entry.params.set(name, value);
    entry.renderer.onParamChange?.(name, value);
  }

  /**
   * Get current FPS for a mounted renderer.
   */
  getFps(rendererId: string): number {
    const tracker = this.fpsTrackers.get(rendererId);
    if (!tracker) return 0;
    return computeFps(tracker);
  }

  /**
   * Capture the current frame of a renderer as a data URL.
   */
  captureFrame(rendererId: string): string {
    const entry = this.mounted.get(rendererId);
    if (!entry) return '';

    const canvas = findCanvasIn(entry.container);
    if (!canvas) return '';

    return canvas.toDataURL('image/png');
  }

  /**
   * Whether the animation loop is running.
   */
  isRunning(): boolean {
    return this.animationId !== null;
  }

  /**
   * Destroy the manager and all mounted renderers.
   */
  destroy(): void {
    this.destroyed = true;
    this.stopLoop();

    // Unmount all renderers
    const ids = [...this.mounted.keys()];
    for (const id of ids) {
      this.unmount(id);
    }

    this.renderers.clear();
    this.fpsTrackers.clear();
  }

  // ─── Private ─────────────────────────────────────────

  private startLoop(): void {
    const tick = (time: number) => {
      if (this.destroyed) return;

      // Render all mounted renderers
      for (const [id, entry] of this.mounted) {
        const tracker = this.fpsTrackers.get(id);
        if (tracker) {
          recordFrame(tracker, time);
        }
        entry.renderer.render(time, entry.params);
      }

      this.animationId = requestAnimationFrame(tick);
    };

    this.animationId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// ─── Base Canvas Renderer ────────────────────────────────

export abstract class BaseCanvasRenderer implements CanvasRenderer {
  id: string;
  type: VizType;
  protected canvas: HTMLCanvasElement | null = null;
  protected ctx: CanvasRenderingContext2D | null = null;
  protected width = 0;
  protected height = 0;

  constructor(id: string, type: VizType = 'canvas-2d') {
    this.id = id;
    this.type = type;
  }

  init(container: HTMLElement, params: Map<string, ParamValue>): void {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);

    // Get 2D context
    this.ctx = this.canvas.getContext('2d');

    // Set initial size from container
    const rect = container.getBoundingClientRect();
    this.resize(rect.width || 400, rect.height || 300);

    // Allow subclasses to set up from initial params
    this.onInit(params);
  }

  abstract render(time: number, params: Map<string, ParamValue>): void;

  /**
   * Hook for subclass initialization. Called after canvas and context are ready.
   */
  protected onInit(_params: Map<string, ParamValue>): void {
    // Override in subclass if needed
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      // Set actual pixel dimensions (for sharp rendering)
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      // Scale context to account for DPR
      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  }

  destroy(): void {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
