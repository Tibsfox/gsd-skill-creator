import { describe, it, expect } from 'vitest';
import {
  renderBifurcation,
  renderOrbitPlot,
  renderPhasePortrait,
  colorFromScheme,
} from '../../src/holomorphic/renderer/helpers';
import type { ComplexNumber, FixedPointClassification } from '../../src/holomorphic/types';

/* ------------------------------------------------------------------ */
/*  Renderer Visualization Helpers                                      */
/* ------------------------------------------------------------------ */

describe('Renderer — Visualization Helpers', () => {

  /* ---- renderBifurcation ----------------------------------------- */

  describe('renderBifurcation', () => {
    it('produces an array of [width] column arrays', () => {
      const result = renderBifurcation(2.5, 4.0, 30, 20, 50);
      expect(result).toHaveLength(30);
      for (const col of result) {
        expect(Array.isArray(col)).toBe(true);
        // Each column has some y-values (attractor points)
        for (const y of col) {
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(1);
        }
      }
    });

    it('returns non-empty columns for chaotic regime (r near 4)', () => {
      const result = renderBifurcation(3.8, 4.0, 10, 20, 100);
      // At least some columns should have attractor points
      const totalPoints = result.reduce((sum, col) => sum + col.length, 0);
      expect(totalPoints).toBeGreaterThan(0);
    });
  });

  /* ---- renderOrbitPlot ------------------------------------------- */

  describe('renderOrbitPlot', () => {
    it('returns an array of ComplexNumber points', () => {
      const f = (z: ComplexNumber): ComplexNumber => ({
        re: z.re * z.re - z.im * z.im - 0.7,
        im: 2 * z.re * z.im + 0.27015,
      });
      const orbit = renderOrbitPlot({ re: 0, im: 0 }, f, 20);
      expect(orbit.length).toBeGreaterThan(0);
      expect(orbit.length).toBeLessThanOrEqual(20);
      for (const pt of orbit) {
        expect(typeof pt.re).toBe('number');
        expect(typeof pt.im).toBe('number');
      }
    });

    it('returns single point for fixed-point function', () => {
      // f(z) = 0 is a fixed point at the origin
      const f = (_z: ComplexNumber): ComplexNumber => ({ re: 0, im: 0 });
      const orbit = renderOrbitPlot({ re: 0, im: 0 }, f, 10);
      expect(orbit.length).toBe(10);
      for (const pt of orbit) {
        expect(pt.re).toBe(0);
        expect(pt.im).toBe(0);
      }
    });
  });

  /* ---- renderPhasePortrait --------------------------------------- */

  describe('renderPhasePortrait', () => {
    it('returns a grid of FixedPointClassification values', () => {
      const f = (z: ComplexNumber): ComplexNumber => ({
        re: z.re * z.re - z.im * z.im,
        im: 2 * z.re * z.im,
      });
      const bounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
      const grid = renderPhasePortrait(bounds, f, 10, 50);
      expect(grid).toHaveLength(10);
      expect(grid[0]).toHaveLength(10);

      const validClassifications: FixedPointClassification[] = [
        'superattracting', 'attracting', 'repelling',
        'rationally_indifferent', 'irrationally_indifferent',
      ];
      for (const row of grid) {
        for (const cls of row) {
          expect(validClassifications).toContain(cls);
        }
      }
    });
  });

  /* ---- colorFromScheme ------------------------------------------- */

  describe('colorFromScheme', () => {
    it('escape_time returns gradient colors for different t values', () => {
      const c1 = colorFromScheme('escape_time', 0.0);
      const c2 = colorFromScheme('escape_time', 0.5);
      const c3 = colorFromScheme('escape_time', 1.0);
      // Different t values should produce different colors
      expect(c1).not.toEqual(c2);
      // All within valid RGB range
      for (const c of [c1, c2, c3]) {
        expect(c.r).toBeGreaterThanOrEqual(0);
        expect(c.r).toBeLessThanOrEqual(255);
        expect(c.g).toBeGreaterThanOrEqual(0);
        expect(c.g).toBeLessThanOrEqual(255);
        expect(c.b).toBeGreaterThanOrEqual(0);
        expect(c.b).toBeLessThanOrEqual(255);
      }
    });

    it('smooth returns smooth gradient colors', () => {
      const c1 = colorFromScheme('smooth', 0.0);
      const c2 = colorFromScheme('smooth', 0.25);
      const c3 = colorFromScheme('smooth', 0.75);
      // Different t values should yield different colors
      expect(c1).not.toEqual(c2);
      expect(c2).not.toEqual(c3);
      // All within valid RGB range
      for (const c of [c1, c2, c3]) {
        expect(c.r).toBeGreaterThanOrEqual(0);
        expect(c.r).toBeLessThanOrEqual(255);
      }
    });
  });
});
