import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const climateChange: RosettaConcept = {
  id: 'geo-climate-change',
  name: 'Climate Change',
  domain: 'geography',
  description:
    'Climate change refers to long-term shifts in global temperatures and weather patterns, currently driven ' +
    'primarily by human greenhouse gas emissions since the Industrial Revolution. ' +
    'Key effects include rising sea levels, more frequent extreme weather, shifting biomes, and ocean acidification. ' +
    'The scientific consensus on anthropogenic climate change is overwhelming, though policy responses remain contested. ' +
    'Understanding climate change requires integrating physical geography, chemistry, economics, and ethics.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'geo-climate-zones',
      description: 'Climate change is altering the boundaries and characteristics of established climate zones',
    },
    {
      type: 'dependency',
      targetId: 'geo-biomes',
      description: 'Biome distributions are shifting in response to changing temperature and precipitation patterns',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.16 + 0.5625),
    angle: Math.atan2(0.75, 0.4),
  },
};
