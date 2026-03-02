import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const deductiveReasoning: RosettaConcept = {
  id: 'philo-deductive-reasoning',
  name: 'Deductive Reasoning',
  domain: 'philosophy',
  description:
    'Deductive reasoning is the process of drawing conclusions that necessarily follow from ' +
    'premises if those premises are true. A valid deductive argument is one where the conclusion ' +
    'cannot be false if the premises are true; a sound argument is valid with true premises. ' +
    'The categorical syllogism is the classic form: "All humans are mortal; Socrates is human; ' +
    'therefore Socrates is mortal." Aristotle systematized valid syllogistic forms (Barbara, Celarent, ' +
    'Darii, etc.). Propositional logic extends deduction to compound statements using connectives ' +
    '(and, or, not, if-then): modus ponens (P → Q, P ∴ Q) and modus tollens (P → Q, ¬Q ∴ ¬P) ' +
    'are the fundamental valid argument forms. Predicate logic adds quantifiers (∀, ∃) for greater ' +
    'expressive power. Unlike inductive reasoning, valid deduction guarantees its conclusion — ' +
    'it cannot add new information beyond what is implicit in the premises.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-argument-structure',
      description: 'Deductive reasoning is the formal analysis of valid argument structure',
    },
    {
      type: 'analogy',
      targetId: 'philo-logical-fallacies',
      description: 'Logical fallacies are the failure modes of deductive and inductive reasoning',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
