/**
 * Smallest enclosing circle (Welzl 1991).
 *
 * Move-to-front incremental algorithm with O(n) expected time on a random
 * permutation. Iterative outer loop; the inner "boundary" specializations
 * are recursion-free 2- and 3-point closed-form solutions, so no stack
 * frame grows with n.
 *
 * Supports point-as-disk inputs: when a point has `r > 0`, the enclosing
 * disk contains every input disk (Apollonius-style "smallest disk
 * containing disks"). For weighted hierarchical packing this lets us
 * compute the parent radius from packed children directly.
 *
 * @module atlas/pack-layout/enclosing-circle
 */

import type { Disk, Point } from './types.js';

const EPS = 1e-10;

/** Mulberry32 — tiny deterministic PRNG; only used to shuffle inputs. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pointR(p: Point): number {
  return p.r && p.r > 0 ? p.r : 0;
}

function disksEqual(a: Disk, b: Disk): boolean {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS && Math.abs(a.r - b.r) < EPS;
}

/** True iff `p` (with its own radius) lies inside `d`. */
function contains(d: Disk, p: Point): boolean {
  const dx = p.x - d.x;
  const dy = p.y - d.y;
  const dist = Math.sqrt(dx * dx + dy * dy) + pointR(p);
  return dist <= d.r + EPS;
}

/** Smallest disk through one boundary disk: itself, expanded to its radius. */
function fromOne(p: Point): Disk {
  return { x: p.x, y: p.y, r: Math.max(pointR(p), 0) };
}

/**
 * Smallest disk containing two disks (or two points if r=0). The enclosing
 * disk is centered on the line between them; the boundary touches each
 * input disk on the far side.
 */
function fromTwo(a: Point, b: Point): Disk {
  const ra = pointR(a);
  const rb = pointR(b);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  // One disk fully contains the other.
  if (d + rb <= ra + EPS) return fromOne(a);
  if (d + ra <= rb + EPS) return fromOne(b);
  const r = (d + ra + rb) / 2;
  // Center is offset from a toward b by (r - ra) along the unit vector.
  const t = d === 0 ? 0 : (r - ra) / d;
  return { x: a.x + dx * t, y: a.y + dy * t, r };
}

/**
 * Smallest disk through three points (radius=0 case). For disk inputs we
 * still use the classical 3-point construction on the disk centers — the
 * caller (Welzl with r>0 inputs) should fall back to fromTwo when this
 * yields a disk that fails to contain a non-zero-radius input. We handle
 * that by post-checking and using a trilateration solve when needed.
 */
function fromThreePoints(a: Point, b: Point, c: Point): Disk | null {
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const cx = c.x;
  const cy = c.y;
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < EPS) return null; // colinear
  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    D;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    D;
  const r = Math.sqrt((ax - ux) * (ax - ux) + (ay - uy) * (ay - uy));
  return { x: ux, y: uy, r };
}

/**
 * Smallest disk through three boundary disks (Apollonius). For our usage
 * the disk inputs are externally tangent (Wang-Wang places children
 * touching each other), so a fixed-point Newton iteration on the radius
 * converges quickly. We keep the fast 3-point solver for the all-zero-
 * radius case and only solve Apollonius when at least one r>0.
 */
function fromThree(a: Point, b: Point, c: Point): Disk {
  const ra = pointR(a);
  const rb = pointR(b);
  const rc = pointR(c);
  if (ra === 0 && rb === 0 && rc === 0) {
    const d = fromThreePoints(a, b, c);
    if (d) return d;
    // Colinear: fall through to pairwise.
  }
  // Apollonius via search on r: candidate center is the point equidistant
  // (with offset r_i) from each input, parameterized by the enclosing r.
  // Closed-form via two linear equations:
  //   (x - a.x)^2 + (y - a.y)^2 = (r - ra)^2
  //   (x - b.x)^2 + (y - b.y)^2 = (r - rb)^2
  //   (x - c.x)^2 + (y - c.y)^2 = (r - rc)^2
  // Subtracting eq1 from eq2 and eq1 from eq3 gives two linear equations
  // in (x, y, r). One additional substitution into eq1 gives a quadratic
  // in r; we take the larger positive root that contains all three.
  const A1 = 2 * (b.x - a.x);
  const B1 = 2 * (b.y - a.y);
  const C1 = 2 * (rb - ra);
  const D1 = a.x * a.x - b.x * b.x + a.y * a.y - b.y * b.y - ra * ra + rb * rb;
  const A2 = 2 * (c.x - a.x);
  const B2 = 2 * (c.y - a.y);
  const C2 = 2 * (rc - ra);
  const D2 = a.x * a.x - c.x * c.x + a.y * a.y - c.y * c.y - ra * ra + rc * rc;
  const det = A1 * B2 - A2 * B1;
  if (Math.abs(det) < EPS) {
    // Centers colinear: fall back to best pair.
    const candidates = [fromTwo(a, b), fromTwo(a, c), fromTwo(b, c)];
    let best = candidates[0];
    for (const cand of candidates) {
      if (contains(cand, a) && contains(cand, b) && contains(cand, c) && cand.r < best.r) {
        best = cand;
      }
    }
    return best;
  }
  // x = px + qx * r;  y = py + qy * r
  const px = (B2 * D1 - B1 * D2) / det;
  const qx = (B1 * C2 - B2 * C1) / det;
  const py = (A1 * D2 - A2 * D1) / det;
  const qy = (A2 * C1 - A1 * C2) / det;
  // Substitute into eq1: (px + qx*r - a.x)^2 + (py + qy*r - a.y)^2 = (r - ra)^2
  const ex = px - a.x;
  const ey = py - a.y;
  const QA = qx * qx + qy * qy - 1;
  const QB = 2 * (ex * qx + ey * qy + ra);
  const QC = ex * ex + ey * ey - ra * ra;
  let r: number;
  if (Math.abs(QA) < EPS) {
    r = -QC / QB;
  } else {
    const disc = QB * QB - 4 * QA * QC;
    if (disc < 0) {
      // Numerically infeasible — fall back to pairwise best.
      const candidates = [fromTwo(a, b), fromTwo(a, c), fromTwo(b, c)];
      let best = candidates[0];
      for (const cand of candidates) {
        if (contains(cand, a) && contains(cand, b) && contains(cand, c) && cand.r < best.r) {
          best = cand;
        }
      }
      return best;
    }
    const root = Math.sqrt(disc);
    const r1 = (-QB + root) / (2 * QA);
    const r2 = (-QB - root) / (2 * QA);
    r = Math.max(r1, r2);
  }
  return { x: px + qx * r, y: py + qy * r, r };
}

/**
 * Smallest enclosing circle via Welzl's move-to-front algorithm.
 *
 * Iterative form (Megiddo 1983 framing of Welzl): for each point not yet
 * inside the candidate disk, rebuild the disk constraining that point to
 * the boundary, and so on for two- and three-boundary cases. Worst case
 * O(n^3) on an adversarial ordering; expected O(n) on a random shuffle.
 */
export function smallestEnclosingCircle(points: ReadonlyArray<Point>, random: () => number = mulberry32(0x9e3779b1)): Disk {
  if (points.length === 0) return { x: 0, y: 0, r: 0 };
  if (points.length === 1) return fromOne(points[0]);
  // Fisher-Yates shuffle on a copy.
  const pts: Point[] = points.slice();
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = pts[i];
    pts[i] = pts[j];
    pts[j] = tmp;
  }
  let d: Disk = fromOne(pts[0]);
  for (let i = 1; i < pts.length; i++) {
    if (!contains(d, pts[i])) {
      d = welzlOneBoundary(pts, i, pts[i]);
    }
  }
  return d;
}

function welzlOneBoundary(pts: ReadonlyArray<Point>, n: number, p: Point): Disk {
  let d: Disk = fromOne(p);
  for (let i = 0; i < n; i++) {
    if (!contains(d, pts[i])) {
      d = welzlTwoBoundary(pts, i, p, pts[i]);
    }
  }
  return d;
}

function welzlTwoBoundary(pts: ReadonlyArray<Point>, n: number, p: Point, q: Point): Disk {
  let d: Disk = fromTwo(p, q);
  for (let i = 0; i < n; i++) {
    if (!contains(d, pts[i])) {
      d = fromThree(p, q, pts[i]);
      // Sanity: if numeric drift makes a tangent point fall slightly
      // outside, re-expand to cover it. Cheap because n_drift is small.
      if (!contains(d, pts[i])) {
        const dx = pts[i].x - d.x;
        const dy = pts[i].y - d.y;
        d = { x: d.x, y: d.y, r: Math.sqrt(dx * dx + dy * dy) + pointR(pts[i]) };
      }
    }
  }
  return d;
}

// Internal helpers exported for tests.
export const _internal = { fromOne, fromTwo, fromThree, contains, disksEqual };
