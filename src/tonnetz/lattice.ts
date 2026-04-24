/**
 * Tonnetz — lattice construction + neo-Riemannian transforms.
 *
 * Canonical P/L/R transforms per arXiv:2604.19960 §2 and the standard
 * Cohn / Hyer neo-Riemannian tradition:
 *
 *   For a major triad M = {r, r+4, r+7}:
 *     P(M)  = {r,     r+3,  r+7}    // minor, same root (swap third)
 *     R(M)  = {r+9,   r,    r+4}    // minor, relative (root +9, down a m3)
 *     L(M)  = {r+4,   r+7,  r+11}   // minor, leading-tone exchange (root +4)
 *
 *   For a minor triad m = {r, r+3, r+7}:
 *     P(m)  = {r,     r+4,  r+7}    // major, same root
 *     R(m)  = {r+3,   r+7,  r+10}   // major, relative (root -9 ≡ +3)
 *     L(m)  = {r-4,   r,    r+3} ≡ {r+8, r, r+3}  // major (root -4 ≡ +8)
 *
 * Each transform is an involution: `applyTransform(applyTransform(t, op), op)` ≡ `t`.
 *
 * @module tonnetz/lattice
 */

import type {
  PitchClass,
  Triad,
  TriadQuality,
  TonnetzLattice,
  TonnetzTransform,
} from './types.js';

/** Canonical mod-12 pitch-class normalization. */
export function normalizePC(pc: number): PitchClass {
  return ((pc % 12) + 12) % 12;
}

/** Infer triad quality from a sorted set of interval gaps from the lowest-pitch-class note. */
export function inferQuality(notes: readonly [PitchClass, PitchClass, PitchClass]): TriadQuality {
  // Sort the three pitch classes and compute successive gaps (cyclically).
  const sorted = [notes[0], notes[1], notes[2]]
    .map((n) => normalizePC(n))
    .sort((a, b) => a - b) as [number, number, number];
  const gaps: readonly [number, number, number] = [
    sorted[1] - sorted[0],
    sorted[2] - sorted[1],
    12 - sorted[2] + sorted[0],
  ];
  // A triad's quality is determined by the multiset of gaps; check all rotations.
  const matches = (a: readonly number[], target: readonly [number, number, number]): boolean => {
    for (let s = 0; s < 3; s++) {
      if (a[s] === target[0] && a[(s + 1) % 3] === target[1] && a[(s + 2) % 3] === target[2]) {
        return true;
      }
    }
    return false;
  };
  if (matches(gaps, [4, 3, 5])) return 'major';
  if (matches(gaps, [3, 4, 5])) return 'minor';
  if (matches(gaps, [3, 3, 6])) return 'diminished';
  if (matches(gaps, [4, 4, 4])) return 'augmented';
  return 'other';
}

/**
 * Build a triad from three pitch classes. Normalizes pitch classes mod 12 and
 * infers quality from interval structure.
 */
export function makeTriad(notes: readonly [number, number, number]): Triad {
  const norm: readonly [PitchClass, PitchClass, PitchClass] = [
    normalizePC(notes[0]),
    normalizePC(notes[1]),
    normalizePC(notes[2]),
  ];
  return { notes: norm, quality: inferQuality(norm) };
}

/** Build a major triad rooted at `root`. Stored as `[root, root+4, root+7]`. */
export function majorTriad(root: PitchClass): Triad {
  const r = normalizePC(root);
  return {
    notes: [r, normalizePC(r + 4), normalizePC(r + 7)],
    quality: 'major',
  };
}

/** Build a minor triad rooted at `root`. Stored as `[root, root+3, root+7]`. */
export function minorTriad(root: PitchClass): Triad {
  const r = normalizePC(root);
  return {
    notes: [r, normalizePC(r + 3), normalizePC(r + 7)],
    quality: 'minor',
  };
}

/**
 * Apply a neo-Riemannian transform (P, L, or R) to a triad. Returns a new
 * triad with opposite quality (major ↔ minor). Non-major/minor input falls
 * through to an identity return (transforms are only defined for
 * consonant triads in the standard neo-Riemannian framework).
 */
export function applyTransform(t: Triad, op: TonnetzTransform): Triad {
  if (t.quality !== 'major' && t.quality !== 'minor') return t;
  const r = t.notes[0]; // root by storage convention
  if (t.quality === 'major') {
    // r, r+4, r+7
    if (op === 'P') return minorTriad(r);
    if (op === 'R') return minorTriad(normalizePC(r + 9));
    // L
    return minorTriad(normalizePC(r + 4));
  }
  // minor: r, r+3, r+7
  if (op === 'P') return majorTriad(r);
  if (op === 'R') return majorTriad(normalizePC(r + 3));
  // L
  return majorTriad(normalizePC(r + 8));
}

/**
 * Build the standard 24-triad neo-Riemannian Tonnetz: 12 major + 12 minor
 * triads with edges for P, L, R transforms.
 *
 * Triads are indexed: 0..11 are major (root 0..11), 12..23 are minor (root 0..11).
 */
export function buildStandardTonnetz(): TonnetzLattice {
  const triads: Triad[] = [];
  for (let r = 0; r < 12; r++) triads.push(majorTriad(r));
  for (let r = 0; r < 12; r++) triads.push(minorTriad(r));

  const indexOf = (tri: Triad): number => {
    const r = tri.notes[0];
    if (tri.quality === 'major') return r;
    if (tri.quality === 'minor') return 12 + r;
    return -1;
  };

  const edges = new Map<number, Map<TonnetzTransform, number>>();
  for (let i = 0; i < triads.length; i++) {
    const inner = new Map<TonnetzTransform, number>();
    const transforms: readonly TonnetzTransform[] = ['P', 'L', 'R'];
    for (const op of transforms) {
      const out = applyTransform(triads[i], op);
      const j = indexOf(out);
      if (j >= 0) inner.set(op, j);
    }
    edges.set(i, inner);
  }

  return { triads, edges };
}

/** Return the lattice index of a triad, or -1 if not present. */
export function triadIndex(lattice: TonnetzLattice, tri: Triad): number {
  for (let i = 0; i < lattice.triads.length; i++) {
    const t = lattice.triads[i];
    if (
      t.quality === tri.quality &&
      t.notes[0] === tri.notes[0] &&
      t.notes[1] === tri.notes[1] &&
      t.notes[2] === tri.notes[2]
    ) {
      return i;
    }
  }
  return -1;
}
