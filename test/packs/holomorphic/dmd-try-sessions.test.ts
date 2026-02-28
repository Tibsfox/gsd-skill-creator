import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../src/holomorphic/modules/HD-09');

/* ------------------------------------------------------------------ */
/*  HD-09 Try Sessions & Eigenvalue Visualizer                          */
/* ------------------------------------------------------------------ */

describe('HD-09 Try Sessions & Eigenvalue Visualizer', () => {
  describe('Python try-session', () => {
    const pyPath = resolve(MODULE_DIR, 'try-session.py');

    it('exists with PyDMD imports', () => {
      expect(existsSync(pyPath)).toBe(true);
      const content = readFileSync(pyPath, 'utf-8');
      expect(content).toContain('pydmd');
      expect(content).toContain('numpy');
    });

    it('creates synthetic skill activation data', () => {
      const content = readFileSync(pyPath, 'utf-8').toLowerCase();
      expect(content).toContain('snapshot');
      expect(content).toContain('def run_try_session');
    });
  });

  describe('TypeScript try-session', () => {
    it('exports runTrySession function', async () => {
      const mod = await import('../../../src/holomorphic/modules/HD-09/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });

  describe('eigenvalue visualizer', () => {
    it('plotEigenvaluesOnUnitCircle returns unit circle and eigenvalue points', async () => {
      const { plotEigenvaluesOnUnitCircle } = await import(
        '../../../src/holomorphic/renderer/eigenvalue-plot'
      );

      const eigenvalues = [
        { re: 0.8, im: 0.3 },
        { re: 1.0, im: 0.0 },
        { re: 1.2, im: -0.1 },
      ];

      const result = plotEigenvaluesOnUnitCircle(eigenvalues);

      // Unit circle should have points
      expect(result.unitCircle.length).toBeGreaterThan(0);
      // Every unit circle point should be approximately on the circle
      for (const pt of result.unitCircle) {
        const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
        expect(dist).toBeCloseTo(1.0, 5);
      }

      // Eigenvalue points should match input count
      expect(result.eigenvalues.length).toBe(3);
      // Each eigenvalue point should have classification and magnitude
      for (const pt of result.eigenvalues) {
        expect(pt).toHaveProperty('x');
        expect(pt).toHaveProperty('y');
        expect(pt).toHaveProperty('classification');
        expect(pt).toHaveProperty('magnitude');
      }
    });

    it('classifies eigenvalues by unit circle position', async () => {
      const { plotEigenvaluesOnUnitCircle } = await import(
        '../../../src/holomorphic/renderer/eigenvalue-plot'
      );

      const eigenvalues = [
        { re: 0.5, im: 0.0 },   // attracting (inside)
        { re: 1.0, im: 0.0 },   // neutral (on)
        { re: 1.5, im: 0.0 },   // repelling (outside)
      ];

      const result = plotEigenvaluesOnUnitCircle(eigenvalues);

      expect(result.eigenvalues[0].classification).toBe('attracting');
      expect(result.eigenvalues[1].classification).toBe('neutral');
      expect(result.eigenvalues[2].classification).toBe('repelling');
    });
  });
});
