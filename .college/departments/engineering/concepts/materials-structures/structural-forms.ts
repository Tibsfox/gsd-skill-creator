import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const structuralForms: RosettaConcept = {
  id: 'engr-structural-forms',
  name: 'Structural Forms',
  domain: 'engineering',
  description:
    'Structural forms — beams, columns, arches, trusses, shells, cables — distribute loads efficiently ' +
    'to supports through specific force paths. Trusses use triangles (the strongest rigid shape) to carry ' +
    'loads in tension and compression. Arches are efficient in compression. Suspension structures use cables in tension. ' +
    'Engineers choose structural forms based on span, load magnitude, material properties, and architectural requirements.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-structural-loads',
      description: 'The appropriate structural form depends on the type and magnitude of loads to be carried',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
