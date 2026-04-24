/**
 * Tonnetz — combinatorial-geometry operations on the 24-triad lattice.
 *
 * Per arXiv:2604.19960 §2-§3 and M6 framework. All operations are pure
 * read-only queries over a {@link TonnetzLattice}.
 *
 * @module tonnetz/combinatorial-geometry
 */

import type { ChordTriangle, Triad, TonnetzLattice, TonnetzTransform } from './types.js';
import { triadIndex } from './lattice.js';

function transformBetween(
  lattice: TonnetzLattice,
  aIdx: number,
  bIdx: number,
): TonnetzTransform | null {
  const inner = lattice.edges.get(aIdx);
  if (!inner) return null;
  for (const [op, j] of inner) {
    if (j === bIdx) return op;
  }
  return null;
}

/**
 * Test whether three triads form a triangle in the Tonnetz: each adjacent pair
 * is related by some P/L/R transform. Cyclic = the three transforms compose
 * back to the starting triad.
 */
export function chordTriangle(
  lattice: TonnetzLattice,
  a: Triad,
  b: Triad,
  c: Triad,
): ChordTriangle {
  const ia = triadIndex(lattice, a);
  const ib = triadIndex(lattice, b);
  const ic = triadIndex(lattice, c);
  if (ia < 0 || ib < 0 || ic < 0) return { valid: false, cyclic: false };

  const ab = transformBetween(lattice, ia, ib);
  const bc = transformBetween(lattice, ib, ic);
  const ca = transformBetween(lattice, ic, ia);
  const valid = ab !== null && bc !== null && ca !== null;
  // Cyclic means a->b->c->a closes; since each `transformBetween` returns the
  // transform relating the pair, validity here is sufficient for closure in an
  // involution-based graph (each edge is bidirectional).
  const cyclic = valid;
  return { valid, cyclic };
}

/**
 * Breadth-first shortest-path distance between two triads, counted in P/L/R
 * hops. Returns `Infinity` if `dst` is unreachable from `src` (should not
 * happen for the connected 24-triad neo-Riemannian Tonnetz).
 */
export function tonnetzDistance(lattice: TonnetzLattice, src: Triad, dst: Triad): number {
  const srcIdx = triadIndex(lattice, src);
  const dstIdx = triadIndex(lattice, dst);
  if (srcIdx < 0 || dstIdx < 0) return Infinity;
  if (srcIdx === dstIdx) return 0;

  const visited = new Set<number>([srcIdx]);
  let frontier: number[] = [srcIdx];
  let depth = 0;
  while (frontier.length > 0) {
    depth += 1;
    const next: number[] = [];
    for (const i of frontier) {
      const inner = lattice.edges.get(i);
      if (!inner) continue;
      for (const j of inner.values()) {
        if (j === dstIdx) return depth;
        if (!visited.has(j)) {
          visited.add(j);
          next.push(j);
        }
      }
    }
    frontier = next;
  }
  return Infinity;
}

/**
 * Return a fundamental domain: one canonical representative per equivalence
 * class under transposition. For the standard 24-triad Tonnetz, this reduces
 * to one major + one minor triad (2 total), since every triad of a given
 * quality is reachable from the root-0 variant via transposition.
 *
 * Implementation: pick the lowest-root major triad (root=0, i.e., C-major)
 * and the lowest-root minor triad (root=0, i.e., C-minor).
 */
export function fundamentalDomain(lattice: TonnetzLattice): readonly Triad[] {
  const seenQualities = new Set<string>();
  const out: Triad[] = [];
  for (const t of lattice.triads) {
    if (t.quality !== 'major' && t.quality !== 'minor') continue;
    if (seenQualities.has(t.quality)) continue;
    seenQualities.add(t.quality);
    out.push(t);
    if (seenQualities.size === 2) break;
  }
  return out;
}
