import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const biomes: RosettaConcept = {
  id: 'geo-biomes',
  name: 'Biomes & Ecosystems',
  domain: 'geography',
  description:
    'Biomes are large-scale communities of plants and animals shaped by climate — temperature, precipitation, ' +
    'and seasonality. Major biomes include tropical rainforest, temperate deciduous forest, grassland/savanna, ' +
    'desert, tundra, and taiga. Ecosystems are functional units within biomes where organisms interact with ' +
    'each other and their physical environment through energy and nutrient flows.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-climate-zones',
      description: 'Biome distribution follows climate zone patterns — each biome is defined by climate parameters',
    },
    {
      type: 'dependency',
      targetId: 'geo-hydrosphere',
      description: 'Water availability is the primary factor distinguishing forest biomes from desert biomes',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
