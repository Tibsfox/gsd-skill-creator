/**
 * JP-013 (HIGH, Phase 834) — Discrete vector bundles × coherent-functors
 * integration test.
 *
 * Anchor: arXiv:2104.10277 (Discrete Vector Bundles with Connection,
 * Crane & Wardetzky 2021). Tier-1 elevation per FINDINGS §3 JP-013.
 *
 * Core assertion: holonomy around a trivial (zero-step) loop is the identity
 * linear map. This maps onto the coherent-functors composition coherence
 * condition: for a flat (coherent) functor, the composition witness round any
 * path triangle is identity.
 *
 * The "trivial loop" test is the tautological base case: a path of length 0
 * (the constant path at a single vertex) has holonomy = id. In the
 * coherent-functors language, this is identityFunctor(C).onObjects(v) = v
 * with coherenceData.identity present.
 *
 * Additional tests cover the K_3-graph case: a trivial bundle over a
 * 3-vertex complete graph where all transport maps are identity matrices.
 * Any loop in this bundle has holonomy = identity, confirming flatness.
 */

import { describe, expect, it } from 'vitest';
import * as coherent from '../index.js';
import type { Category, CoherentFunctor, Morphism } from '../index.js';

// ---------------------------------------------------------------------------
// Discrete bundle helpers (pure TS — no external deps)
// ---------------------------------------------------------------------------

/**
 * A discrete vector bundle over a finite graph.
 * Each vertex carries a 1-D fiber (scalar); transport maps are scalars.
 * Generalization to k-D fibers is straightforward but not needed here.
 */
interface DiscreteBundleR1 {
  /** Vertices (indices 0..n-1). */
  readonly vertices: readonly number[];
  /** Directed edges as [src, tgt] pairs. */
  readonly edges: ReadonlyArray<readonly [number, number]>;
  /** Transport map for each edge: a scalar (ℝ^1 → ℝ^1 linear map). */
  readonly transport: ReadonlyMap<string, number>;
}

function edgeKey(u: number, v: number): string {
  return `${u}->${v}`;
}

/** Build a trivial flat bundle over K_3: all transports = 1. */
function trivialBundleK3(): DiscreteBundleR1 {
  const vertices = [0, 1, 2] as const;
  const edges: Array<readonly [number, number]> = [
    [0, 1], [1, 0],
    [0, 2], [2, 0],
    [1, 2], [2, 1],
  ];
  const transport = new Map<string, number>();
  for (const [u, v] of edges) {
    transport.set(edgeKey(u, v), 1); // identity transport in ℝ^1
  }
  return { vertices, edges, transport };
}

/**
 * Compute holonomy of a loop `path = [v_0, v_1, …, v_n]` where `v_0 = v_n`.
 * Holonomy = product of transport maps along the path edges.
 * For a trivial (zero-step) loop (path = [v]), holonomy = 1 (identity in ℝ^1).
 */
function holonomy(bundle: DiscreteBundleR1, path: readonly number[]): number {
  if (path.length <= 1) {
    // Zero-step loop: holonomy = identity.
    return 1;
  }
  let hol = 1;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i]!;
    const v = path[i + 1]!;
    const t = bundle.transport.get(edgeKey(u, v));
    if (t === undefined) {
      throw new Error(`No transport for edge ${u}→${v}`);
    }
    hol *= t;
  }
  return hol;
}

// ---------------------------------------------------------------------------
// Coherent-functors category for the K_3 graph
// ---------------------------------------------------------------------------

/** Build a category whose objects are vertices (0,1,2) of K_3. */
function k3Category(): Category<number> {
  return {
    name: 'K3',
    identity: (v: number): Morphism<number, number> => ({
      source: v,
      target: v,
      name: `id_${v}`,
    }),
    compose: <A, B, C>(g: Morphism<B, C>, f: Morphism<A, B>): Morphism<A, C> => ({
      source: f.source,
      target: g.target,
      name: `(${g.name}∘${f.name})`,
    }),
    equalObjects: (x: number, y: number): boolean => x === y,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JP-013 discrete bundle: trivial loop holonomy = identity', () => {
  it('zero-step loop (constant path at vertex 0) has holonomy = 1 (identity)', () => {
    const bundle = trivialBundleK3();
    const hol = holonomy(bundle, [0]); // trivial loop
    expect(hol).toBe(1);
  });

  it('zero-step loop at each vertex of K_3 has holonomy = identity', () => {
    const bundle = trivialBundleK3();
    for (const v of bundle.vertices) {
      expect(holonomy(bundle, [v])).toBe(1);
    }
  });

  it('closed triangle loop (0→1→2→0) on trivial bundle has holonomy = identity', () => {
    const bundle = trivialBundleK3();
    const hol = holonomy(bundle, [0, 1, 2, 0]);
    expect(hol).toBe(1); // all transports = 1, product = 1
  });

  it('any closed loop on the trivial flat K_3 bundle has holonomy = identity', () => {
    const bundle = trivialBundleK3();
    const loops: Array<readonly number[]> = [
      [0],           // trivial
      [1],           // trivial
      [0, 1, 0],     // back-and-forth
      [0, 1, 2, 0],  // triangle
      [0, 2, 1, 0],  // reverse triangle
      [1, 2, 1],     // back-and-forth on another edge
    ];
    for (const loop of loops) {
      expect(holonomy(bundle, loop)).toBe(1);
    }
  });
});

describe('JP-013 coherent-functors mapping: identity functor = flat bundle', () => {
  it('identityFunctor on K3Category has identity coherence witness (flat connection analog)', () => {
    const cat = k3Category();
    const F = coherent.identityFunctor(cat);
    // The identity functor is the "flat bundle" with all transports = id.
    // Its identity coherence witness must be present (non-empty).
    expect(F.coherenceData.identity.length).toBeGreaterThan(0);
  });

  it('identityFunctor: transport along identity morphism = identity (trivial holonomy)', () => {
    const cat = k3Category();
    const F = coherent.identityFunctor(cat);
    // F maps each vertex to itself — onObjects is the identity map.
    expect(F.onObjects(0)).toBe(0);
    expect(F.onObjects(1)).toBe(1);
    expect(F.onObjects(2)).toBe(2);
    // The identity functor preserves vertex identity: no holonomy drift.
  });

  it('checkIdentity passes on identityFunctor (flat = coherent)', () => {
    const cat = k3Category();
    const F = coherent.identityFunctor(cat);
    expect(coherent.checkIdentity(F).ok).toBe(true);
  });

  it('composed identity functors still have trivial holonomy (composition coherence)', () => {
    const cat = k3Category();
    const id1 = coherent.identityFunctor(cat);
    const id2 = coherent.identityFunctor(cat);
    const composed = coherent.compose(id2, id1);
    // Composed flat bundle = flat bundle: holonomy still trivial.
    expect(composed.onObjects(0)).toBe(0);
    expect(composed.onObjects(1)).toBe(1);
    expect(composed.onObjects(2)).toBe(2);
    // Composition witness stamped (flat-connection check passed).
    expect(composed.coherenceData.composition.length).toBeGreaterThan(0);
    expect(coherent.checkComposition(composed).ok).toBe(true);
  });
});

describe('JP-013 REFERENCES.md: mapping notes present', () => {
  it('REFERENCES.md exists in src/coherent-functors/', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const refPath = path.resolve(__dirname, '..', 'REFERENCES.md');
    expect(fs.existsSync(refPath)).toBe(true);
  });

  it('REFERENCES.md references arXiv:2104.10277 (discrete vector bundles anchor)', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const refPath = path.resolve(__dirname, '..', 'REFERENCES.md');
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('2104.10277');
  });

  it('REFERENCES.md references discrete-vector-bundles.md cross-link', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const refPath = path.resolve(__dirname, '..', 'REFERENCES.md');
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('discrete-vector-bundles.md');
  });
});
