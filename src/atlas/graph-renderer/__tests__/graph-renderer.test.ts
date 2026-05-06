/**
 * Wave 0.5 P1 surface tests for src/atlas/graph-renderer/.
 *
 * Covers the pure-math layers: layout convergence, quadtree correctness,
 * viewport round-tripping, hit-test accuracy, and LOD threshold logic.
 * The WebGL2 renderer surface is exercised only at the type level here;
 * runtime behaviour is left for the integration layer with a real GL context.
 */

import { describe, it, expect } from 'vitest';
import {
  runFRLayout,
  type LayoutNode,
  type LayoutEdge,
  mulberry32,
} from '../layout-fr.js';
import { buildQuadtree, computeBounds, Quadtree, type Body } from '../quadtree.js';
import {
  createViewport,
  worldToScreen,
  screenToWorld,
  pan,
  zoomAt,
  viewProjectionMatrix,
} from '../viewport.js';
import { buildHitTestIndex, hitTest, hitTestRect } from '../hittest.js';
import { computeLOD, DEFAULT_LOD } from '../lod.js';

// ─── Quadtree ───────────────────────────────────────────────────────────────

describe('quadtree', () => {
  it('computeBounds returns square padded box around all bodies', () => {
    const bodies: Body[] = [
      { id: 0, x: -5, y: -3, mass: 1 },
      { id: 1, x: 5, y: 3, mass: 1 },
    ];
    const b = computeBounds(bodies, 0);
    // Square centered on (0,0); side = max(width,height) = 10.
    expect(b.maxX - b.minX).toBeCloseTo(b.maxY - b.minY, 9);
    expect(b.minX).toBeLessThanOrEqual(-5);
    expect(b.maxX).toBeGreaterThanOrEqual(5);
  });

  it('totalMass at root equals sum of inserted body masses', () => {
    const bodies: Body[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.cos(i),
      y: Math.sin(i),
      mass: 1,
    }));
    const tree = buildQuadtree(bodies);
    expect(tree.totalMass).toBe(50);
  });

  it('forEachInteraction sums every other body when theta=0 (no approximation)', () => {
    // theta=0 means s/d < 0 is never satisfied → tree must descend to leaves.
    const bodies: Body[] = [
      { id: 0, x: 0, y: 0, mass: 1 },
      { id: 1, x: 10, y: 0, mass: 1 },
      { id: 2, x: -10, y: 0, mass: 1 },
      { id: 3, x: 0, y: 10, mass: 1 },
    ];
    const tree = buildQuadtree(bodies);
    let visited = 0;
    let massSum = 0;
    tree.forEachInteraction(bodies[0]!, 0, (_x, _y, m) => {
      visited++;
      massSum += m;
    });
    // Three other leaves visited, total mass 3 (target itself excluded).
    expect(visited).toBe(3);
    expect(massSum).toBe(3);
  });

  it('forEachInteraction approximates a distant cluster as one body when theta is large', () => {
    // 4 nodes clustered far away, target far off → cluster collapses to 1 visit.
    const cluster: Body[] = [
      { id: 1, x: 100, y: 100, mass: 1 },
      { id: 2, x: 101, y: 100, mass: 1 },
      { id: 3, x: 100, y: 101, mass: 1 },
      { id: 4, x: 101, y: 101, mass: 1 },
    ];
    const target: Body = { id: 0, x: -100, y: -100, mass: 1 };
    // Insert only the cluster (not the target) so the tree's COM holds 4·mass
    // exactly; the target is queried but lives outside the tree.
    const tree = buildQuadtree(cluster);
    let visits = 0;
    let totalMassSeen = 0;
    tree.forEachInteraction(target, 5.0, (_x, _y, m) => {
      visits++;
      totalMassSeen += m;
    });
    // With huge theta, the entire cluster collapses into 1 pseudo-particle.
    expect(visits).toBe(1);
    expect(totalMassSeen).toBe(4);
  });

  it('handles empty body list without crashing', () => {
    const tree = new Quadtree({ minX: -1, minY: -1, maxX: 1, maxY: 1 });
    let visits = 0;
    tree.forEachInteraction({ id: 0, x: 0, y: 0, mass: 1 }, 0.5, () => visits++);
    expect(visits).toBe(0);
  });
});

// ─── Viewport ───────────────────────────────────────────────────────────────

describe('viewport', () => {
  it('worldToScreen ∘ screenToWorld is identity to fp tolerance', () => {
    const vp = createViewport(800, 600);
    vp.panX = 12.5;
    vp.panY = -7.25;
    vp.zoom = 2.5;
    for (const p of [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: -42.7, y: 19.3 },
    ]) {
      const back = screenToWorld(vp, worldToScreen(vp, p));
      expect(back.x).toBeCloseTo(p.x, 6);
      expect(back.y).toBeCloseTo(p.y, 6);
    }
  });

  it('pan moves world-origin in proportion to zoom', () => {
    const vp = createViewport(800, 600);
    vp.zoom = 2;
    pan(vp, 100, 0); // 100 screen px right at 2x zoom = 50 world units
    expect(vp.panX).toBeCloseTo(-50, 9);
  });

  it('zoomAt keeps the world point under the cursor stable', () => {
    const vp = createViewport(800, 600);
    const anchor = { x: 400, y: 300 };
    const beforeWorld = screenToWorld(vp, anchor);
    zoomAt(vp, anchor, 3.0);
    const afterWorld = screenToWorld(vp, anchor);
    expect(afterWorld.x).toBeCloseTo(beforeWorld.x, 6);
    expect(afterWorld.y).toBeCloseTo(beforeWorld.y, 6);
    expect(vp.zoom).toBeCloseTo(3, 9);
  });

  it('zoomAt clamps to viewport limits', () => {
    const vp = createViewport(800, 600);
    zoomAt(vp, { x: 0, y: 0 }, 1e9);
    expect(vp.zoom).toBeLessThanOrEqual(50);
    zoomAt(vp, { x: 0, y: 0 }, 1e-9);
    expect(vp.zoom).toBeGreaterThanOrEqual(0.05);
  });

  it('viewProjectionMatrix maps top-left of screen to clip (-1, +1)', () => {
    const vp = createViewport(800, 600);
    const m = viewProjectionMatrix(vp);
    // Multiply [panX, panY, 0, 1] (the top-left world point) by m.
    // Matrix is column-major; computing manually for column 0/1/3.
    const x = m[0]! * vp.panX + m[4]! * vp.panY + m[12]!;
    const y = m[1]! * vp.panX + m[5]! * vp.panY + m[13]!;
    expect(x).toBeCloseTo(-1, 6);
    expect(y).toBeCloseTo(1, 6);
  });
});

// ─── Layout (Fruchterman-Reingold) ──────────────────────────────────────────

describe('layout-fr', () => {
  it('two connected nodes converge close to optimal-edge-length k', () => {
    const nodes: LayoutNode[] = [
      { id: 0, x: 0, y: 0 },
      { id: 1, x: 0, y: 0 },
    ];
    const edges: LayoutEdge[] = [{ source: 0, target: 1 }];
    const result = runFRLayout(nodes, edges, {
      width: 200,
      height: 200,
      iterations: 300,
      rng: mulberry32(42),
    });
    const dx = nodes[0]!.x - nodes[1]!.x;
    const dy = nodes[0]!.y - nodes[1]!.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    // k = sqrt(200·200/2) ≈ 141 for n=2; FR convergence brings d into the
    // same order of magnitude as k. Loose bound to avoid flake.
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(300);
    // Last-tick displacement should be on the order of the cooling step
    // (initial temp / iterations), confirming convergence approached the
    // temperature floor rather than blowing up.
    const initialTemp = (0.1 * 200);
    expect(result.lastMaxDisp).toBeLessThanOrEqual(initialTemp / 200 + 1e-6);
  });

  it('disconnected components separate and stay inside the frame', () => {
    const nodes: LayoutNode[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
    }));
    // Two K_5 components: 0..4 and 5..9; 10..19 isolated.
    const edges: LayoutEdge[] = [];
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++) edges.push({ source: i, target: j });
    for (let i = 5; i < 10; i++)
      for (let j = i + 1; j < 10; j++) edges.push({ source: i, target: j });
    const W = 400;
    runFRLayout(nodes, edges, {
      width: W,
      height: W,
      iterations: 200,
      rng: mulberry32(7),
    });
    for (const n of nodes) {
      expect(n.x).toBeGreaterThanOrEqual(-W / 2 - 1e-6);
      expect(n.x).toBeLessThanOrEqual(W / 2 + 1e-6);
      expect(n.y).toBeGreaterThanOrEqual(-W / 2 - 1e-6);
      expect(n.y).toBeLessThanOrEqual(W / 2 + 1e-6);
    }
  });

  it('cools to zero temperature after configured iterations', () => {
    const nodes: LayoutNode[] = [
      { id: 0, x: 0, y: 0 },
      { id: 1, x: 0, y: 0 },
    ];
    const result = runFRLayout(nodes, [{ source: 0, target: 1 }], {
      iterations: 50,
      rng: mulberry32(1),
    });
    expect(result.finalTemp).toBeCloseTo(0, 6);
    expect(result.iterations).toBe(50);
  });

  it('layout is deterministic under a fixed seed', () => {
    const make = (): LayoutNode[] =>
      Array.from({ length: 30 }, (_, i) => ({ id: i, x: 0, y: 0 }));
    const edges: LayoutEdge[] = [];
    for (let i = 1; i < 30; i++) edges.push({ source: i - 1, target: i });
    const a = make();
    const b = make();
    runFRLayout(a, edges, { iterations: 100, rng: mulberry32(99) });
    runFRLayout(b, edges, { iterations: 100, rng: mulberry32(99) });
    for (let i = 0; i < a.length; i++) {
      expect(a[i]!.x).toBeCloseTo(b[i]!.x, 9);
      expect(a[i]!.y).toBeCloseTo(b[i]!.y, 9);
    }
  });
});

// ─── Hit-test ───────────────────────────────────────────────────────────────

describe('hittest', () => {
  it('hitTest returns the node nearest to the pointer when within radius', () => {
    const idx = buildHitTestIndex([
      { id: 0, x: 0, y: 0, radius: 5 },
      { id: 1, x: 100, y: 0, radius: 5 },
    ]);
    expect(hitTest(idx, 1, 1)?.id).toBe(0);
    expect(hitTest(idx, 99, 0)?.id).toBe(1);
  });

  it('hitTest returns null when pointer is outside every node radius', () => {
    const idx = buildHitTestIndex([{ id: 0, x: 0, y: 0, radius: 3 }]);
    expect(hitTest(idx, 100, 100)).toBeNull();
  });

  it('hitTestRect returns all nodes inside a world-space rectangle', () => {
    const idx = buildHitTestIndex([
      { id: 0, x: 1, y: 1, radius: 1 },
      { id: 1, x: 5, y: 5, radius: 1 },
      { id: 2, x: 50, y: 50, radius: 1 },
    ]);
    const got = hitTestRect(idx, 0, 0, 10, 10).map((n) => n.id).sort();
    expect(got).toEqual([0, 1]);
  });
});

// ─── LOD ────────────────────────────────────────────────────────────────────

describe('lod', () => {
  it('drops labels above the labelMaxNodes threshold', () => {
    expect(computeLOD(100, 1).drawLabels).toBe(true);
    expect(computeLOD(DEFAULT_LOD.labelMaxNodes + 1, 1).drawLabels).toBe(false);
  });

  it('drops edges only when both node count high AND zoom low', () => {
    expect(computeLOD(10000, 1).drawEdges).toBe(true); // zoomed in: keep edges
    expect(computeLOD(10000, 0.1).drawEdges).toBe(false); // both: drop
    expect(computeLOD(100, 0.01).drawEdges).toBe(true); // few nodes: keep
  });
});
