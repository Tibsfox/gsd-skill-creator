import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const structuralLoads: RosettaConcept = {
  id: 'engr-structural-loads',
  name: 'Structural Loads & Forces',
  domain: 'engineering',
  description:
    'Structures must support loads: dead loads (self-weight), live loads (occupants, equipment), ' +
    'wind loads, seismic loads, and thermal loads. Forces are resolved into tension (pulling apart), ' +
    'compression (pushing together), shear (sliding), bending, and torsion. ' +
    'Free body diagrams isolate structures and show all applied and reaction forces for analysis. ' +
    'Understanding loads is prerequisite for any structural design.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.64 + 0.0625),
    angle: Math.atan2(0.25, 0.8),
  },
};
