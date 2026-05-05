import { describe, it, expect } from 'vitest';
import { mulberry32, smallestEnclosingCircle } from '../enclosing-circle.js';

const EPS = 1e-6;

describe('smallestEnclosingCircle', () => {
  it('returns degenerate disk for empty input', () => {
    const d = smallestEnclosingCircle([]);
    expect(d).toEqual({ x: 0, y: 0, r: 0 });
  });

  it('returns the point itself for a single input', () => {
    const d = smallestEnclosingCircle([{ x: 3, y: -2 }]);
    expect(d.x).toBeCloseTo(3, 9);
    expect(d.y).toBeCloseTo(-2, 9);
    expect(d.r).toBeCloseTo(0, 9);
  });

  it('preserves single-disk input radius', () => {
    const d = smallestEnclosingCircle([{ x: 1, y: 1, r: 4 }]);
    expect(d.r).toBeCloseTo(4, 9);
  });

  it('handles two colinear points (diameter on the line)', () => {
    const d = smallestEnclosingCircle([{ x: 0, y: 0 }, { x: 4, y: 0 }]);
    expect(d.x).toBeCloseTo(2, 9);
    expect(d.y).toBeCloseTo(0, 9);
    expect(d.r).toBeCloseTo(2, 9);
  });

  it('handles three colinear points (degenerates to fromTwo of extremes)', () => {
    const d = smallestEnclosingCircle([
      { x: -3, y: 0 },
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(d.x).toBeCloseTo(0, 9);
    expect(d.y).toBeCloseTo(0, 9);
    expect(d.r).toBeCloseTo(3, 9);
  });

  it('handles three points in general position (circumscribed circle)', () => {
    // Equilateral triangle with side 1, vertices at (0,0), (1,0), (0.5, √3/2).
    // Circumradius = 1/√3.
    const d = smallestEnclosingCircle([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: Math.sqrt(3) / 2 },
    ]);
    expect(d.x).toBeCloseTo(0.5, 6);
    expect(d.y).toBeCloseTo(Math.sqrt(3) / 6, 6);
    expect(d.r).toBeCloseTo(1 / Math.sqrt(3), 6);
  });

  it('produces deterministic output across runs (seeded RNG)', () => {
    const pts = Array.from({ length: 100 }, (_, i) => ({
      x: Math.cos(i * 0.7) * 10,
      y: Math.sin(i * 1.3) * 10,
    }));
    const r1 = smallestEnclosingCircle(pts, mulberry32(42));
    const r2 = smallestEnclosingCircle(pts, mulberry32(42));
    expect(r1).toEqual(r2);
  });

  it('encloses every input point', () => {
    const pts = Array.from({ length: 50 }, (_, i) => ({
      x: Math.cos(i * 2.1) * (i % 7),
      y: Math.sin(i * 1.7) * (i % 5),
    }));
    const d = smallestEnclosingCircle(pts);
    for (const p of pts) {
      const dist = Math.hypot(p.x - d.x, p.y - d.y);
      expect(dist).toBeLessThanOrEqual(d.r + EPS);
    }
  });

  it('encloses disk inputs (Apollonius-style)', () => {
    const disks = [
      { x: 0, y: 0, r: 1 },
      { x: 3, y: 0, r: 1 },
      { x: 1.5, y: 2, r: 0.5 },
    ];
    const d = smallestEnclosingCircle(disks);
    for (const p of disks) {
      const dist = Math.hypot(p.x - d.x, p.y - d.y) + (p.r ?? 0);
      expect(dist).toBeLessThanOrEqual(d.r + 1e-6);
    }
  });

  it('handles many co-located duplicates without infinite loops', () => {
    const pts = Array.from({ length: 30 }, () => ({ x: 5, y: 5 }));
    const d = smallestEnclosingCircle(pts);
    expect(d.x).toBeCloseTo(5, 9);
    expect(d.y).toBeCloseTo(5, 9);
    expect(d.r).toBeCloseTo(0, 9);
  });

  it('result is invariant to input order under random shuffle', () => {
    const pts = Array.from({ length: 20 }, (_, i) => ({
      x: Math.cos(i) * 4,
      y: Math.sin(i * 1.1) * 4,
    }));
    const d1 = smallestEnclosingCircle(pts, mulberry32(1));
    const d2 = smallestEnclosingCircle(pts.slice().reverse(), mulberry32(2));
    expect(d1.r).toBeCloseTo(d2.r, 6);
    expect(d1.x).toBeCloseTo(d2.x, 6);
    expect(d1.y).toBeCloseTo(d2.y, 6);
  });
});
