/**
 * Pure-TypeScript spatial primitives for the atlas browser shell.
 *
 * Component 04 of the gis-spatial-substrate Part B mission. Implements the
 * subset of the Turf.js surface the atlas browser needs (radiusCircle,
 * symbolHalo, haloIntersection, pointInCircle, bboxIntersects, distance)
 * without depending on @turf/* npm packages.
 *
 * The atlas operates in logical coordinates (SRID 0), not WGS84. Turf is
 * Earth-geographic by default; rather than coerce Turf's `units: 'degrees'`
 * fallback, we re-implement the small set of operations the atlas symbol-graph
 * + archeology pane actually use. Everything is Cartesian-flat math.
 *
 * If the atlas later needs WGS84 / spherical math, swap this module for the
 * @turf/* packages — the function signatures match the Turf API surface for
 * a clean upgrade path.
 *
 * Reference: Part A research mission §2.3.4 (Turf.js JS ecosystem).
 */

import type { SpatialPoint, BoundingBox } from '../../../../src/atlas/spatial/types.js';

// ── GeoJSON-shaped types (subset of RFC 7946 we actually use) ─────────────

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface GeoFeature<G> {
  type: 'Feature';
  geometry: G;
  properties: Record<string, unknown>;
}

export interface GeoFeatureCollection<G> {
  type: 'FeatureCollection';
  features: GeoFeature<G>[];
}

// ── Constructors ──────────────────────────────────────────────────────────

export function point(p: SpatialPoint, properties: Record<string, unknown> = {}): GeoFeature<GeoPoint> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.x, p.y] },
    properties,
  };
}

// ── Distance ──────────────────────────────────────────────────────────────

/** Euclidean distance between two logical-coordinate points. */
export function distance(a: SpatialPoint, b: SpatialPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Radius / circle ───────────────────────────────────────────────────────

/**
 * Approximate a circle as a polygon ring with `steps` vertices. Default 64
 * steps gives <1% radius error. Used for visual halos and ST_DWithin radius
 * overlays in the symbol-graph view.
 */
export function radiusCircle(
  center: SpatialPoint,
  radius: number,
  steps = 64,
): GeoFeature<GeoPolygon> {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    ring.push([center.x + radius * Math.cos(t), center.y + radius * Math.sin(t)]);
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: { _kind: 'radiusCircle', center_x: center.x, center_y: center.y, radius },
  };
}

/**
 * Buffer a point by `r` units → polygon halo. Identical to radiusCircle for a
 * point input; provided as a Turf-API-shaped alternative.
 */
export function symbolHalo(p: SpatialPoint, r: number, steps = 64): GeoFeature<GeoPolygon> {
  return radiusCircle(p, r, steps);
}

// ── Predicates ────────────────────────────────────────────────────────────

/** True iff `p` lies within `radius` of `center`. */
export function pointInCircle(p: SpatialPoint, center: SpatialPoint, radius: number): boolean {
  return distance(p, center) <= radius;
}

/** True iff bboxes overlap (closed-on-both-sides). */
export function bboxIntersects(a: BoundingBox, b: BoundingBox): boolean {
  return !(a.max_x < b.min_x || a.min_x > b.max_x || a.max_y < b.min_y || a.min_y > b.max_y);
}

/** True iff `inner` is fully contained in `outer` (closed). */
export function bboxContains(outer: BoundingBox, inner: BoundingBox): boolean {
  return (
    inner.min_x >= outer.min_x &&
    inner.max_x <= outer.max_x &&
    inner.min_y >= outer.min_y &&
    inner.max_y <= outer.max_y
  );
}

// ── Polygon intersection (simplified) ─────────────────────────────────────

/**
 * A halo for {@link haloIntersection} — discriminated input so callers
 * pass center+radius explicitly rather than rely on `properties` introspection
 * on a polygon feature (NIT-02 fix).
 */
export interface Halo {
  center: SpatialPoint;
  radius: number;
}

/**
 * Intersection of two circular halos as a polygon ring. Returns null if
 * disjoint, the smaller halo's polygon if one contains the other, or a
 * lens-shaped polygon when they overlap.
 *
 * Only supports circle-circle intersection (the only shape produced by
 * {@link radiusCircle} / {@link symbolHalo}). Arbitrary polygon overlay
 * is out of scope — for that, fall back to @turf/intersect or the
 * polygon-clipping ISC library.
 */
export function haloIntersection(
  a: Halo,
  b: Halo,
  steps = 64,
): GeoFeature<GeoPolygon> | null {
  const c1 = a.center, c2 = b.center;
  const ar = a.radius, br = b.radius;
  const d = distance(c1, c2);
  if (d >= ar + br) return null; // disjoint
  if (d + Math.min(ar, br) <= Math.max(ar, br)) {
    // one fully contains the other; intersection is the smaller circle
    const smaller = ar < br ? a : b;
    return radiusCircle(smaller.center, smaller.radius, steps);
  }

  // Lens: walk arc of c1 from intersection-angle-1 to intersection-angle-2,
  // then arc of c2 back. Standard formulas for two-circle intersection.
  const a1 = (d * d + ar * ar - br * br) / (2 * d * ar);
  const a2 = (d * d + br * br - ar * ar) / (2 * d * br);
  const theta1 = Math.acos(Math.min(1, Math.max(-1, a1)));
  const theta2 = Math.acos(Math.min(1, Math.max(-1, a2)));
  const phi = Math.atan2(c2.y - c1.y, c2.x - c1.x);

  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = phi - theta1 + (2 * theta1 * i) / steps;
    ring.push([c1.x + ar * Math.cos(t), c1.y + ar * Math.sin(t)]);
  }
  const phi2 = phi + Math.PI;
  for (let i = 0; i <= steps; i++) {
    const t = phi2 - theta2 + (2 * theta2 * i) / steps;
    ring.push([c2.x + br * Math.cos(t), c2.y + br * Math.sin(t)]);
  }
  ring.push(ring[0]!); // close ring

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: { _kind: 'haloIntersection' },
  };
}

// ── Convenience / collection builders ─────────────────────────────────────

export function featureCollection<G>(features: GeoFeature<G>[]): GeoFeatureCollection<G> {
  return { type: 'FeatureCollection', features };
}
