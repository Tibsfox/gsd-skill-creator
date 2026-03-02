import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const propositionsTruthValues: RosettaConcept = {
  id: 'log-propositions-truth-values',
  name: 'Propositions and Truth Values',
  domain: 'logic',
  description: 'A proposition is a statement that is either true or false -- the fundamental unit of logic. ' +
    '"The sky is blue" is a proposition. "Close the door!" is not (imperatives have no truth value). ' +
    'Truth values: every proposition in classical logic is either T or F, never both, never neither (law of excluded middle). ' +
    'Atomic propositions: simple, no logical connectives (p, q, r). Compound propositions: built from atomics using connectives (p AND q). ' +
    'Truth tables: enumerate all possible combinations of truth values for the component propositions. ' +
    'Propositions vs. sentences: "It is raining" said in London and Paris express different propositions. ' +
    'Statement vs. proposition: the sentence is the linguistic expression; the proposition is the abstract meaning. ' +
    'This foundation is the entry point to all formal reasoning -- every logical system operates on truth-valued units.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'code-variables-data-types',
      description: 'Boolean variables in programming are propositions -- true/false values directly implement propositional logic',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
