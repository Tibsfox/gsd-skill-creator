import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const controlFlow: RosettaConcept = {
  id: 'code-control-flow',
  name: 'Control Flow',
  domain: 'coding',
  description: 'The order in which a program executes its statements. Three fundamental structures ' +
    'cover all possible flows (Böhm-Jacopini theorem): sequence (statements in order), ' +
    'selection (if/else branching based on conditions), and iteration (loops repeating while a condition holds). ' +
    'Functions allow packaging a sequence with a name for reuse. ' +
    'Conditionals encode decisions: if temperature > 100: boil. ' +
    'Loops encode repetition: for each item in list, process. ' +
    'Understanding the current execution path is essential for debugging -- ' +
    'tracing control flow mentally is a core developer skill.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-variables-data-types',
      description: 'Control flow decisions are made on variable values -- conditions compare variables',
    },
    {
      type: 'cross-reference',
      targetId: 'log-if-then-relationships',
      description: 'If-then in programming is the same logical structure as conditional reasoning in logic',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
