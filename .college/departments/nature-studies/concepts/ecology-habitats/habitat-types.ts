import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const habitatTypes: RosettaConcept = {
  id: 'nature-habitat-types',
  name: 'Habitat Types',
  domain: 'nature-studies',
  description:
    'Habitats are classified by characteristic vegetation, climate, and fauna. ' +
    'Temperate deciduous forest: defined by distinct seasons, leaf-off winters, ' +
    'dominated by oaks, maples, birches; rich understory in spring before leaf-out. ' +
    'Wetlands (marshes, swamps, bogs, fens) are among the most biologically productive ' +
    'habitats; function as water filtration, flood control, and carbon sequestration. ' +
    'Grasslands support large grazing mammals and grassland birds threatened by agricultural conversion. ' +
    'Coastal habitats (intertidal zones, estuaries, salt marshes) are nursery grounds ' +
    'for marine species and highly sensitive to sea level change. ' +
    'Edge habitat (ecotone) where two habitats meet supports highest local diversity: ' +
    'species from both habitats plus edge specialists. ' +
    'Each habitat type has indicator species that signal its health: ' +
    'brook trout indicate cold, clean, well-oxygenated streams; their absence signals degradation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-ecology',
      description: 'Habitat types are the ecological contexts within which food webs and successions operate',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
