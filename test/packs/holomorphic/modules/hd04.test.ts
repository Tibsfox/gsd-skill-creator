import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/packs/holomorphic/modules/HD-04');

/* ------------------------------------------------------------------ */
/*  HD-04: Julia Sets and Fatou Sets                                    */
/* ------------------------------------------------------------------ */

describe('HD-04 — Julia Sets and Fatou Sets', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers Julia set definition', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('julia');
    });

    it('covers Fatou set and normal families', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('fatou');
      const hasNormalFamilies =
        content.includes('normal families') ||
        content.includes('equicontinuity');
      expect(hasNormalFamilies).toBe(true);
    });

    it('explains connected vs disconnected Julia sets', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('connected');
      const hasDisconnected =
        content.includes('disconnected') ||
        content.includes('cantor dust') ||
        content.includes('cantor set');
      expect(hasDisconnected).toBe(true);
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import('../../../../src/packs/holomorphic/modules/HD-04/try-session');
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
