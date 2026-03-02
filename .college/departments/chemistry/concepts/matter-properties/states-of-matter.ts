import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const statesOfMatter: RosettaConcept = {
  id: 'chem-states-of-matter',
  name: 'States of Matter',
  domain: 'chemistry',
  description:
    'Matter exists as solid (fixed shape and volume), liquid (fixed volume, variable shape), or gas ' +
    '(variable shape and volume). Plasma is the fourth state. State changes (melting, boiling, sublimation) ' +
    'occur when thermal energy overcomes the forces holding particles together. ' +
    'Particle arrangement and motion explain the macroscopic properties of each state.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-atomic-structure', description: 'The behavior of matter in different states is explained by atomic and molecular properties' },
  ],
  complexPlanePosition: { real: 0.9, imaginary: 0.1, magnitude: Math.sqrt(0.81 + 0.01), angle: Math.atan2(0.1, 0.9) },
};
