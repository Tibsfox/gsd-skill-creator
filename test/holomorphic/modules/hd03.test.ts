import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../src/holomorphic/modules/HD-03');

/* ------------------------------------------------------------------ */
/*  HD-03: The Mandelbrot Set                                          */
/* ------------------------------------------------------------------ */

describe('HD-03 — The Mandelbrot Set', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers the Mandelbrot set definition', () => {
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.toLowerCase()).toContain('mandelbrot');
      expect(content.toLowerCase()).toContain('parameter space');
    });

    it('discusses the main cardioid', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('cardioid');
    });

    it('explains connectedness and Julia set relationship', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('connected');
      expect(content).toContain('julia');
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../src/holomorphic/modules/HD-03/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
