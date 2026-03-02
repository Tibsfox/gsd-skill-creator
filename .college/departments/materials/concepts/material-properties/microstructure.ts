import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const microstructure: RosettaConcept = {
  id: 'mfab-microstructure',
  name: 'Microstructure & Property Relationships',
  domain: 'materials',
  description:
    'Microstructure — the arrangement of atoms, grains, phases, and defects at the microscopic scale — ' +
    'determines macroscopic properties. Smaller grain size generally increases strength (Hall-Petch relationship). ' +
    'Heat treatment (annealing, quenching, tempering) controls microstructure and therefore properties. ' +
    'Alloying adds solute atoms that disrupt dislocation motion, increasing strength. ' +
    'This structure-processing-properties paradigm is the unifying framework of materials science.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-mechanical-properties',
      description: 'Understanding microstructure explains why the same material in different conditions has different properties',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
