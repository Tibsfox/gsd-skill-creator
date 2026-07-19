/**
 * Many-Valued Logic concept -- truth beyond {T, F}.
 *
 * Formal logic: systems that reject bivalence and admit more than two
 * truth values. Kleene's and Lukasiewicz's three-valued logics add an
 * "undefined / indeterminate" value; Belnap's four-valued FDE tracks
 * true, false, both (contradiction) and neither (no information). A
 * designated subset of the values decides validity, generalising the
 * classical two-row truth table to 3, 4, or n rows.
 *
 * @module departments/logic/concepts/many-valued-logic
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*2pi/23, radius ~0.82
const theta = 5 * 2 * Math.PI / 23;
const radius = 0.82;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const manyValuedLogic: RosettaConcept = {
  id: 'logic-many-valued-logic',
  name: 'Many-Valued Logic',
  domain: 'logic',
  description: 'Many-valued (multi-valued) logics reject the classical assumption of ' +
    'bivalence -- that every proposition is exactly one of true or false -- and admit ' +
    'a larger set of truth values. Kleene\'s and Lukasiewicz\'s three-valued systems add ' +
    'a third value for the undefined or indeterminate; Priest\'s Logic of Paradox (LP) ' +
    'reuses those three values but designates the middle one, so contradictions can be ' +
    'tolerated without triviality. Belnap\'s four-valued First Degree Entailment (FDE) ' +
    'tracks both what a source asserts as true and what it asserts as false, yielding ' +
    'four states: true, false, both (contradictory), and neither (no information). A ' +
    'designated subset of the values plays the role classical logic gives to {true}: an ' +
    'argument is valid exactly when every valuation sending the premises to designated ' +
    'values also sends the conclusion there. The connectives are recomputed as operations ' +
    'on the enlarged value set -- typically lattice meet and join -- so the two-row truth ' +
    'table generalises to 3, 4, or n rows.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python encodes an n-valued logic as an IntEnum -- {F:0, U:1, T:2} for Kleene-3, plus Both and Neither for Belnap-4 -- and stores each connective as a numpy lookup array indexed by operand values, with AND = np.minimum and OR = np.maximum over the truth ordering. ' +
        'A comprehension decides validity against the designated set {T} (or {T, Both} for LP). ' +
        'See Priest 2008.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ fixes the value set at compile time: `enum class TV : uint8_t { False, Neither, Both, True }` for Belnap-4, and each binary connective becomes a `constexpr std::array<std::array<TV,4>,4>` lookup baked in with no evaluation-time branching. ' +
        'A designated bitmask (True and Both set) reduces validity to a single `&`; templating on N serves both Kleene-3 and FDE. ' +
        'See Priest 2008.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'Unison models the truth values as an immutable `type TV = F | Both | Neither | T` and each connective as a pure function whose content hash #abc123 is identical for anyone defining Belnap conjunction identically -- the lattice IS its hash. ' +
        'Validity is a pure fold over the designated set {T, Both}; an `ability` handler mediates I/O when streaming rows, keeping the core effect-free. ' +
        'See Priest 2008.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'log-truth-tables',
      description: 'Many-valued logic generalises the two-row truth table to 3, 4, or more truth values, recomputing each connective as a lattice operation over the enlarged value set',
    },
    {
      type: 'cross-reference',
      targetId: 'log-propositional-logic',
      description: 'It relaxes propositional logic\'s bivalence while keeping the connective and inference structure, adding truth values such as "both" and "neither"',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
