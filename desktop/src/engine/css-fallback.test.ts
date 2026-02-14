import { describe, it, expect, beforeEach } from 'vitest';
import { applyCSSFallback, removeCSSFallback } from './css-fallback';

describe('applyCSSFallback', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('appends scanline and vignette overlay elements to container', () => {
    applyCSSFallback(container);

    const scanline = container.querySelector('.crt-fallback-overlay');
    const vignette = container.querySelector('.crt-fallback-vignette');

    expect(scanline).not.toBeNull();
    expect(vignette).not.toBeNull();
  });

  it('scanline overlay has correct styles', () => {
    applyCSSFallback(container);

    const scanline = container.querySelector('.crt-fallback-overlay') as HTMLElement;
    expect(scanline.style.position).toBe('fixed');
    expect(scanline.style.width).toBe('100vw');
    expect(scanline.style.height).toBe('100vh');
    expect(scanline.style.pointerEvents).toBe('none');
    expect(scanline.style.zIndex).toBe('9998');
    expect(scanline.style.background).toContain('repeating-linear-gradient');
  });

  it('vignette overlay has correct styles', () => {
    applyCSSFallback(container);

    const vignette = container.querySelector('.crt-fallback-vignette') as HTMLElement;
    expect(vignette.style.position).toBe('fixed');
    expect(vignette.style.width).toBe('100vw');
    expect(vignette.style.height).toBe('100vh');
    expect(vignette.style.pointerEvents).toBe('none');
    expect(vignette.style.zIndex).toBe('9999');
    expect(vignette.style.background).toContain('radial-gradient');
  });

  it('removeCSSFallback removes overlay elements', () => {
    applyCSSFallback(container);
    expect(container.querySelector('.crt-fallback-overlay')).not.toBeNull();
    expect(container.querySelector('.crt-fallback-vignette')).not.toBeNull();

    removeCSSFallback(container);

    expect(container.querySelector('.crt-fallback-overlay')).toBeNull();
    expect(container.querySelector('.crt-fallback-vignette')).toBeNull();
  });

  it('calling applyCSSFallback twice does not duplicate elements', () => {
    applyCSSFallback(container);
    applyCSSFallback(container);

    const scanlines = container.querySelectorAll('.crt-fallback-overlay');
    const vignettes = container.querySelectorAll('.crt-fallback-vignette');

    expect(scanlines.length).toBe(1);
    expect(vignettes.length).toBe(1);
  });
});
