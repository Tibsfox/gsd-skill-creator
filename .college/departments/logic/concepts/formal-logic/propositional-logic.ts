import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const propositionalLogic: RosettaConcept = {
  id: 'log-propositional-logic',
  name: 'Propositional Logic',
  domain: 'logic',
  description: 'Propositional logic (sentential logic) is a formal system for reasoning about propositions and their combinations. ' +
    'Syntax: well-formed formulas (WFFs) built from atomic propositions (p, q, r) using connectives (¬, ∧, ∨, →, ↔). ' +
    'Semantics: a truth assignment maps atomic propositions to T/F; complex formula truth is computed recursively. ' +
    'Tautology: a formula true under all truth assignments (p ∨ ¬p). Contradiction: false under all (p ∧ ¬p). ' +
    'Proof systems: natural deduction (introduction/elimination rules for each connective), truth tables, semantic tableaux. ' +
    'Satisfiability: is there a truth assignment making the formula true? The SAT problem is NP-complete. ' +
    'Logical equivalence: p ↔ q is a tautology iff p and q have the same truth table. ' +
    'Normal forms: CNF (conjunctive normal form) and DNF (disjunctive normal form) -- standard representations. ' +
    'Completeness: every tautology of propositional logic can be proved (Hilbert proved this in 1920s).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-logical-connectives',
      description: 'Propositional logic formalizes the connectives into a complete system with syntax, semantics, and proof theory',
    },
    {
      type: 'cross-reference',
      targetId: 'code-algorithms-efficiency',
      description: 'SAT solving is a fundamental computational problem -- propositional logic is the core of automated reasoning systems',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
