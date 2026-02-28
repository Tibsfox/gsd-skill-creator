import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/holomorphic/modules/HD-10');

/* ------------------------------------------------------------------ */
/*  HD-10: Koopman Operator Theory                                      */
/* ------------------------------------------------------------------ */

describe('HD-10 — Koopman Operator Theory', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers Koopman operator definition (Kg(x) = g(F(x)))', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('koopman');
      const hasDefinition =
        content.includes('g(f(x))') ||
        content.includes('g ∘ f') ||
        content.includes('g compose f') ||
        content.includes('observable');
      expect(hasDefinition).toBe(true);
    });

    it('covers eigenfunctions and eigenvalues of Koopman operator', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('eigenfunction');
      expect(content).toContain('eigenvalue');
    });

    it('covers connection to holomorphic dynamics (Koopman eigenvalues = geometric multipliers)', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      const hasConnection =
        content.includes('holomorphic') ||
        content.includes('multiplier') ||
        content.includes('z^n') ||
        content.includes('z²');
      expect(hasConnection).toBe(true);
    });

    it('covers EDMD dictionary lifting', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('edmd');
      const hasLifting =
        content.includes('dictionary') ||
        content.includes('lifting') ||
        content.includes('observable');
      expect(hasLifting).toBe(true);
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../../src/holomorphic/modules/HD-10/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });

  describe('try-session.py', () => {
    it('exists', () => {
      const pyPath = resolve(MODULE_DIR, 'try-session.py');
      expect(existsSync(pyPath)).toBe(true);
    });
  });
});
