import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const mixturesPureSubstances: RosettaConcept = {
  id: 'chem-mixtures-pure-substances',
  name: 'Mixtures & Pure Substances',
  domain: 'chemistry',
  description:
    'Pure substances have fixed composition: elements contain one type of atom; compounds contain atoms ' +
    'of two or more elements in fixed ratios. Mixtures have variable composition and can be separated ' +
    'physically. Homogeneous mixtures (solutions) are uniform throughout; heterogeneous mixtures have ' +
    'visible distinct components. Separation techniques include filtration, distillation, and chromatography.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-atomic-structure', description: 'Understanding elements and compounds requires knowledge of atomic structure' },
  ],
  complexPlanePosition: { real: 0.75, imaginary: 0.25, magnitude: Math.sqrt(0.5625 + 0.0625), angle: Math.atan2(0.25, 0.75) },
};
