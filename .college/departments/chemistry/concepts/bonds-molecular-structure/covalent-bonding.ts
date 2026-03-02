import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const covalentBonding: RosettaConcept = {
  id: 'chem-covalent-bonding',
  name: 'Covalent Bonding & Lewis Structures',
  domain: 'chemistry',
  description: 'Covalent bonds form when nonmetals share electron pairs. Lewis structures use dots to represent valence electrons and show how atoms share pairs in single, double, or triple bonds. The octet rule states most atoms bond to achieve 8 valence electrons. Bond strength increases with bond order (triple > double > single). Polar covalent bonds arise from unequal sharing.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-periodic-trends', description: 'Electronegativity determines whether covalent bonds are polar or nonpolar' },
    { type: 'dependency', targetId: 'chem-molecular-geometry', description: 'Lewis structures are the input to VSEPR theory for predicting molecular geometry' },
  ],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};
