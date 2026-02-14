/**
 * WebGL2 context management: creation, loss handling, and canvas resize.
 *
 * The canvas is positioned as a fullscreen fixed background (z-index 0,
 * pointer-events none) so the DOM layer sits above it for all interaction.
 */

export type GLContextResult =
  | { type: 'webgl2'; gl: WebGL2RenderingContext; canvas: HTMLCanvasElement }
  | { type: 'css-fallback'; gl: null; canvas: null };

/**
 * Create a fullscreen WebGL2 canvas and context.
 * Returns css-fallback discriminant when WebGL2 is unavailable.
 */
export function createGLContext(container: HTMLElement): GLContextResult {
  const canvas = document.createElement('canvas');

  // Fullscreen fixed background styling (WEBGL-01)
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    // WebGL2 unavailable -- fall back to CSS-only rendering
    return { type: 'css-fallback', gl: null, canvas: null };
  }

  container.prepend(canvas);
  return { type: 'webgl2', gl, canvas };
}

/**
 * Attach handlers for WebGL context loss and restoration.
 * Calls preventDefault on contextlost to enable recovery.
 */
export function attachContextLossHandlers(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void,
): void {
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    onLost();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    onRestored();
  });
}

/**
 * Resize canvas to match its CSS size at the current device pixel ratio,
 * and update the GL viewport accordingly.
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
): void {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
