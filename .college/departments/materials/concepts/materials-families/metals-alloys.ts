import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const metalsAlloys: RosettaConcept = {
  id: 'mfab-metals-alloys',
  name: 'Metals & Alloys',
  domain: 'materials',
  description:
    'Metals are characterized by high electrical conductivity, ductility, thermal conductivity, and metallic luster. ' +
    'Pure metals are rarely used — alloys (mixtures of metals and other elements) offer superior properties. ' +
    'Steel (iron + carbon) is the dominant structural material. Aluminum alloys offer strength with low density. ' +
    'Copper is essential for electrical wiring. Titanium alloys excel in aerospace for high strength-to-weight ratio. ' +
    'Phase diagrams show which phases are stable at given compositions and temperatures.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-microstructure',
      description: 'Alloying works by modifying microstructure — phase composition and grain structure determine alloy properties',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.64 + 0.0625),
    angle: Math.atan2(0.25, 0.8),
  },
};
