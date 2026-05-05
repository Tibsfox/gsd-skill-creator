import { describe, it, expect } from 'vitest';
import { wangWangPack } from '../wang-wang-pack.js';
import type { CircleNode, HierNode } from '../types.js';

const EPS = 1e-3; // pack uses scale-to-fit; tolerate small drift

function* walk<T>(n: CircleNode<T>): Generator<CircleNode<T>> {
  yield n;
  if (n.children) for (const c of n.children) yield* walk(c);
}

function siblingsDontOverlap(parent: CircleNode<unknown>): boolean {
  if (!parent.children) return true;
  const ks = parent.children;
  for (let i = 0; i < ks.length; i++) {
    for (let j = i + 1; j < ks.length; j++) {
      const dx = ks[i].x - ks[j].x;
      const dy = ks[i].y - ks[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist + EPS < ks[i].r + ks[j].r) return false;
    }
  }
  return true;
}

function childrenInsideParent(parent: CircleNode<unknown>): boolean {
  if (!parent.children) return true;
  for (const c of parent.children) {
    const dist = Math.hypot(c.x - parent.x, c.y - parent.y);
    if (dist + c.r > parent.r + EPS) return false;
  }
  return true;
}

describe('wangWangPack', () => {
  it('packs a single leaf at the origin with the requested size', () => {
    const tree: HierNode = { id: 'root', value: 16 };
    const out = wangWangPack(tree, { size: 5 });
    expect(out.x).toBeCloseTo(0, 6);
    expect(out.y).toBeCloseTo(0, 6);
    expect(out.r).toBeCloseTo(5, 6);
  });

  it('packs three equal children without overlap', () => {
    const tree: HierNode = {
      id: 'root',
      children: [
        { id: 'a', value: 1 },
        { id: 'b', value: 1 },
        { id: 'c', value: 1 },
      ],
    };
    const out = wangWangPack(tree, { size: 10 });
    expect(out.children?.length).toBe(3);
    expect(siblingsDontOverlap(out)).toBe(true);
    expect(childrenInsideParent(out)).toBe(true);
  });

  it('produces deterministic output across runs', () => {
    const tree: HierNode = {
      id: 'root',
      children: Array.from({ length: 8 }, (_, i) => ({ id: 'c' + i, value: i + 1 })),
    };
    const a = wangWangPack(tree, { size: 100 });
    const b = wangWangPack(tree, { size: 100 });
    const aFlat = [...walk(a)].map((n) => `${n.id}:${n.x.toFixed(6)}:${n.y.toFixed(6)}:${n.r.toFixed(6)}`);
    const bFlat = [...walk(b)].map((n) => `${n.id}:${n.x.toFixed(6)}:${n.y.toFixed(6)}:${n.r.toFixed(6)}`);
    expect(aFlat).toEqual(bFlat);
  });

  it('handles 2-deep hierarchy with no overlaps at any level', () => {
    const tree: HierNode = {
      id: 'root',
      children: [
        { id: 'a', children: [{ id: 'a1', value: 1 }, { id: 'a2', value: 2 }] },
        { id: 'b', children: [{ id: 'b1', value: 3 }, { id: 'b2', value: 1 }, { id: 'b3', value: 1 }] },
      ],
    };
    const out = wangWangPack(tree, { size: 50 });
    expect(siblingsDontOverlap(out)).toBe(true);
    for (const n of walk(out)) {
      expect(siblingsDontOverlap(n)).toBe(true);
      expect(childrenInsideParent(n)).toBe(true);
    }
  });

  it('handles deeply nested chain without recursion overflow (1000 deep)', () => {
    let leaf: HierNode = { id: 'leaf', value: 1 };
    for (let i = 999; i >= 0; i--) {
      leaf = { id: 'n' + i, children: [leaf] };
    }
    const out = wangWangPack(leaf, { size: 1 });
    let depth = 0;
    let cur: CircleNode<unknown> = out;
    while (cur.children && cur.children.length > 0) {
      cur = cur.children[0];
      depth++;
    }
    expect(depth).toBe(1000);
  });

  it('aggregates value sums up the tree', () => {
    const tree: HierNode = {
      id: 'root',
      children: [
        { id: 'a', value: 5 },
        { id: 'b', children: [{ id: 'b1', value: 3 }, { id: 'b2', value: 4 }] },
      ],
    };
    const out = wangWangPack(tree);
    expect(out.value).toBe(12);
    expect(out.children![0].value).toBe(5);
    expect(out.children![1].value).toBe(7);
  });

  it('respects padding (sibling separation increases)', () => {
    const tree: HierNode = {
      id: 'root',
      children: [{ id: 'a', value: 1 }, { id: 'b', value: 1 }],
    };
    const out0 = wangWangPack(tree, { size: 10, padding: 0 });
    const outP = wangWangPack(tree, { size: 10, padding: 0.5 });
    // With padding, child radii (after fit) should be smaller.
    expect(outP.children![0].r).toBeLessThan(out0.children![0].r);
  });
});
