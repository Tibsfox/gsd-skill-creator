import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULE_DIR = resolve(__dirname, '../../../../src/packs/holomorphic/modules/HD-06');

/* ------------------------------------------------------------------ */
/*  HD-06: Topology of the Complex Plane                               */
/* ------------------------------------------------------------------ */

describe('HD-06 — Topology of the Complex Plane', () => {
  describe('content.md', () => {
    const contentPath = resolve(MODULE_DIR, 'content.md');

    it('exists and is non-empty', () => {
      expect(existsSync(contentPath)).toBe(true);
      const content = readFileSync(contentPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('covers MAT327 foundations: topological spaces and Hausdorff property', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('topological');
      expect(content).toContain('hausdorff');
    });

    it('covers compactness of Julia sets and connectedness of Mandelbrot set', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('compact');
      expect(content).toContain('julia');
      expect(content).toContain('mandelbrot');
      expect(content).toContain('connected');
    });

    it('references Meyerson Table Theorem with inscribed rectangles in Jordan curves', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('meyerson');
      expect(content).toContain('jordan');
      expect(content).toContain('inscribed');
      expect(content).toContain('rectangle');
    });

    it('references Greene-Lobb rectangular peg theorem for smooth Jordan curves', () => {
      const content = readFileSync(contentPath, 'utf-8').toLowerCase();
      expect(content).toContain('greene');
      expect(content).toContain('lobb');
      const hasAspectRatio =
        content.includes('aspect ratio') ||
        content.includes('every aspect');
      expect(hasAspectRatio).toBe(true);
    });
  });

  describe('references/', () => {
    it('meyerson.md exists with theorem statement and Mobius strip insight', () => {
      const refPath = resolve(MODULE_DIR, 'references/meyerson.md');
      expect(existsSync(refPath)).toBe(true);
      const content = readFileSync(refPath, 'utf-8').toLowerCase();
      expect(content).toContain('meyerson');
      const hasMobius =
        content.includes('möbius') || content.includes('mobius');
      expect(hasMobius).toBe(true);
      expect(content).toContain('intersection');
    });

    it('greene-lobb.md exists with symplectic geometry reference', () => {
      const refPath = resolve(MODULE_DIR, 'references/greene-lobb.md');
      expect(existsSync(refPath)).toBe(true);
      const content = readFileSync(refPath, 'utf-8').toLowerCase();
      expect(content).toContain('greene');
      expect(content).toContain('symplectic');
      expect(content).toContain('lagrangian');
      expect(content).toContain('annals of mathematics');
    });

    it('mat327.md exists with topology definitions and relevance to dynamics', () => {
      const refPath = resolve(MODULE_DIR, 'references/mat327.md');
      expect(existsSync(refPath)).toBe(true);
      const content = readFileSync(refPath, 'utf-8').toLowerCase();
      expect(content).toContain('topological space');
      expect(content).toContain('open');
      expect(content).toContain('compact');
      expect(content).toContain('dynamics');
    });
  });
});
