import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const serverProjectPlanning: RosettaConcept = {
  id: 'spatial-server-project-planning',
  name: 'Server Project Planning',
  domain: 'spatial-computing',
  description:
    'Large server builds require planning before placing a single block. Town planning phases: ' +
    '(1) infrastructure first -- roads, walls, and utility connections before buildings; ' +
    '(2) district zoning -- residential, commercial, industrial, and agricultural zones with ' +
    'clear boundaries; (3) build standards -- agree on material palette, height limits, and ' +
    'setback rules before individual players build. Spawn area planning: the spawn region is ' +
    'the first impression -- polished town halls and clear signage attract collaborative players. ' +
    'Claim systems: plugins or honor systems delineate building zones. ' +
    'World borders prevent uncontrolled sprawl. Version control analogy: pre-build world backups ' +
    'serve as save states before major construction events (like terraforming). ' +
    'Project staging: Phase 1 = core infrastructure, Phase 2 = primary buildings, Phase 3 = detail ' +
    'and decoration ensures the world is always functional even if decoration is incomplete.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-role-specialization',
      description: 'Town planning requires assigning roles before construction begins to avoid conflicts',
    },
    {
      type: 'cross-reference',
      targetId: 'spatial-blueprint-design',
      description: 'Server project planning scales blueprint-design thinking to multi-player, multi-structure projects',
    },
  ],
  complexPlanePosition: {
    real: 0.50,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.50 ** 2 + 0.65 ** 2),
    angle: Math.atan2(0.65, 0.50),
  },
};
