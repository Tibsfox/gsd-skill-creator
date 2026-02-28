import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/holomorphic/modules/HD-05');

/* ------------------------------------------------------------------ */
/*  HD-05: Cycles and Period Doubling                                   */
/* ------------------------------------------------------------------ */

describe('HD-05 — Cycles and Period Doubling', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers periodic orbits and cycles', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('period');
      const hasCycle =
        content.includes('cycle') ||
        content.includes('periodic orbit');
      expect(hasCycle).toBe(true);
    });

    it('explains bifurcation', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('bifurcation');
    });

    it('mentions Feigenbaum constant or period doubling', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      const hasFeigenbaum =
        content.includes('feigenbaum') ||
        content.includes('doubling');
      expect(hasFeigenbaum).toBe(true);
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../../src/holomorphic/modules/HD-05/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
