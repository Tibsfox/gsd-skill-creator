import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const formalProofSystems: RosettaConcept = {
  id: 'log-formal-proof-systems',
  name: 'Formal Proof Systems',
  domain: 'logic',
  description: 'A formal proof system provides a mechanical procedure for deriving conclusions from premises using explicit inference rules. ' +
    'Axioms: statements accepted without proof within the system. ' +
    'Inference rules: licensed moves from premises to conclusion (modus ponens, conjunction introduction, etc.). ' +
    'Proof: a finite sequence of statements where each is an axiom or follows from earlier statements by a rule. ' +
    'Natural deduction (Gentzen, 1935): introduction and elimination rules for each connective -- reflects how mathematicians actually reason. ' +
    'Sequent calculus: alternative proof system where proofs have a tree structure. ' +
    'Soundness: everything provable in the system is logically valid. ' +
    'Completeness: every logical validity is provable in the system. ' +
    'Proof assistants (Coq, Lean, Isabelle): computer systems that verify formal proofs -- used to verify mathematical theorems and software correctness.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-predicate-logic',
      description: 'Formal proof systems typically operate on predicate logic formulas -- FOL provides the language, proof systems provide the deduction mechanism',
    },
    {
      type: 'cross-reference',
      targetId: 'code-debugging-strategies',
      description: 'Type systems in programming languages are formal proof systems -- the type checker verifies that programs are "proofs" of type correctness',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
