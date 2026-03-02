import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const physicalChemicalProperties: RosettaConcept = {
  id: 'chem-physical-chemical-properties',
  name: 'Physical vs. Chemical Properties',
  domain: 'chemistry',
  description:
    'Physical properties (color, density, melting point, conductivity) can be observed or measured without ' +
    'changing the substance\'s chemical identity. Chemical properties (flammability, reactivity, corrosiveness) ' +
    'describe how a substance transforms into a different substance. Physical changes preserve identity; ' +
    'chemical changes produce new substances with different properties.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-states-of-matter', description: 'Many physical properties relate to states of matter and state transitions' },
    { type: 'dependency', targetId: 'chem-balancing-equations', description: 'Chemical properties are expressed through chemical reactions described by balanced equations' },
  ],
  complexPlanePosition: { real: 0.8, imaginary: 0.2, magnitude: Math.sqrt(0.64 + 0.04), angle: Math.atan2(0.2, 0.8) },
};
