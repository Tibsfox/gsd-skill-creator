import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const atmosphereLayers: RosettaConcept = {
  id: 'envr-atmosphere-layers',
  name: 'Atmospheric Layers and the Greenhouse Effect',
  domain: 'environmental',
  description: 'Earth\'s atmosphere is layered, and each layer has distinct properties that support life and drive weather. ' +
    'Troposphere (0-12 km): where all weather occurs, contains 75% of atmospheric mass. Temperature decreases with altitude. ' +
    'Stratosphere (12-50 km): contains the ozone layer (absorbs UV radiation). Temperature increases with altitude. ' +
    'Mesosphere, thermosphere, exosphere: progressively thinner, less relevant to surface conditions. ' +
    'Greenhouse effect: greenhouse gases (CO₂, methane, water vapor, nitrous oxide) absorb outgoing infrared radiation and re-emit it, warming the surface. ' +
    'Natural greenhouse effect: essential for life -- without it, Earth\'s average temperature would be -18°C instead of +15°C. ' +
    'Enhanced greenhouse effect: additional greenhouse gases from human activities amplify the natural effect -- driving anthropogenic climate change. ' +
    'Albedo: reflectivity of a surface. Snow and ice are high albedo; forests and oceans are low albedo. Ice melt reduces albedo -- a positive feedback. ' +
    'Ozone depletion: CFCs catalytically destroy stratospheric ozone -- the Montreal Protocol (1987) successfully reduced emissions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'envr-carbon-cycle',
      description: 'Greenhouse gas concentrations depend on the carbon cycle -- the carbon cycle determines how much CO₂ enters the atmosphere',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-climate-science',
      description: 'The greenhouse effect is the mechanism of climate change -- atmospheric physics connects to observed climate trends',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
