import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/packs/holomorphic/modules/HD-01');

/* ------------------------------------------------------------------ */
/*  HD-01: Iteration on the Complex Plane                              */
/* ------------------------------------------------------------------ */

describe('HD-01 — Iteration on the Complex Plane', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers iteration fundamentals', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('iteration');
      expect(content).toContain('orbit');
    });

    it('explains escape radius concept', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('escape');
    });

    it('includes the quadratic map formula', () => {
      const content = readFileSync(contentPath, 'utf-8');
      // Should contain z^2 + c or z_{n+1} notation
      const hasFormula =
        content.includes('z^2 + c') ||
        content.includes('z² + c') ||
        content.includes('z_{n+1}') ||
        content.includes('z_{n+1}');
      expect(hasFormula).toBe(true);
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../../src/packs/holomorphic/modules/HD-01/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
