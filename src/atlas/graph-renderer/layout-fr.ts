/**
 * Fruchterman-Reingold force-directed layout (Fruchterman & Reingold 1991,
 * "Graph Drawing by Force-directed Placement", Software: Practice & Experience
 * 21(11), 1129-1164).
 *
 * Attractive force on connected nodes:  f_a(d) =  d² / k
 * Repulsive force on all node pairs:    f_r(d) = -k² / d
 * where k = C * sqrt(area / n) is the optimal edge length. Repulsion uses a
 * Barnes-Hut quadtree (see ./quadtree.ts) for O(n log n) per iteration; the
 * temperature cools linearly toward zero each tick, capping displacement.
 *
 * @module atlas/graph-renderer/layout-fr
 */

import { type Body, buildQuadtree } from './quadtree.js';

export interface LayoutNode {
  readonly id: number;
  x: number;
  y: number;
}

export interface LayoutEdge {
  readonly source: number;
  readonly target: number;
}

export interface FRLayoutConfig {
  /** Bounding box width  (world units). Default: derived from sqrt(n)·100. */
  width?: number;
  /** Bounding box height (world units). */
  height?: number;
  /** Iterations to run. Default 200; convergence is empirical, not certified. */
  iterations?: number;
  /** Barnes-Hut θ. Default 0.9 (faster, slightly looser than the 0.5 textbook value). */
  theta?: number;
  /** Optimal-edge-length constant: k = C * sqrt(area / n). Default 1.0. */
  C?: number;
  /** Initial temperature as fraction of width. Default 0.1. */
  t0Fraction?: number;
  /** RNG. Defaults to a deterministic seeded PRNG so layouts are reproducible. */
  rng?: () => number;
}

export interface FRLayoutResult {
  readonly nodes: readonly LayoutNode[];
  readonly iterations: number;
  /** Final temperature reached. */
  readonly finalTemp: number;
  /** Maximum displacement on the last tick — proxy for convergence. */
  readonly lastMaxDisp: number;
}

/**
 * Run iterations of FR layout. Mutates the input `nodes` array in place AND
 * returns it for convenience. Edges are read-only.
 */
export function runFRLayout(
  nodes: LayoutNode[],
  edges: readonly LayoutEdge[],
  config: FRLayoutConfig = {},
): FRLayoutResult {
  const n = nodes.length;
  if (n === 0) {
    return { nodes, iterations: 0, finalTemp: 0, lastMaxDisp: 0 };
  }

  const width = config.width ?? Math.sqrt(n) * 100;
  const height = config.height ?? width;
  const iterations = config.iterations ?? 200;
  const theta = config.theta ?? 0.9;
  const C = config.C ?? 1.0;
  const rng = config.rng ?? mulberry32(0xc0ffee);
  const area = width * height;
  const k = C * Math.sqrt(area / n);
  const k2 = k * k;

  // Seed any node still at the exact origin so the quadtree gets non-degenerate
  // bounds. Avoids identical-position singularities on first tick.
  for (const node of nodes) {
    if (node.x === 0 && node.y === 0) {
      node.x = (rng() - 0.5) * width;
      node.y = (rng() - 0.5) * height;
    }
  }

  let t = (config.t0Fraction ?? 0.1) * width;
  const cooling = t / iterations;

  const dispX = new Float64Array(n);
  const dispY = new Float64Array(n);
  // id → index lookup for edges.
  const idToIdx = new Map<number, number>();
  for (let i = 0; i < n; i++) idToIdx.set(nodes[i]!.id, i);

  let lastMaxDisp = 0;
  for (let iter = 0; iter < iterations; iter++) {
    dispX.fill(0);
    dispY.fill(0);

    // Repulsive: f_r = -k²/d, accumulated via Barnes-Hut.
    const bodies: Body[] = nodes.map((nd) => ({ id: nd.id, x: nd.x, y: nd.y, mass: 1 }));
    const tree = buildQuadtree(bodies, 1);
    for (let i = 0; i < n; i++) {
      const me = bodies[i]!;
      tree.forEachInteraction(me, theta, (bx, by, mass) => {
        let dx = me.x - bx;
        let dy = me.y - by;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1e-6) {
          // Coincident bodies: nudge with a tiny deterministic offset.
          dx = 1e-3;
          dy = 1e-3;
          d2 = 2e-6;
        }
        const d = Math.sqrt(d2);
        const force = (k2 * mass) / d;
        dispX[i]! += (dx / d) * force;
        dispY[i]! += (dy / d) * force;
      });
    }

    // Attractive: f_a = d²/k along each edge.
    for (const e of edges) {
      const si = idToIdx.get(e.source);
      const ti = idToIdx.get(e.target);
      if (si === undefined || ti === undefined || si === ti) continue;
      const a = nodes[si]!;
      const b = nodes[ti]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1e-6) continue;
      const d = Math.sqrt(d2);
      const force = d2 / k;
      const fx = (dx / d) * force;
      const fy = (dy / d) * force;
      dispX[si]! -= fx;
      dispY[si]! -= fy;
      dispX[ti]! += fx;
      dispY[ti]! += fy;
    }

    // Apply displacement, capped by current temperature.
    let maxDisp = 0;
    for (let i = 0; i < n; i++) {
      const dx = dispX[i]!;
      const dy = dispY[i]!;
      const dlen = Math.sqrt(dx * dx + dy * dy);
      if (dlen === 0) continue;
      const cap = Math.min(dlen, t);
      const ux = (dx / dlen) * cap;
      const uy = (dy / dlen) * cap;
      const node = nodes[i]!;
      node.x += ux;
      node.y += uy;
      // Frame-confine to bounding box (FR original constraint).
      node.x = clamp(node.x, -width / 2, width / 2);
      node.y = clamp(node.y, -height / 2, height / 2);
      if (cap > maxDisp) maxDisp = cap;
    }
    lastMaxDisp = maxDisp;
    t = Math.max(0, t - cooling);
  }

  return { nodes, iterations, finalTemp: t, lastMaxDisp };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Mulberry32 — small, fast, deterministic PRNG used for seedable layouts. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
