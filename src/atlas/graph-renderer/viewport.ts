/**
 * Viewport: pan/zoom state and screen↔world coordinate transforms.
 *
 * The viewport stores world-space pan offset (x, y) and a scalar zoom factor.
 * `worldToScreen` and `screenToView` are exact inverses of each other (modulo
 * fp rounding) and are tested as round-trips.
 *
 * @module atlas/graph-renderer/viewport
 */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface ViewportState {
  /** World-space x of the screen origin (top-left). */
  panX: number;
  /** World-space y of the screen origin (top-left). */
  panY: number;
  /** Pixels per world-unit. */
  zoom: number;
  /** Screen viewport width in pixels. */
  width: number;
  /** Screen viewport height in pixels. */
  height: number;
}

export interface ViewportLimits {
  readonly minZoom: number;
  readonly maxZoom: number;
}

export const DEFAULT_LIMITS: ViewportLimits = { minZoom: 0.05, maxZoom: 50 };

export function createViewport(width: number, height: number): ViewportState {
  return { panX: 0, panY: 0, zoom: 1, width, height };
}

export function worldToScreen(vp: ViewportState, p: Vec2): Vec2 {
  return { x: (p.x - vp.panX) * vp.zoom, y: (p.y - vp.panY) * vp.zoom };
}

export function screenToWorld(vp: ViewportState, p: Vec2): Vec2 {
  // Inverse of worldToScreen; guard against zero zoom (caller's bug, but defend).
  const z = vp.zoom === 0 ? 1 : vp.zoom;
  return { x: p.x / z + vp.panX, y: p.y / z + vp.panY };
}

export function pan(vp: ViewportState, dxScreen: number, dyScreen: number): void {
  // Pan deltas arrive in screen pixels; convert by zoom so user motion feels 1:1.
  vp.panX -= dxScreen / vp.zoom;
  vp.panY -= dyScreen / vp.zoom;
}

/**
 * Zoom around an anchor screen-point (e.g. mouse cursor). After the operation
 * the world-point currently under the anchor stays under the anchor.
 */
export function zoomAt(
  vp: ViewportState,
  anchorScreen: Vec2,
  factor: number,
  limits: ViewportLimits = DEFAULT_LIMITS,
): void {
  const before = screenToWorld(vp, anchorScreen);
  const next = clamp(vp.zoom * factor, limits.minZoom, limits.maxZoom);
  vp.zoom = next;
  const after = screenToWorld(vp, anchorScreen);
  vp.panX += before.x - after.x;
  vp.panY += before.y - after.y;
}

/** 4×4 column-major orthographic projection mapping world-space to clip-space. */
export function viewProjectionMatrix(vp: ViewportState): Float32Array {
  // Maps world (panX..panX + width/zoom, panY..panY + height/zoom) → clip [-1, 1].
  const w = vp.width / vp.zoom;
  const h = vp.height / vp.zoom;
  const sx = 2 / w;
  const sy = -2 / h; // flip Y so screen-y grows downward
  const tx = -1 - vp.panX * sx;
  const ty = 1 - vp.panY * sy;
  // prettier-ignore
  return new Float32Array([
    sx, 0,  0, 0,
    0,  sy, 0, 0,
    0,  0,  1, 0,
    tx, ty, 0, 1,
  ]);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
