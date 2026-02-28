import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/holomorphic/modules/HD-08');

/* ------------------------------------------------------------------ */
/*  HD-08: Skill-Creator as a Dynamical System                         */
/* ------------------------------------------------------------------ */

describe('HD-08 — Skill-Creator as a Dynamical System', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('maps observation pipeline to iteration function', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('observation');
      expect(content).toContain('iteration');
      const hasPipeline =
        content.includes('pipeline') || content.includes('observe');
      expect(hasPipeline).toBe(true);
    });

    it('maps bounded learning to angular velocity limit', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('bounded');
      const hasAngularVelocity =
        content.includes('angular velocity') ||
        content.includes('angular') ||
        content.includes('20%');
      expect(hasAngularVelocity).toBe(true);
    });

    it('maps promotion to convergence to real axis', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('promotion');
      expect(content).toContain('real axis');
      expect(content).toContain('convergence');
    });

    it('explains Fatou/Julia mapping to skill categories', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('fatou');
      expect(content).toContain('julia');
      const hasStable =
        content.includes('stable') || content.includes('predictable');
      expect(hasStable).toBe(true);
    });

    it('includes operational TypeScript example code', () => {
      const content = readFileSync(contentPath, 'utf-8');
      const hasCode =
        content.includes('```typescript') ||
        content.includes('```ts') ||
        content.includes('z_{n+1}');
      expect(hasCode).toBe(true);
    });
  });

  describe('try-session.ts', () => {
    it('exists', () => {
      const tryPath = resolve(MODULE_DIR, 'try-session.ts');
      expect(existsSync(tryPath)).toBe(true);
    });

    it('exports runTrySession function', async () => {
      const mod = await import(
        '../../../../src/holomorphic/modules/HD-08/try-session'
      );
      expect(typeof mod.runTrySession).toBe('function');
    });
  });
});
