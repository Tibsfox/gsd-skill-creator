import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const logicalConnectives: RosettaConcept = {
  id: 'log-logical-connectives',
  name: 'Logical Connectives',
  domain: 'logic',
  description: 'Logical connectives combine propositions into compound propositions with precisely defined truth conditions. ' +
    'AND (conjunction, ∧): "p AND q" is true only when both p and q are true. ' +
    'OR (disjunction, ∨): "p OR q" is true when at least one is true (inclusive or). ' +
    'NOT (negation, ¬): "NOT p" flips truth value. ' +
    'IF...THEN (conditional, →): "p → q" is false only when p is true and q is false. "If it rains, the ground is wet" -- only false if it rains but ground is dry. ' +
    'IF AND ONLY IF (biconditional, ↔): true when both have same truth value. ' +
    'XOR (exclusive or): true when exactly one is true. ' +
    'Everyday language is ambiguous: "or" is usually inclusive in English but exclusive in "coffee or tea?" -- logic makes the distinction precise. ' +
    'De Morgan\'s Laws: ¬(p ∧ q) ≡ (¬p ∨ ¬q) and ¬(p ∨ q) ≡ (¬p ∧ ¬q) -- fundamental transformations.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-propositions-truth-values',
      description: 'Connectives operate on propositions -- you need truth values before you can combine them',
    },
    {
      type: 'cross-reference',
      targetId: 'code-control-flow',
      description: 'Boolean expressions in conditionals are propositional logic -- if/else implements the conditional connective directly',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
