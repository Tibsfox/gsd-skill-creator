import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ecology: RosettaConcept = {
  id: 'nature-ecology',
  name: 'Ecology',
  domain: 'nature-studies',
  description:
    'Ecology studies how living organisms interact with each other and with their physical ' +
    'environment. The ecosystem includes biotic (living) and abiotic (non-living) components ' +
    'linked by energy flow and nutrient cycling. Food webs model feeding relationships: ' +
    'producers (plants) capture solar energy, primary consumers eat producers, secondary ' +
    'consumers eat primary consumers -- with energy lost at each trophic level (10% rule: ' +
    'only 10% of energy transfers up). Keystone species have disproportionate effects on ' +
    'ecosystem structure: removing wolves from Yellowstone caused trophic cascade that ' +
    'changed river courses (trees browsed out, riverbanks eroded). Succession is directional ' +
    'change in ecosystem composition over time: bare rock -> lichen -> moss -> grass -> ' +
    'shrub -> pioneer trees -> climax forest. Disturbance (fire, flood, storm) resets ' +
    'succession and maintains diversity.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'envr-ecosystems',
      description: 'Environmental science formalizes the ecology concepts naturalists observe in the field',
    },
    {
      type: 'cross-reference',
      targetId: 'geo-earth-structure',
      description: 'Geological substrate shapes habitat type and thus the ecology of a place',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
