// Interactive Canvas System — The Space Between Engine
// Unified rendering abstraction: animation loop, parameter binding, FPS tracking,
// pointer normalization, responsive sizing. Drives all Observatory visualizations.

import type { VisualizationConfig, InteractiveParam } from '../types/index';

// ─── Public Types ────────────────────────────────────────

/** Callback signature for renderer draw functions. */
export type RendererCallback = (
  ctx: CanvasRenderingContext2D,
  params: Record<string, number | string | boolean>,
  deltaTime: number,
  width: number,
  height: number,
) => void;

/** Callback signature for pointer events with normalized (0-1) coordinates. */
export type PointerEventCallback = (
  event: NormalizedPointerEvent,
) => void;

export interface NormalizedPointerEvent {
  type: 'down' | 'move' | 'up';
  /** X coordinate normalized to 0-1 range relative to canvas. */
  x: number;
  /** Y coordinate normalized to 0-1 range relative to canvas. */
  y: number;
  /** Raw pixel X relative to canvas. */
  rawX: number;
  /** Raw pixel Y relative to canvas. */
  rawY: number;
}

export interface RendererState {
  id: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  draw: RendererCallback;
  params: Record<string, number | string | boolean>;
  config: VisualizationConfig;
  active: boolean;
  /** Rolling FPS samples (last 60 frame deltas in ms). */
  frameTimes: number[];
  lastFrameTime: number;
  pointerCallbacks: PointerEventCallback[];
  resizeObserver: ResizeObserver | null;
  /** Bound event handlers for cleanup. */
  boundHandlers: {
    pointerDown: (e: PointerEvent) => void;
    pointerMove: (e: PointerEvent) => void;
    pointerUp: (e: PointerEvent) => void;
    touchStart: (e: TouchEvent) => void;
    touchMove: (e: TouchEvent) => void;
    touchEnd: (e: TouchEvent) => void;
  };
}

// ─── Rolling FPS Window Size ─────────────────────────────
const FPS_WINDOW = 60;

// ─── Canvas Manager ──────────────────────────────────────

/**
 * Manages multiple canvas renderers through a single requestAnimationFrame loop.
 * Handles responsive sizing, parameter binding, pointer normalization, and FPS tracking.
 */
export class CanvasManager {
  private renderers: Map<string, RendererState> = new Map();
  private animationId: number | null = null;
  private running = false;
  private nextId = 0;

  // ── Renderer Lifecycle ───────────────────────────────

  /**
   * Create a new renderer attached to a canvas element.
   * The canvas is created inside the provided container element.
   * Returns a unique renderer ID.
   */
  createRenderer(
    canvasElement: HTMLCanvasElement,
    config: VisualizationConfig,
    draw: RendererCallback,
  ): string {
    const id = `renderer-${this.nextId++}`;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      throw new Error(`CanvasManager: could not get 2D context for renderer ${id}`);
    }

    // Build initial params from config
    const params: Record<string, number | string | boolean> = {};
    for (const p of config.interactiveParams) {
      params[p.name] = p.default;
    }

    // Pointer event normalization helpers
    const normalize = (clientX: number, clientY: number, type: NormalizedPointerEvent['type']): NormalizedPointerEvent => {
      const rect = canvasElement.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      return {
        type,
        x: rect.width > 0 ? rawX / rect.width : 0,
        y: rect.height > 0 ? rawY / rect.height : 0,
        rawX,
        rawY,
      };
    };

    const dispatchPointer = (evt: NormalizedPointerEvent): void => {
      const state = this.renderers.get(id);
      if (!state) return;
      for (const cb of state.pointerCallbacks) {
        cb(evt);
      }
    };

    // Bound event handlers
    const boundHandlers = {
      pointerDown: (e: PointerEvent) => dispatchPointer(normalize(e.clientX, e.clientY, 'down')),
      pointerMove: (e: PointerEvent) => dispatchPointer(normalize(e.clientX, e.clientY, 'move')),
      pointerUp: (_e: PointerEvent) => {
        const state = this.renderers.get(id);
        if (!state) return;
        for (const cb of state.pointerCallbacks) {
          cb({ type: 'up', x: 0, y: 0, rawX: 0, rawY: 0 });
        }
      },
      touchStart: (e: TouchEvent) => {
        const t = e.touches[0];
        if (t) dispatchPointer(normalize(t.clientX, t.clientY, 'down'));
      },
      touchMove: (e: TouchEvent) => {
        const t = e.touches[0];
        if (t) dispatchPointer(normalize(t.clientX, t.clientY, 'move'));
      },
      touchEnd: (_e: TouchEvent) => {
        const state = this.renderers.get(id);
        if (!state) return;
        for (const cb of state.pointerCallbacks) {
          cb({ type: 'up', x: 0, y: 0, rawX: 0, rawY: 0 });
        }
      },
    };

    // Attach pointer events
    canvasElement.addEventListener('pointerdown', boundHandlers.pointerDown);
    canvasElement.addEventListener('pointermove', boundHandlers.pointerMove);
    canvasElement.addEventListener('pointerup', boundHandlers.pointerUp);
    canvasElement.addEventListener('touchstart', boundHandlers.touchStart, { passive: true });
    canvasElement.addEventListener('touchmove', boundHandlers.touchMove, { passive: true });
    canvasElement.addEventListener('touchend', boundHandlers.touchEnd, { passive: true });

    // Responsive resize
    let resizeObserver: ResizeObserver | null = null;
    if (config.responsive && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.resizeCanvas(canvasElement, width, height);
          }
        }
      });
      resizeObserver.observe(canvasElement.parentElement ?? canvasElement);
    }

    const state: RendererState = {
      id,
      canvas: canvasElement,
      ctx,
      draw,
      params,
      config,
      active: true,
      frameTimes: [],
      lastFrameTime: 0,
      pointerCallbacks: [],
      resizeObserver,
      boundHandlers,
    };

    this.renderers.set(id, state);

    // Start the animation loop if not already running
    if (!this.running) {
      this.startLoop();
    }

    return id;
  }

  /**
   * Destroy a single renderer. Removes event listeners, stops observing resize,
   * and removes the renderer from the animation loop.
   */
  destroyRenderer(rendererId: string): void {
    const state = this.renderers.get(rendererId);
    if (!state) return;

    state.active = false;
    this.cleanupRendererState(state);
    this.renderers.delete(rendererId);

    // Stop loop if no renderers remain
    if (this.renderers.size === 0) {
      this.stopLoop();
    }
  }

  /**
   * Get the current state of a renderer, or null if not found.
   */
  getRenderer(rendererId: string): RendererState | null {
    return this.renderers.get(rendererId) ?? null;
  }

  // ── Parameter System ─────────────────────────────────

  /**
   * Set a single parameter on a renderer. Takes effect on the next frame.
   */
  setParam(rendererId: string, name: string, value: number | string | boolean): void {
    const state = this.renderers.get(rendererId);
    if (!state) return;
    state.params[name] = value;
  }

  /**
   * Get a single parameter value from a renderer.
   */
  getParam(rendererId: string, name: string): number | string | boolean | undefined {
    const state = this.renderers.get(rendererId);
    if (!state) return undefined;
    return state.params[name];
  }

  /**
   * Get all parameters for a renderer as a plain object.
   */
  getParams(rendererId: string): Record<string, number | string | boolean> {
    const state = this.renderers.get(rendererId);
    if (!state) return {};
    return { ...state.params };
  }

  // ── Interaction ──────────────────────────────────────

  /**
   * Register a callback for pointer events on a renderer.
   * Events have normalized (0-1) coordinates relative to the canvas.
   */
  onPointerEvent(rendererId: string, callback: PointerEventCallback): void {
    const state = this.renderers.get(rendererId);
    if (!state) return;
    state.pointerCallbacks.push(callback);
  }

  // ── Utilities ────────────────────────────────────────

  /**
   * Get the rolling-average FPS for a renderer over the last 60 frames.
   */
  getFps(rendererId: string): number {
    const state = this.renderers.get(rendererId);
    if (!state || state.frameTimes.length === 0) return 0;

    const sum = state.frameTimes.reduce((a, b) => a + b, 0);
    const avgFrameTime = sum / state.frameTimes.length;
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  /**
   * Capture the current frame of a renderer as a data URL (PNG).
   */
  captureFrame(rendererId: string): string {
    const state = this.renderers.get(rendererId);
    if (!state) return '';
    return state.canvas.toDataURL('image/png');
  }

  /**
   * Manually trigger a responsive resize for a renderer.
   * Reads the parent element's dimensions and resizes without distortion.
   */
  resize(rendererId: string): void {
    const state = this.renderers.get(rendererId);
    if (!state) return;

    const parent = state.canvas.parentElement;
    if (parent) {
      const { width, height } = parent.getBoundingClientRect();
      if (width > 0 && height > 0) {
        this.resizeCanvas(state.canvas, width, height);
      }
    }
  }

  /**
   * Destroy all renderers. Stop the animation loop and clean up everything.
   */
  destroyAll(): void {
    for (const state of Array.from(this.renderers.values())) {
      state.active = false;
      this.cleanupRendererState(state);
    }
    this.renderers.clear();
    this.stopLoop();
  }

  /**
   * Number of active renderers currently managed.
   */
  get rendererCount(): number {
    return this.renderers.size;
  }

  /**
   * Whether the animation loop is currently running.
   */
  get isRunning(): boolean {
    return this.running;
  }

  // ── Private Helpers ──────────────────────────────────

  private startLoop(): void {
    if (this.running) return;
    this.running = true;

    const tick = (timestamp: number): void => {
      if (!this.running) return;

      for (const state of Array.from(this.renderers.values())) {
        if (!state.active) continue;

        // Compute delta time
        const dt = state.lastFrameTime > 0
          ? (timestamp - state.lastFrameTime) / 1000 // seconds
          : 1 / 60; // assume 60fps first frame
        state.lastFrameTime = timestamp;

        // Track frame time for FPS calculation (store in ms)
        state.frameTimes.push(dt * 1000);
        if (state.frameTimes.length > FPS_WINDOW) {
          state.frameTimes.shift();
        }

        // Draw
        const { width, height } = state.canvas;
        state.draw(state.ctx, state.params, dt, width, height);
      }

      this.animationId = requestAnimationFrame(tick);
    };

    this.animationId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private cleanupRendererState(state: RendererState): void {
    // Remove event listeners
    const { canvas, boundHandlers, resizeObserver } = state;
    canvas.removeEventListener('pointerdown', boundHandlers.pointerDown);
    canvas.removeEventListener('pointermove', boundHandlers.pointerMove);
    canvas.removeEventListener('pointerup', boundHandlers.pointerUp);
    canvas.removeEventListener('touchstart', boundHandlers.touchStart);
    canvas.removeEventListener('touchmove', boundHandlers.touchMove);
    canvas.removeEventListener('touchend', boundHandlers.touchEnd);

    // Stop resize observer
    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    // Clear callbacks
    state.pointerCallbacks.length = 0;
  }

  private resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }
}
