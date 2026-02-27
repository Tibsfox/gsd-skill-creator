import { describe, it, expect } from 'vitest';
import {
  pixelToComplex,
  mandelbrotEscape,
  juliaEscape,
  colorMap,
  renderMandelbrot,
  renderJulia,
  applyZoom,
} from '../../src/holomorphic/renderer/core';
import type { RGB } from '../../src/holomorphic/types';

/* ------------------------------------------------------------------ */
/*  Fractal Renderer Core                                               */
/* ------------------------------------------------------------------ */

describe('Fractal Renderer — Core', () => {
  const defaultBounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };

  /* ---- pixelToComplex -------------------------------------------- */

  describe('pixelToComplex', () => {
    it('maps center pixel to center of bounds', () => {
      const c = pixelToComplex(50, 50, 100, 100, defaultBounds);
      expect(c.re).toBeCloseTo(0, 5);
      expect(c.im).toBeCloseTo(0, 5);
    });

    it('maps top-left pixel to top-left corner of bounds', () => {
      const c = pixelToComplex(0, 0, 100, 100, defaultBounds);
      expect(c.re).toBeCloseTo(-2, 1);
      expect(c.im).toBeCloseTo(2, 1);
    });

    it('maps bottom-right pixel to bottom-right corner of bounds', () => {
      const c = pixelToComplex(99, 99, 100, 100, defaultBounds);
      expect(c.re).toBeCloseTo(2, 0);
      expect(c.im).toBeCloseTo(-2, 0);
    });
  });

  /* ---- mandelbrotEscape ------------------------------------------ */

  describe('mandelbrotEscape', () => {
    it('returns maxIter for c = {re:0, im:0} (never escapes)', () => {
      const result = mandelbrotEscape({ re: 0, im: 0 }, 100, 2);
      expect(result).toBe(100);
    });

    it('returns < maxIter for c = {re:2, im:0} (escapes immediately)', () => {
      const result = mandelbrotEscape({ re: 2, im: 0 }, 100, 2);
      expect(result).toBeLessThan(100);
    });

    it('center of Mandelbrot approx {re:-0.5, im:0} does not escape at maxIter=100', () => {
      const result = mandelbrotEscape({ re: -0.5, im: 0 }, 100, 2);
      expect(result).toBe(100);
    });

    it('point far from origin escapes in few iterations', () => {
      const result = mandelbrotEscape({ re: 10, im: 10 }, 256, 2);
      expect(result).toBeLessThan(5);
    });
  });

  /* ---- juliaEscape ----------------------------------------------- */

  describe('juliaEscape', () => {
    it('returns maxIter for points in the Fatou set (filled Julia)', () => {
      // c = 0 gives Julia set = unit circle; z0 at origin stays at origin
      const result = juliaEscape({ re: 0, im: 0 }, { re: 0, im: 0 }, 100, 2);
      expect(result).toBe(100);
    });

    it('returns < maxIter for escaping points', () => {
      // z0 far from origin, any c → escapes
      const result = juliaEscape({ re: 5, im: 5 }, { re: 0, im: 0 }, 100, 2);
      expect(result).toBeLessThan(100);
    });
  });

  /* ---- colorMap -------------------------------------------------- */

  describe('colorMap', () => {
    it('returns valid RGB values in 0-255 range', () => {
      const color = colorMap(50, 100, 'escape_time');
      expect(color.r).toBeGreaterThanOrEqual(0);
      expect(color.r).toBeLessThanOrEqual(255);
      expect(color.g).toBeGreaterThanOrEqual(0);
      expect(color.g).toBeLessThanOrEqual(255);
      expect(color.b).toBeGreaterThanOrEqual(0);
      expect(color.b).toBeLessThanOrEqual(255);
    });

    it('binary scheme: escaped point → white', () => {
      const color = colorMap(50, 100, 'binary');
      expect(color).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('binary scheme: non-escaped point → black', () => {
      const color = colorMap(100, 100, 'binary');
      expect(color).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  /* ---- renderMandelbrot ------------------------------------------ */

  describe('renderMandelbrot', () => {
    it('returns 2D array of [width][height] escape times', () => {
      const grid = renderMandelbrot(20, 15, defaultBounds, 50, 2);
      expect(grid).toHaveLength(20);
      expect(grid[0]).toHaveLength(15);
      for (const col of grid) {
        for (const val of col) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(50);
        }
      }
    });
  });

  /* ---- renderJulia ----------------------------------------------- */

  describe('renderJulia', () => {
    it('returns 2D array of correct dimensions', () => {
      const c = { re: -0.7, im: 0.27015 };
      const grid = renderJulia(25, 20, defaultBounds, c, 50, 2);
      expect(grid).toHaveLength(25);
      expect(grid[0]).toHaveLength(20);
      for (const col of grid) {
        for (const val of col) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(50);
        }
      }
    });
  });

  /* ---- applyZoom ------------------------------------------------- */

  describe('applyZoom', () => {
    it('zooming in by factor 2 halves the bounds around center', () => {
      const zoomed = applyZoom(defaultBounds, 0, 0, 2);
      expect(zoomed.xMin).toBeCloseTo(-1, 5);
      expect(zoomed.xMax).toBeCloseTo(1, 5);
      expect(zoomed.yMin).toBeCloseTo(-1, 5);
      expect(zoomed.yMax).toBeCloseTo(1, 5);
    });

    it('zooming around an off-center point shifts the view', () => {
      const zoomed = applyZoom(defaultBounds, 1, 1, 2);
      // New half-widths are 1 (4/2/2), centered at (1,1)
      expect(zoomed.xMin).toBeCloseTo(0, 5);
      expect(zoomed.xMax).toBeCloseTo(2, 5);
      expect(zoomed.yMin).toBeCloseTo(0, 5);
      expect(zoomed.yMax).toBeCloseTo(2, 5);
    });
  });
});
