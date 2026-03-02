import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const rapidPrototyping: RosettaConcept = {
  id: 'engr-rapid-prototyping',
  name: 'Rapid Prototyping',
  domain: 'engineering',
  description:
    'Rapid prototyping creates physical or digital representations of designs quickly and cheaply to test ideas before ' +
    'committing to expensive manufacturing. Low-fidelity prototypes (cardboard, foam, paper) test form and usability. ' +
    'Medium-fidelity prototypes (3D printing, laser cutting) test fit and basic function. ' +
    'High-fidelity prototypes approach production quality for final testing. ' +
    'Fail early, fail cheap: the whole point of prototyping is to discover problems before production.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-engineering-design-process',
      description: 'Prototyping is the Build phase of the engineering design process, preceding formal testing',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
