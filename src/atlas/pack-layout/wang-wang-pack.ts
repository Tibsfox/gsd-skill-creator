/**
 * Hierarchical circle packing (Wang, Wang, Dai, Wang 2006).
 *
 * Algorithm summary (per-parent):
 *   1. Sort children by descending radius.
 *   2. Place first three to be mutually tangent.
 *   3. Maintain a doubly-linked "front chain" of circles on the convex
 *      boundary of the placed pack. For each remaining child, place it
 *      tangent to the chain pair that yields no overlap; if a placement
 *      overlaps, advance/retreat the chain pointer (Wang-Wang's "front
 *      list" backtracking step).
 *   4. After all children placed, compute the smallest enclosing circle
 *      of the children, then translate so it is concentric with the
 *      parent disk and scale to match the parent radius.
 *
 * The traversal over the hierarchy is iterative (post-order via explicit
 * stack) so 10K+ node trees do not exhaust the recursion limit.
 *
 * @module atlas/pack-layout/wang-wang-pack
 */

import { mulberry32, smallestEnclosingCircle } from './enclosing-circle.js';
import type { CircleNode, HierNode, PackConfig } from './types.js';

const EPS = 1e-9;
const MIN_R = 1e-9;

interface PlacedCircle {
  x: number;
  y: number;
  r: number;
  idx: number; // back-reference to the child slot
  next: PlacedCircle;
  prev: PlacedCircle;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

/** True iff disks (ax,ay,ar) and (bx,by,br) overlap by more than EPS. */
function overlap(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
  return distance(ax, ay, bx, by) + EPS < ar + br;
}

/**
 * Place circle c externally tangent to a and b. The two solutions sit on
 * either side of line(a,b); we pick the one with greater y-component
 * relative to the centroid so successive placements walk the front chain
 * in a consistent rotational direction (matches the Wang-Wang front list
 * orientation).
 */
function placeTangent(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number,
  cr: number,
): { x: number; y: number } {
  const dab = distance(ax, ay, bx, by);
  if (dab < EPS) {
    // a and b coincident — place c offset along +x.
    return { x: ax + ar + cr, y: ay };
  }
  const dac = ar + cr;
  const dbc = br + cr;
  // Cosine rule: angle at a between (a→b) and (a→c).
  const cosA = (dab * dab + dac * dac - dbc * dbc) / (2 * dab * dac);
  const cosClamped = Math.max(-1, Math.min(1, cosA));
  const sinA = Math.sqrt(Math.max(0, 1 - cosClamped * cosClamped));
  const ux = (bx - ax) / dab;
  const uy = (by - ay) / dab;
  // Rotate u by +A by dac.
  const x = ax + dac * (ux * cosClamped - uy * sinA);
  const y = ay + dac * (uy * cosClamped + ux * sinA);
  return { x, y };
}

/**
 * Pack a single layer of children inside a disk centered at the origin,
 * with target radius `parentR`. Returns updated x/y/r on each child.
 */
function packLayer(children: CircleNode[], parentR: number, padding: number): void {
  const n = children.length;
  if (n === 0) return;
  // Pre-pad: enlarge each child so the gap between centers is r + r' + 2*pad.
  // We do this by adding padding/2 to every radius during placement and
  // strip it back after.
  const halfPad = padding / 2;
  if (n === 1) {
    const c = children[0];
    c.x = 0;
    c.y = 0;
    return;
  }
  // Sort descending by radius (stable index used as tiebreaker so
  // identical inputs produce identical outputs).
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    const dr = children[b].r - children[a].r;
    if (dr !== 0) return dr;
    return a - b;
  });
  const padded = order.map((i) => ({ idx: i, r: children[i].r + halfPad }));
  // Place first two on x-axis.
  const p0 = padded[0];
  const p1 = padded[1];
  const placedArr: PlacedCircle[] = new Array(n);
  const c0: PlacedCircle = {
    x: -p1.r, y: 0, r: p0.r, idx: p0.idx,
    next: null as unknown as PlacedCircle, prev: null as unknown as PlacedCircle,
  };
  const c1: PlacedCircle = {
    x: p0.r, y: 0, r: p1.r, idx: p1.idx,
    next: c0, prev: c0,
  };
  c0.next = c1;
  c0.prev = c1;
  placedArr[p0.idx] = c0;
  placedArr[p1.idx] = c1;
  // Translate the first two so their centroid is at origin.
  const cx0 = (c0.x * c0.r + c1.x * c1.r) / (c0.r + c1.r);
  c0.x -= cx0;
  c1.x -= cx0;
  if (n === 2) {
    writeBack(children, placedArr, halfPad);
    fitToParent(children, parentR);
    return;
  }
  // Place third tangent to first two.
  const p2 = padded[2];
  const t2 = placeTangent(c0.x, c0.y, c0.r, c1.x, c1.y, c1.r, p2.r);
  const c2: PlacedCircle = {
    x: t2.x, y: t2.y, r: p2.r, idx: p2.idx,
    next: c0, prev: c1,
  };
  c1.next = c2;
  c0.prev = c2;
  placedArr[p2.idx] = c2;
  // Front chain pointer "a" advances around the outer hull.
  let a: PlacedCircle = c1;
  let b: PlacedCircle = c2;
  for (let k = 3; k < n; k++) {
    const pk = padded[k];
    let placed = false;
    let guard = 0;
    const maxGuard = 4 * n + 16; // bounded backtracking budget
    while (!placed && guard++ < maxGuard) {
      const t = placeTangent(a.x, a.y, a.r, b.x, b.y, b.r, pk.r);
      // Check overlap with everyone in the front chain (start from a→b).
      let ov: PlacedCircle | null = null;
      // Walk forward from b until back to a, scanning for overlaps.
      let cur: PlacedCircle = b.next;
      let steps = 0;
      while (cur !== a && steps++ < n + 4) {
        if (overlap(t.x, t.y, pk.r, cur.x, cur.y, cur.r)) {
          ov = cur;
          break;
        }
        cur = cur.next;
      }
      if (!ov) {
        // Walk backward from a similarly.
        cur = a.prev;
        steps = 0;
        while (cur !== b && steps++ < n + 4) {
          if (overlap(t.x, t.y, pk.r, cur.x, cur.y, cur.r)) {
            ov = cur;
            break;
          }
          cur = cur.prev;
        }
      }
      if (!ov) {
        const cn: PlacedCircle = {
          x: t.x, y: t.y, r: pk.r, idx: pk.idx,
          next: b, prev: a,
        };
        a.next = cn;
        b.prev = cn;
        placedArr[pk.idx] = cn;
        // Slide front-chain pointer forward.
        a = cn;
        placed = true;
      } else {
        // Wang-Wang front-chain repair: drop the side of the chain whose
        // pointer is "shorter" along the hull; advance toward ov.
        // Using a simple heuristic: alternately advance a backward and b
        // forward; if we've cycled, give up and force-place.
        if (guard % 2 === 0) {
          a = a.prev;
        } else {
          b = b.next;
        }
        // Detect dead chain (a == b means we've collapsed).
        if (a === b) break;
      }
    }
    if (!placed) {
      // Force-place at the outside of the current bounding circle. This is
      // a robustness escape — Wang-Wang's paper acknowledges pathological
      // inputs (e.g., one radius dominating all others) can require this.
      let cx = 0, cy = 0, totW = 0;
      let cur: PlacedCircle = c0;
      const start = cur;
      do {
        cx += cur.x * cur.r;
        cy += cur.y * cur.r;
        totW += cur.r;
        cur = cur.next;
      } while (cur !== start);
      cx /= totW || 1;
      cy /= totW || 1;
      // Compute an outside placement on the +x axis from centroid.
      let maxDist = 0;
      cur = start;
      do {
        const d = distance(cx, cy, cur.x, cur.y) + cur.r;
        if (d > maxDist) maxDist = d;
        cur = cur.next;
      } while (cur !== start);
      const cn: PlacedCircle = {
        x: cx + maxDist + pk.r,
        y: cy,
        r: pk.r,
        idx: pk.idx,
        next: a.next,
        prev: a,
      };
      a.next.prev = cn;
      a.next = cn;
      placedArr[pk.idx] = cn;
      a = cn;
    }
  }
  writeBack(children, placedArr, halfPad);
  fitToParent(children, parentR);
}

function writeBack(children: CircleNode[], placed: PlacedCircle[], halfPad: number): void {
  for (let i = 0; i < children.length; i++) {
    const p = placed[i];
    if (!p) continue;
    children[i].x = p.x;
    children[i].y = p.y;
    // Strip the padding we added during placement.
    children[i].r = Math.max(MIN_R, p.r - halfPad);
  }
}

/** Translate + uniformly scale children so they fit exactly inside a disk
 *  of radius `parentR` centered at (0,0). The parent disk itself is not
 *  modified — caller writes the parent center/radius. */
function fitToParent(children: CircleNode[], parentR: number): void {
  if (children.length === 0 || parentR <= 0) return;
  // Compute smallest enclosing disk of children-as-disks.
  const enc = smallestEnclosingCircle(
    children.map((c) => ({ x: c.x, y: c.y, r: c.r })),
  );
  const scale = enc.r > EPS ? parentR / enc.r : 1;
  for (const c of children) {
    c.x = (c.x - enc.x) * scale;
    c.y = (c.y - enc.y) * scale;
    c.r = Math.max(MIN_R, c.r * scale);
  }
}

/**
 * Compute the value sum and assign initial radii (sqrt of value, since
 * radius is what matters visually for area = π r²) iteratively via a
 * post-order traversal driven by an explicit stack.
 */
function buildHierarchy<T>(root: HierNode<T>): CircleNode<T> {
  const out: CircleNode<T> = {
    id: root.id,
    data: root.data,
    x: 0,
    y: 0,
    r: 0,
    value: 0,
    depth: 0,
  };
  // Iterative post-order: stack of (input, output, parent_output, child_index).
  type Frame = {
    input: HierNode<T>;
    output: CircleNode<T>;
    parent: CircleNode<T> | null;
    childIdx: number;
  };
  const stack: Frame[] = [{ input: root, output: out, parent: null, childIdx: 0 }];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const kids = frame.input.children;
    if (kids && frame.childIdx < kids.length) {
      const kIn = kids[frame.childIdx++];
      const kOut: CircleNode<T> = {
        id: kIn.id,
        data: kIn.data,
        x: 0,
        y: 0,
        r: 0,
        value: 0,
        depth: frame.output.depth + 1,
      };
      if (!frame.output.children) frame.output.children = [];
      frame.output.children.push(kOut);
      stack.push({ input: kIn, output: kOut, parent: frame.output, childIdx: 0 });
    } else {
      // Post-visit: finalize value + initial radius.
      const node = frame.output;
      if (node.children && node.children.length > 0) {
        let sum = 0;
        for (const c of node.children) sum += c.value;
        node.value = Math.max(sum, frame.input.value ?? 0);
      } else {
        node.value = Math.max(0, frame.input.value ?? 0);
      }
      // Radius proportional to sqrt(value) so packed area is proportional
      // to value (the standard convention for treemap-style packing).
      node.r = Math.sqrt(node.value);
      if (node.r < MIN_R) node.r = MIN_R;
      stack.pop();
    }
  }
  return out;
}

/**
 * Pack each level iteratively (BFS from root). Each parent's children are
 * laid out inside the parent disk; then the parent's own radius is fixed
 * at whatever the sum of children's enclosing disk demands (relative to
 * its sibling-time radius).
 */
export function wangWangPack<T = unknown>(
  root: HierNode<T>,
  config: PackConfig = {},
): CircleNode<T> {
  const size = config.size ?? 1;
  const padding = config.padding ?? 0;
  const built = buildHierarchy(root);
  // Establish root radius first; children are then sized relative to it.
  const queue: CircleNode<T>[] = [built];
  built.x = 0;
  built.y = 0;
  built.r = size;
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node.children && node.children.length > 0) {
      packLayer(node.children, node.r, padding);
      // Translate children to absolute coords (parent center).
      for (const c of node.children) {
        c.x += node.x;
        c.y += node.y;
        queue.push(c);
      }
    }
  }
  return built;
}

// Re-export deterministic RNG for callers that want one.
export { mulberry32 };
