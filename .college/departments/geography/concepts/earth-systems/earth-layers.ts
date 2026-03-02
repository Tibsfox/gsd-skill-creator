import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const earthLayers: RosettaConcept = {
  id: 'geo-earth-layers',
  name: 'Earth\'s Internal Layers',
  domain: 'geography',
  description:
    'Earth is structured in concentric layers: the inner core (solid iron-nickel), outer core (liquid, generates magnetic field), ' +
    'mantle (convecting silicate rock), and crust (thin, rigid). ' +
    'Seismic wave behavior provides the primary evidence for this layered structure. ' +
    'Each layer has distinct composition, temperature, pressure, and behavior that shapes surface processes.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-lithosphere',
      description: 'The lithosphere (crust + upper mantle) is the layer relevant to plate motion',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
