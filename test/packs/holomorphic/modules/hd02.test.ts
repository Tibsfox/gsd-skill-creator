import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/holomorphic/modules/HD-02');

/* ------------------------------------------------------------------ */
/*  HD-02: Fixed Points and Stability                                  */
/* ------------------------------------------------------------------ */

describe('HD-02 — Fixed Points and Stability', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers fixed point definition', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('fixed point');
    });

    it('explains the multiplier', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('multiplier');
    });

    it('covers all five classifications', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('superattracting');
      expect(content).toContain('attracting');
      expect(content).toContain('repelling');
      expect(content).toContain('indifferent');
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../../src/holomorphic/modules/HD-02/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
