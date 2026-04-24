/**
 * Tonnetz Lattice concept — pitch lattice with cyclic automorphism on S¹ × S¹ torus.
 *
 * Complex Analysis / Unit-Circle wing.
 * The Tonnetz is a classical lattice of pitches arranged so that neighbours
 * are related by simple consonant intervals (major third, perfect fifth,
 * minor third). Under a cyclic automorphism quotient the lattice lifts to
 * the torus S¹ × S¹; a fundamental domain tessellates the torus and each
 * domain corresponds to one equivalence class of chords. The April 2026
 * cluster paper (arXiv:2604.19253) works out the combinatorial geometry of
 * the tessellation in the form needed for the Sound of Puget Sound 360 × 360
 * mapping (360 PNW species on one S¹, 360 Seattle musicians on the other).
 * Phase 752 (strictly-optional MAY DEFER) ships the Tonnetz substrate for
 * the SPS mission — unlike Half B substrate phases, this one targets a
 * mission rather than a system primitive, so deferral is permitted without
 * endangering the CAPCOM preservation gates.
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/mathematics/concepts/tonnetz-lattice
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~11*2pi/29, radius ~0.90 (complex-analytic / musical-geometry ring)
const theta = 11 * 2 * Math.PI / 29;
const radius = 0.90;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const tonnetzLattice: RosettaConcept = {
  id: 'mathematics-tonnetz-lattice',
  name: 'Tonnetz Lattice',
  domain: 'mathematics',
  description: 'The Tonnetz lattice arranges pitches so that neighbouring lattice ' +
    'nodes are related by simple consonant intervals (major third, perfect fifth, ' +
    'minor third). Under a cyclic automorphism quotient the lattice lifts to the ' +
    'torus S¹ × S¹, and a fundamental domain tessellates the torus. Each domain ' +
    'corresponds to one equivalence class of chords; rotations of the domain ' +
    'correspond to mode shifts (major to minor, diatonic to pentatonic). For ' +
    'gsd-skill-creator, the Tonnetz supplies the combinatorial geometry for the ' +
    'Sound of Puget Sound mission: 360 PNW species on one S¹, 360 Seattle ' +
    'musicians on the other, and "consonance" of a pairing is defined as polygon ' +
    'containment in the fundamental domain. The April 2026 cluster paper ' +
    '(arXiv:2604.19253) develops the tessellation formally, including the ' +
    'chord-polygon vertex structure and the cyclic-automorphism action. Phase 752 ' +
    '(strictly-optional) implements the lattice for the SPS mission.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A small numpy array models the lattice as integer triples (m3, M3, P5) modulo 12. The torus S¹ × S¹ is realised as a 2D numpy array indexed by (species_angle, musician_angle). The polygon-containment check is a matplotlib.path.Path.contains_point call against the fundamental domain. See arXiv:2604.19253.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'The SPS mission exposes a TonnetzPair type with { species: SpeciesId, musician: MusicianId, consonance: boolean } and a decide(pair): boolean predicate implemented as a polygon-in-polygon test on the torus fundamental domain. The test runs client-side in the SPS browser visualisation. See arXiv:2604.19253.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-euler-formula',
      description: 'The Tonnetz lifts via Euler\'s formula: pitches map to complex exponentials on S¹, and the cyclic automorphism is multiplication by a primitive twelfth root of unity',
    },
    {
      type: 'cross-reference',
      targetId: 'mathematics-complex-numbers',
      description: 'The torus S¹ × S¹ is the natural home for paired complex-plane coordinates; the Tonnetz lattice is the discrete subgroup that tessellates it',
    },
    {
      type: 'dependency',
      targetId: 'mathematics-trig-functions',
      description: 'Interval computations on the Tonnetz use trigonometric identities; the Geometry wing\'s trig-functions concept is a prerequisite',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
