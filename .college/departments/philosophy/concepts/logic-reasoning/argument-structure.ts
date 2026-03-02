import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const argumentStructure: RosettaConcept = {
  id: 'philo-argument-structure',
  name: 'Argument Structure',
  domain: 'philosophy',
  description:
    'A philosophical argument is a structured set of statements: premises (reasons given) ' +
    'leading to a conclusion (claim being supported). Standard form: P1, P2, therefore C. ' +
    'Validity: an argument is valid if the conclusion MUST be true given true premises -- ' +
    'the form is correct regardless of content. Soundness: a sound argument is valid AND ' +
    'has actually true premises. An argument can be valid but unsound (premises false), ' +
    'or have a true conclusion reached by bad reasoning (invalid but accidentally correct). ' +
    'Deductive arguments claim the conclusion necessarily follows from premises. ' +
    'Inductive arguments claim the conclusion is probable given premises. ' +
    'Abductive reasoning (inference to best explanation) asks: what hypothesis best explains the evidence? ' +
    'Identifying premises and conclusions in natural language requires looking for inference ' +
    'indicators: therefore, because, since, it follows that.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'log-propositional-logic',
      description: 'Propositional logic formalizes argument structure with symbolic notation',
    },
    {
      type: 'dependency',
      targetId: 'philo-logical-fallacies',
      description: 'Understanding valid structure helps identify invalid fallacious arguments',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(0.2, 0.6),
  },
};
