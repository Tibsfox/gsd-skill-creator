/**
 * CSS-only CRT effect fallback.
 *
 * Applied when WebGL2 is unavailable (or after context loss).
 * Provides scanline and vignette approximations via CSS gradients.
 * No barrel distortion, chromatic aberration, or phosphor glow in fallback.
 */

/**
 * Apply CSS fallback CRT overlays to the given container.
 * Idempotent: removes existing overlays before adding new ones.
 */
export function applyCSSFallback(container: HTMLElement): void {
  // Remove existing to prevent duplicates
  removeCSSFallback(container);

  // Scanline overlay
  const scanline = document.createElement('div');
  scanline.className = 'crt-fallback-overlay';
  scanline.style.position = 'fixed';
  scanline.style.top = '0';
  scanline.style.left = '0';
  scanline.style.width = '100vw';
  scanline.style.height = '100vh';
  scanline.style.pointerEvents = 'none';
  scanline.style.zIndex = '9998';
  scanline.style.background =
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)';

  // Vignette overlay
  const vignette = document.createElement('div');
  vignette.className = 'crt-fallback-vignette';
  vignette.style.position = 'fixed';
  vignette.style.top = '0';
  vignette.style.left = '0';
  vignette.style.width = '100vw';
  vignette.style.height = '100vh';
  vignette.style.pointerEvents = 'none';
  vignette.style.zIndex = '9999';
  vignette.style.background =
    'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)';

  container.appendChild(scanline);
  container.appendChild(vignette);
}

/**
 * Remove CSS fallback CRT overlays from the given container.
 */
export function removeCSSFallback(container: HTMLElement): void {
  const scanline = container.querySelector('.crt-fallback-overlay');
  if (scanline) scanline.remove();

  const vignette = container.querySelector('.crt-fallback-vignette');
  if (vignette) vignette.remove();
}
