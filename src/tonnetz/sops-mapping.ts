/**
 * Tonnetz — Sound of Puget Sound unit-circle mapping.
 *
 * Implements the M6 §4 sec:sops-mission recommendation: project a 360-element
 * PNW species catalogue and a 360-element Seattle musicians catalogue onto the
 * same unit circle (1° per entity). The i-th species and i-th musician share
 * coordinate θ_i = i * 2π / 360, and therefore share a Tonnetz triad derived
 * from that θ.
 *
 * The θ → pitch-class map is `floor(θ * 12 / (2π)) mod 12`, producing 30°
 * wedges per pitch class. The shared chord at a given θ is the major triad
 * rooted at that pitch class, drawn from the supplied {@link TonnetzLattice}.
 *
 * No persistence; no I/O. Pure functions.
 *
 * @module tonnetz/sops-mapping
 */

import type {
  SoPSEntity,
  SoPSMapping,
  TonnetzLattice,
  Triad,
  UnitCirclePoint,
} from './types.js';
import { majorTriad, triadIndex } from './lattice.js';

/** Length contract for a SoPS catalogue side. Hard-coded per M6 §4. */
export const SOPS_CATALOGUE_SIZE = 360;

/** Angle step between adjacent entities on the unit circle (radians). */
export const SOPS_THETA_STEP = (2 * Math.PI) / SOPS_CATALOGUE_SIZE;

/** Small tolerance (radians) for θ equality between species + musician positions. */
export const SOPS_THETA_EPSILON = 1e-9;

/**
 * Place 360 named entities on the unit circle at θ_i = i * 2π / 360. Throws on
 * any length other than 360 to enforce the SoPS catalogue contract.
 */
export function placeOnUnitCircle(
  names: readonly string[],
  kind: 'species' | 'musician',
): readonly SoPSEntity[] {
  if (names.length !== SOPS_CATALOGUE_SIZE) {
    throw new Error(
      `placeOnUnitCircle: expected exactly ${SOPS_CATALOGUE_SIZE} names for ${kind}, got ${names.length}`,
    );
  }
  const out: SoPSEntity[] = [];
  for (let i = 0; i < SOPS_CATALOGUE_SIZE; i++) {
    const theta = i * SOPS_THETA_STEP;
    const position: UnitCirclePoint = { theta };
    out.push({ name: names[i], kind, position });
  }
  return out;
}

/**
 * Build a 360-species × 360-musicians SoPS mapping from two name arrays. Both
 * arrays must be length 360.
 */
export function buildSoPSMapping(
  speciesNames: readonly string[],
  musicianNames: readonly string[],
): SoPSMapping {
  return {
    species: placeOnUnitCircle(speciesNames, 'species'),
    musicians: placeOnUnitCircle(musicianNames, 'musician'),
  };
}

/** Map a θ ∈ [0, 2π) to one of the 12 pitch classes via 30° wedges. */
export function thetaToPitchClass(theta: number): number {
  const two_pi = 2 * Math.PI;
  const normalized = ((theta % two_pi) + two_pi) % two_pi;
  return Math.floor((normalized * 12) / two_pi) % 12;
}

/**
 * Return the shared Tonnetz chord for a (species, musician) pair sitting at
 * (approximately) the same θ. Returns `null` if the two θ values disagree by
 * more than {@link SOPS_THETA_EPSILON}, or if the derived major triad is not
 * present in the supplied lattice.
 */
export function sharedChord(
  speciesPosition: UnitCirclePoint,
  musicianPosition: UnitCirclePoint,
  lattice: TonnetzLattice,
): Triad | null {
  if (Math.abs(speciesPosition.theta - musicianPosition.theta) > SOPS_THETA_EPSILON) {
    return null;
  }
  const pc = thetaToPitchClass(speciesPosition.theta);
  const candidate = majorTriad(pc);
  const idx = triadIndex(lattice, candidate);
  if (idx < 0) return null;
  return lattice.triads[idx];
}
