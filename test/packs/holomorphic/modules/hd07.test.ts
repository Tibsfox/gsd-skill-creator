import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/holomorphic/modules/HD-07');

/* ------------------------------------------------------------------ */
/*  HD-07: From Dynamics to Deep Learning                               */
/* ------------------------------------------------------------------ */

describe('HD-07 — From Dynamics to Deep Learning', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers loss landscape or loss surface', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      const hasLossLandscape =
        content.includes('loss landscape') ||
        content.includes('loss surface');
      expect(hasLossLandscape).toBe(true);
    });

    it('discusses gradient descent', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('gradient');
    });

    it('mentions deep learning or neural networks', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      const hasDeepLearning =
        content.includes('deep learning') ||
        content.includes('neural network');
      expect(hasDeepLearning).toBe(true);
    });

    it('covers SGD or stochastic methods', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      const hasSGD =
        content.includes('sgd') ||
        content.includes('stochastic');
      expect(hasSGD).toBe(true);
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../../src/holomorphic/modules/HD-07/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
