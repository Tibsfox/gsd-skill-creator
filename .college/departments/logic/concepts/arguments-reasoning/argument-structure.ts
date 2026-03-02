import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const argumentStructure: RosettaConcept = {
  id: 'log-argument-structure',
  name: 'Argument Structure and Analysis',
  domain: 'logic',
  description: 'An argument is a set of statements where some (premises) are offered as reasons for another (conclusion). ' +
    'Standard form: rewrite arguments with premises numbered, conclusion last, marked with "therefore". ' +
    'Identifying arguments: look for indicator words -- "because", "since", "given that" signal premises; "therefore", "so", "thus" signal conclusions. ' +
    'Hidden premises (enthymemes): many everyday arguments omit premises that seem obvious. Making them explicit reveals assumptions. ' +
    'Argument mapping: visual diagrams showing how premises support a conclusion, including counterarguments and rebuttals. ' +
    'Simple vs. complex arguments: complex arguments have sub-arguments where conclusions of one become premises of another. ' +
    'Convergent vs. linked premises: convergent (each premise independently supports conclusion) vs. linked (premises work only together). ' +
    'Principle of charity: always interpret an argument in its strongest form before evaluating -- steelmanning, not strawmanning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-validity-soundness',
      description: 'Evaluating argument structure requires understanding validity -- structure determines whether the argument form is valid',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-textual-evidence',
      description: 'Literary evidence works like argument premises -- both require assessing whether evidence actually supports the claim',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
