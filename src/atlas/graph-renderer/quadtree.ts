/**
 * Barnes-Hut quadtree for O(n log n) repulsive force approximation.
 *
 * Reference: Barnes & Hut 1986, "A hierarchical O(N log N) force-calculation
 * algorithm" (Nature 324, 446-449). Each internal node stores a center-of-mass
 * pseudo-particle; when a cluster's width-to-distance ratio s/d is below the
 * Barnes-Hut θ (default 0.5), the cluster is treated as a single body.
 *
 * @module atlas/graph-renderer/quadtree
 */

export interface Body {
  readonly id: number;
  x: number;
  y: number;
  /** Mass; for unit-mass nodes (the FR layout default) this is 1. */
  mass: number;
}

export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

interface QuadNode {
  bounds: Bounds;
  /** Center-of-mass x, weighted by total mass below. */
  comX: number;
  comY: number;
  totalMass: number;
  /** Leaf body if exactly one body sits in this cell; else null. */
  body: Body | null;
  /** Children: NW, NE, SW, SE. Null on leaves. */
  children: [QuadNode, QuadNode, QuadNode, QuadNode] | null;
}

export class Quadtree {
  private root: QuadNode;

  constructor(bounds: Bounds) {
    this.root = makeNode(bounds);
  }

  insert(body: Body): void {
    insertInto(this.root, body);
  }

  /**
   * Apply a callback for each effective body (real leaf or center-of-mass
   * pseudo-particle) seen from the perspective of `target` under the
   * Barnes-Hut criterion s/d < theta.
   */
  forEachInteraction(
    target: Body,
    theta: number,
    visit: (bodyX: number, bodyY: number, mass: number) => void,
  ): void {
    walk(this.root, target, theta, visit);
  }

  /** Total mass at the root (sum of all inserted bodies). Useful for tests. */
  get totalMass(): number {
    return this.root.totalMass;
  }
}

export function buildQuadtree(bodies: readonly Body[], pad = 1): Quadtree {
  const b = computeBounds(bodies, pad);
  const tree = new Quadtree(b);
  for (const body of bodies) tree.insert(body);
  return tree;
}

export function computeBounds(bodies: readonly Body[], pad = 1): Bounds {
  if (bodies.length === 0) {
    return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of bodies) {
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x > maxX) maxX = b.x;
    if (b.y > maxY) maxY = b.y;
  }
  // Square the bounds and pad — Barnes-Hut s/d ratio assumes square cells.
  const w = maxX - minX;
  const h = maxY - minY;
  const side = Math.max(w, h, 1e-6);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = side / 2 + pad;
  return { minX: cx - half, minY: cy - half, maxX: cx + half, maxY: cy + half };
}

function makeNode(bounds: Bounds): QuadNode {
  return { bounds, comX: 0, comY: 0, totalMass: 0, body: null, children: null };
}

function insertInto(node: QuadNode, body: Body): void {
  // Update running center-of-mass before recursing so internal nodes always
  // hold a valid pseudo-particle.
  const newMass = node.totalMass + body.mass;
  node.comX = (node.comX * node.totalMass + body.x * body.mass) / newMass;
  node.comY = (node.comY * node.totalMass + body.y * body.mass) / newMass;
  node.totalMass = newMass;

  if (node.children === null && node.body === null) {
    node.body = body;
    return;
  }

  if (node.children === null && node.body !== null) {
    // Was a leaf with one body; subdivide and re-insert the existing body.
    const existing = node.body;
    node.body = null;
    subdivide(node);
    placeIntoChild(node, existing);
  }

  placeIntoChild(node, body);
}

function subdivide(node: QuadNode): void {
  const { minX, minY, maxX, maxY } = node.bounds;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  node.children = [
    makeNode({ minX, minY, maxX: midX, maxY: midY }), // NW
    makeNode({ minX: midX, minY, maxX, maxY: midY }), // NE
    makeNode({ minX, minY: midY, maxX: midX, maxY }), // SW
    makeNode({ minX: midX, minY: midY, maxX, maxY }), // SE
  ];
}

function placeIntoChild(node: QuadNode, body: Body): void {
  if (node.children === null) return;
  const { minX, minY, maxX, maxY } = node.bounds;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const east = body.x >= midX;
  const south = body.y >= midY;
  const idx = south ? (east ? 3 : 2) : east ? 1 : 0;
  insertInto(node.children[idx], body);
}

function walk(
  node: QuadNode,
  target: Body,
  theta: number,
  visit: (bodyX: number, bodyY: number, mass: number) => void,
): void {
  if (node.totalMass === 0) return;

  if (node.children === null) {
    if (node.body !== null && node.body.id !== target.id) {
      visit(node.body.x, node.body.y, node.body.mass);
    }
    return;
  }

  const dx = node.comX - target.x;
  const dy = node.comY - target.y;
  const distSq = dx * dx + dy * dy;
  const s = node.bounds.maxX - node.bounds.minX;
  // Barnes-Hut criterion: if s/d < theta, treat cluster as a single body.
  if (s * s < theta * theta * distSq) {
    visit(node.comX, node.comY, node.totalMass);
    return;
  }
  for (const c of node.children) walk(c, target, theta, visit);
}
