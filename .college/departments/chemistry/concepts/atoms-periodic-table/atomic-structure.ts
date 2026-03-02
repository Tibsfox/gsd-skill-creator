import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const atomicStructure: RosettaConcept = {
  id: 'chem-atomic-structure',
  name: 'Atomic Structure',
  domain: 'chemistry',
  description: 'Atoms consist of a dense nucleus (protons + neutrons) surrounded by electrons in energy shells. Atomic number = proton count (defines element identity); mass number = protons + neutrons. Electrons occupy orbitals defined by quantum numbers. The arrangement of electrons (electron configuration) determines an element\'s chemical behavior.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-periodic-table-organization', description: 'Elements are arranged in the periodic table by atomic number and electron configuration' },
    { type: 'cross-reference', targetId: 'phys-quantum-basics', description: 'Atomic orbitals and electron energy levels are products of quantum mechanics' },
  ],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};
