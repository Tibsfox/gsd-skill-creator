import { describe, it, expect } from 'vitest';
import {
  distance,
  radiusCircle,
  symbolHalo,
  pointInCircle,
  bboxIntersects,
  bboxContains,
  haloIntersection,
  featureCollection,
  point,
  type Halo,
} from '../turf-like.js';

describe('turf-like — distance', () => {
  it('zero distance for identical points', () => {
    expect(distance({ x: 100, y: 200 }, { x: 100, y: 200 })).toBe(0);
  });
  it('Pythagorean 3-4-5', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('turf-like — radiusCircle / symbolHalo', () => {
  it('radiusCircle has steps + 1 vertices (closed ring)', () => {
    const c = radiusCircle({ x: 0, y: 0 }, 100, 32);
    expect(c.geometry.type).toBe('Polygon');
    expect(c.geometry.coordinates[0]).toHaveLength(33);
  });
  it('all points on ring are at radius from center', () => {
    const center = { x: 50, y: 75 };
    const r = 25;
    const c = radiusCircle(center, r, 64);
    for (const [x, y] of c.geometry.coordinates[0]!) {
      const d = distance({ x, y }, center);
      expect(Math.abs(d - r)).toBeLessThan(0.001);
    }
  });
  it('symbolHalo equals radiusCircle for matching args', () => {
    const a = symbolHalo({ x: 10, y: 20 }, 5, 32);
    const b = radiusCircle({ x: 10, y: 20 }, 5, 32);
    expect(a.geometry.coordinates).toEqual(b.geometry.coordinates);
  });
});

describe('turf-like — pointInCircle', () => {
  it('inside', () => {
    expect(pointInCircle({ x: 1, y: 1 }, { x: 0, y: 0 }, 5)).toBe(true);
  });
  it('on boundary (≤)', () => {
    expect(pointInCircle({ x: 5, y: 0 }, { x: 0, y: 0 }, 5)).toBe(true);
  });
  it('outside', () => {
    expect(pointInCircle({ x: 6, y: 0 }, { x: 0, y: 0 }, 5)).toBe(false);
  });
});

describe('turf-like — bboxIntersects / bboxContains', () => {
  const a = { min_x: 0, min_y: 0, max_x: 10, max_y: 10 };
  it('overlapping → true', () => {
    expect(bboxIntersects(a, { min_x: 5, min_y: 5, max_x: 15, max_y: 15 })).toBe(true);
  });
  it('disjoint right → false', () => {
    expect(bboxIntersects(a, { min_x: 11, min_y: 0, max_x: 20, max_y: 10 })).toBe(false);
  });
  it('disjoint above → false', () => {
    expect(bboxIntersects(a, { min_x: 0, min_y: 11, max_x: 10, max_y: 20 })).toBe(false);
  });
  it('touching edges still intersects', () => {
    expect(bboxIntersects(a, { min_x: 10, min_y: 0, max_x: 20, max_y: 10 })).toBe(true);
  });
  it('contains: inner ⊂ outer → true', () => {
    expect(bboxContains(a, { min_x: 2, min_y: 2, max_x: 8, max_y: 8 })).toBe(true);
  });
  it('contains: equal bboxes → true', () => {
    expect(bboxContains(a, a)).toBe(true);
  });
  it('contains: partial overlap → false', () => {
    expect(bboxContains(a, { min_x: 5, min_y: 5, max_x: 15, max_y: 15 })).toBe(false);
  });
});

describe('turf-like — haloIntersection (typed Halo input; NIT-02 fix)', () => {
  it('disjoint circles → null', () => {
    expect(haloIntersection(
      { center: { x: 0, y: 0 }, radius: 5 },
      { center: { x: 100, y: 0 }, radius: 5 },
    )).toBeNull();
  });
  it('one fully contains the other → returns smaller as a polygon', () => {
    const r = haloIntersection(
      { center: { x: 0, y: 0 }, radius: 100 },
      { center: { x: 0, y: 0 }, radius: 10 },
    );
    expect(r).not.toBeNull();
    expect(r!.geometry.type).toBe('Polygon');
  });
  it('overlapping → polygon ring with vertices on both arcs', () => {
    const lens = haloIntersection(
      { center: { x: 0, y: 0 }, radius: 10 },
      { center: { x: 8, y: 0 }, radius: 10 },
      32,
    );
    expect(lens).not.toBeNull();
    expect(lens!.geometry.type).toBe('Polygon');
    expect(lens!.geometry.coordinates[0]!.length).toBeGreaterThan(60);
  });
});

describe('turf-like — featureCollection / point constructors', () => {
  it('point wraps a SpatialPoint into a Feature<Point>', () => {
    const p = point({ x: 100, y: 200 }, { id: 'foo' });
    expect(p.type).toBe('Feature');
    expect(p.geometry.coordinates).toEqual([100, 200]);
    expect(p.properties.id).toBe('foo');
  });
  it('featureCollection wraps a list of features', () => {
    const fc = featureCollection([
      point({ x: 0, y: 0 }),
      point({ x: 10, y: 10 }),
    ]);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(2);
  });
});
