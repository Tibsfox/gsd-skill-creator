import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const predicateLogic: RosettaConcept = {
  id: 'log-predicate-logic',
  name: 'Predicate Logic (First-Order Logic)',
  domain: 'logic',
  description: 'Predicate logic extends propositional logic with predicates, variables, and quantifiers -- enabling reasoning about objects and their properties. ' +
    'Predicates: properties or relations. P(x): "x is mortal". R(x,y): "x loves y". ' +
    'Universal quantifier (∀): "For all x, P(x)" -- "All humans are mortal" → ∀x(Human(x) → Mortal(x)). ' +
    'Existential quantifier (∃): "There exists x such that P(x)" -- "Someone is tall" → ∃x(Tall(x)). ' +
    'Scope and binding: variables can be bound (inside quantifier scope) or free (outside). ' +
    'The syllogism formalized: "All men are mortal; Socrates is a man; therefore Socrates is mortal" → valid in FOL. ' +
    'Completeness (Gödel, 1930): every valid first-order sentence has a proof. ' +
    'Incompleteness (Gödel, 1931): any consistent system strong enough to express arithmetic contains true but unprovable sentences. ' +
    'FOL is the foundation of mathematical logic, automated theorem proving, and database query languages (SQL is essentially FOL).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-propositional-logic',
      description: 'Predicate logic extends propositional logic -- propositional logic is the base layer',
    },
    {
      type: 'cross-reference',
      targetId: 'code-algorithms-efficiency',
      description: 'Database queries (SQL WHERE clauses) implement predicate logic -- FOL is the theoretical foundation of relational databases',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
