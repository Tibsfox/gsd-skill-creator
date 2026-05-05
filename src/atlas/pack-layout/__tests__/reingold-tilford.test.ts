import { describe, it, expect } from 'vitest';
import { reingoldTilford } from '../reingold-tilford.js';
import type { HierNode, TreeNode } from '../types.js';

function* walk<T>(n: TreeNode<T>): Generator<TreeNode<T>> {
  yield n;
  if (n.children) for (const c of n.children) yield* walk(c);
}

describe('reingoldTilford', () => {
  it('lays out a single node at (0,0)', () => {
    const out = reingoldTilford({ id: 'root' });
    expect(out.x).toBeCloseTo(0, 9);
    expect(out.y).toBe(0);
    expect(out.depth).toBe(0);
  });

  it('places siblings at the configured spacing', () => {
    const out = reingoldTilford(
      {
        id: 'r',
        children: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      },
      { siblingSpacing: 2 },
    );
    const xs = out.children!.map((c) => c.x);
    expect(xs[1] - xs[0]).toBeCloseTo(2, 6);
    expect(xs[2] - xs[1]).toBeCloseTo(2, 6);
  });

  it('centers parent over its children', () => {
    const out = reingoldTilford({
      id: 'r',
      children: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    });
    const xs = out.children!.map((c) => c.x);
    const mid = (xs[0] + xs[2]) / 2;
    expect(out.x).toBeCloseTo(mid, 6);
  });

  it('y coordinate is depth × levelHeight', () => {
    const out = reingoldTilford(
      {
        id: 'r',
        children: [{ id: 'a', children: [{ id: 'a1' }] }],
      },
      { levelHeight: 3 },
    );
    expect(out.y).toBe(0);
    expect(out.children![0].y).toBe(3);
    expect(out.children![0].children![0].y).toBe(6);
  });

  it('x coordinates are unique within each depth (R-T tidy invariant)', () => {
    const tree: HierNode = {
      id: 'r',
      children: [
        { id: 'a', children: [{ id: 'a1' }, { id: 'a2', children: [{ id: 'a2a' }] }] },
        { id: 'b', children: [{ id: 'b1', children: [{ id: 'b1a' }, { id: 'b1b' }] }, { id: 'b2' }] },
        { id: 'c', children: [{ id: 'c1' }] },
      ],
    };
    const out = reingoldTilford(tree);
    const byDepth = new Map<number, number[]>();
    for (const n of walk(out)) {
      const xs = byDepth.get(n.depth) ?? [];
      xs.push(n.x);
      byDepth.set(n.depth, xs);
    }
    for (const [, xs] of byDepth) {
      const sorted = xs.slice().sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThan(1e-6);
      }
    }
  });

  it('left subtree never overlaps right subtree at any depth', () => {
    const out = reingoldTilford({
      id: 'r',
      children: [
        { id: 'L', children: [{ id: 'L1' }, { id: 'L2', children: [{ id: 'L2a' }, { id: 'L2b' }] }] },
        { id: 'R', children: [{ id: 'R1', children: [{ id: 'R1a' }] }, { id: 'R2' }] },
      ],
    });
    // Collect (x, depth) for each subtree separately.
    const lX: Map<number, [number, number]> = new Map(); // depth -> [min, max]
    const rX: Map<number, [number, number]> = new Map();
    for (const n of walk(out.children![0])) {
      const e = lX.get(n.depth);
      lX.set(n.depth, e ? [Math.min(e[0], n.x), Math.max(e[1], n.x)] : [n.x, n.x]);
    }
    for (const n of walk(out.children![1])) {
      const e = rX.get(n.depth);
      rX.set(n.depth, e ? [Math.min(e[0], n.x), Math.max(e[1], n.x)] : [n.x, n.x]);
    }
    for (const [d, [, lMax]] of lX) {
      const r = rX.get(d);
      if (r) expect(r[0]).toBeGreaterThan(lMax);
    }
  });

  it('handles deep path-shaped tree without stack overflow', () => {
    let leaf: HierNode = { id: 'leaf' };
    for (let i = 4999; i >= 0; i--) {
      leaf = { id: 'n' + i, children: [leaf] };
    }
    const out = reingoldTilford(leaf);
    let depth = 0;
    let cur: TreeNode<unknown> = out;
    while (cur.children && cur.children.length > 0) {
      cur = cur.children[0];
      depth++;
    }
    expect(depth).toBe(5000);
    // Path-shaped: every node has the same x (after normalization, x = 0).
    expect(cur.x).toBeCloseTo(0, 6);
  });

  it('produces deterministic output across runs', () => {
    const tree: HierNode = {
      id: 'r',
      children: [
        { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
        { id: 'b', children: [{ id: 'b1' }] },
      ],
    };
    const a = reingoldTilford(tree);
    const b = reingoldTilford(tree);
    const aFlat = [...walk(a)].map((n) => `${n.id}:${n.x}:${n.y}`);
    const bFlat = [...walk(b)].map((n) => `${n.id}:${n.x}:${n.y}`);
    expect(aFlat).toEqual(bFlat);
  });

  it('leftmost x is normalized to 0', () => {
    const out = reingoldTilford({
      id: 'r',
      children: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    });
    let minX = Number.POSITIVE_INFINITY;
    for (const n of walk(out)) if (n.x < minX) minX = n.x;
    expect(minX).toBeCloseTo(0, 9);
  });
});
