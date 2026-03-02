import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const mechanicalProperties: RosettaConcept = {
  id: 'mfab-mechanical-properties',
  name: 'Mechanical Properties',
  domain: 'materials',
  description:
    'Mechanical properties describe how materials respond to applied forces. ' +
    'Strength (ability to resist force), stiffness/elasticity (resistance to deformation), ' +
    'ductility (ability to deform without fracturing), hardness (resistance to surface indentation), ' +
    'and toughness (energy absorbed before fracture) are the key properties. ' +
    'These are measured by standardized tests: tensile testing, hardness testing (Rockwell, Brinell), and Charpy impact tests.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
