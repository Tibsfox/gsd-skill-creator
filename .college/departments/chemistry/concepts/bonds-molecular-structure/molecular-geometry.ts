import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const molecularGeometry: RosettaConcept = {
  id: 'chem-molecular-geometry',
  name: 'Molecular Geometry & VSEPR',
  domain: 'chemistry',
  description: 'VSEPR (Valence Shell Electron Pair Repulsion) theory predicts molecular shape: electron pairs arrange to minimize repulsion. Shapes include linear, bent, trigonal planar, tetrahedral, and octahedral. Molecular geometry determines polarity, which in turn determines intermolecular forces, boiling points, and solubility. Water\'s bent shape makes it polar and gives it unique properties.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-covalent-bonding', description: 'VSEPR uses Lewis structures as input to predict 3D molecular shape' },
    { type: 'dependency', targetId: 'chem-intermolecular-forces', description: 'Molecular polarity from geometry determines which intermolecular forces act between molecules' },
  ],
  complexPlanePosition: { real: 0.5, imaginary: 0.65, magnitude: Math.sqrt(0.25 + 0.4225), angle: Math.atan2(0.65, 0.5) },
};
