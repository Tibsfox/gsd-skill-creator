import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const lithosphere: RosettaConcept = {
  id: 'geo-lithosphere',
  name: 'Lithosphere & Plate Tectonics',
  domain: 'geography',
  description:
    'The lithosphere is Earth\'s rigid outer shell, broken into tectonic plates that drift over the ' +
    'semi-fluid asthenosphere below. Plate boundaries — convergent, divergent, and transform — are the ' +
    'sites of earthquakes, volcanoes, mountain formation, and oceanic trenches. ' +
    'Plate tectonics is the unifying theory explaining Earth\'s surface geology and major landform distribution.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-earth-layers',
      description: 'Plate tectonics is driven by convection currents in the mantle (internal Earth layer)',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
