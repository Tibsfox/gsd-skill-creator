/**
 * Quadtree-based pointer hit testing.
 *
 * For interaction with up to ~3K nodes a flat O(n) scan is competitive with a
 * tree walk, but we share the same quadtree as the layout repulsion pass so
 * hit-test is amortized free during pan/zoom. Hit radius is in world units.
 *
 * @module atlas/graph-renderer/hittest
 */

import { type Body, buildQuadtree, type Quadtree } from './quadtree.js';

export interface HitNode {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface HitTestIndex {
  readonly tree: Quadtree;
  readonly nodes: readonly HitNode[];
}

export function buildHitTestIndex(nodes: readonly HitNode[]): HitTestIndex {
  const bodies: Body[] = nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, mass: 1 }));
  const tree = buildQuadtree(bodies, 1);
  return { tree, nodes };
}

/**
 * Return the topmost hit node, or null. "Topmost" here is the node nearest to
 * the pointer (smallest distance). Caller passes pointer in world coordinates.
 */
export function hitTest(index: HitTestIndex, px: number, py: number): HitNode | null {
  let best: HitNode | null = null;
  let bestDistSq = Infinity;
  for (const n of index.nodes) {
    const dx = n.x - px;
    const dy = n.y - py;
    const d2 = dx * dx + dy * dy;
    if (d2 <= n.radius * n.radius && d2 < bestDistSq) {
      best = n;
      bestDistSq = d2;
    }
  }
  return best;
}

/** Return all nodes inside a world-space rectangle (e.g. for box-select). */
export function hitTestRect(
  index: HitTestIndex,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): HitNode[] {
  const out: HitNode[] = [];
  for (const n of index.nodes) {
    if (n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY) out.push(n);
  }
  return out;
}
