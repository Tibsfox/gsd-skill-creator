/**
 * Tonnetz — types.
 *
 * Tonnetz lattice for neo-Riemannian harmonic analysis per arXiv:2604.19960
 * (Boland 2026, `boland2026tonnetz`) and M6 §2 framework.
 *
 * The Tonnetz is a graph on the 24 major/minor triads of the 12-tone chromatic
 * scale, with edges given by the three parsimonious voice-leading transforms
 * P (Parallel), L (Leading-tone), R (Relative).
 *
 * @module tonnetz/types
 */

/** A note on the 12-tone chromatic scale. Integer in [0, 11]. 0=C, 1=C#, ..., 11=B. */
export type PitchClass = number;

/** Triad quality inferred from interval structure. */
export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'other';

/** A triadic chord: three pitch classes + inferred quality. */
export interface Triad {
  readonly notes: readonly [PitchClass, PitchClass, PitchClass];
  readonly quality: TriadQuality;
}

/**
 * An edge type in the Tonnetz relating two triads:
 *   - P = Parallel: major↔minor sharing root (swap third)
 *   - L = Leading-tone: major↔minor sharing upper third
 *   - R = Relative: major↔minor sharing lower third
 */
export type TonnetzTransform = 'P' | 'L' | 'R';

/**
 * Tonnetz lattice: indexed set of triads + transform edge map.
 *
 * `edges.get(i).get('P') === j` means transform P applied to triad `triads[i]`
 * yields triad `triads[j]`.
 */
export interface TonnetzLattice {
  readonly triads: readonly Triad[];
  readonly edges: ReadonlyMap<number, ReadonlyMap<TonnetzTransform, number>>;
}

/** Unit-circle point: θ ∈ [0, 2π). */
export interface UnitCirclePoint {
  readonly theta: number;
}

/** A species or musician entity with a unit-circle position. */
export interface SoPSEntity {
  readonly name: string;
  readonly kind: 'species' | 'musician';
  readonly position: UnitCirclePoint;
}

/**
 * Sound of Puget Sound mapping: 360 PNW species × 360 Seattle musicians both
 * projected onto the same unit circle. Each entity at θ = i * 2π / 360; the
 * i-th species and i-th musician share coordinate θ_i and therefore share a
 * Tonnetz chord derived from that θ.
 */
export interface SoPSMapping {
  readonly species: readonly SoPSEntity[]; // length 360
  readonly musicians: readonly SoPSEntity[]; // length 360
}

/** Result of a chord-triangle test. */
export interface ChordTriangle {
  /** True iff each adjacent pair of triads is related by some P/L/R transform. */
  readonly valid: boolean;
  /** True iff the composed transform sequence returns to the starting triad. */
  readonly cyclic: boolean;
}
