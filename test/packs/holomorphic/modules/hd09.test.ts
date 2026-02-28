import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/packs/holomorphic/modules/HD-09');

/* ------------------------------------------------------------------ */
/*  HD-09: Dynamic Mode Decomposition                                   */
/* ------------------------------------------------------------------ */

describe('HD-09 — Dynamic Mode Decomposition', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers DMD algorithm (X-prime approx AX, SVD, projected operator)', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('svd');
      const hasDMDAlgorithm =
        content.includes('x\'') ||
        content.includes('x\u2032') ||
        content.includes('x_prime') ||
        content.includes('snapshot');
      expect(hasDMDAlgorithm).toBe(true);
    });

    it('covers unit circle eigenvalue classification', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('unit circle');
      expect(content).toContain('decaying');
      expect(content).toContain('growing');
    });

    it('covers DMD-to-holomorphic bridge (eigenvalues and multipliers)', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      const hasBridge =
        content.includes('holomorphic') ||
        content.includes('multiplier');
      expect(hasBridge).toBe(true);
      expect(content).toContain('eigenvalue');
    });

    it('covers Parker video connection', () => {
      const content = readFileSync(contentPath, 'utf-8');
      const hasParker =
        content.toLowerCase().includes('parker') ||
        content.includes('PDE') ||
        content.includes('partial differential equation');
      expect(hasParker).toBe(true);
    });

    it('covers DMD variants', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('pidmd');
      const hasVariants =
        content.includes('streaming') ||
        content.includes('multi-resolution') ||
        content.includes('compressed');
      expect(hasVariants).toBe(true);
    });
  });

  describe('references/pydmd.md', () => {
    const refPath = resolve(MODULE_DIR, 'references/pydmd.md');

    it('exists and references PyDMD library', () => {
      expect(existsSync(refPath)).toBe(true);
      const content = readFileSync(refPath, 'utf-8');
      expect(content.toLowerCase()).toContain('pydmd');
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../../src/packs/holomorphic/modules/HD-09/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
