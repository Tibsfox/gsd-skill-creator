import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const spatialReasoning3d: RosettaConcept = {
  id: 'spatial-reasoning-3d',
  name: '3D Spatial Reasoning',
  domain: 'spatial-computing',
  description:
    'Spatial reasoning in Minecraft involves mentally rotating, reflecting, and translating block structures. ' +
    'Building a multi-floor structure requires visualizing each floor plan independently while maintaining ' +
    'consistent column alignment across Y levels. Cross-sectional thinking: imagining a vertical slice ' +
    'through a mountain build to plan interior rooms. Mirror symmetry: building one half then mirroring -- ' +
    'if a feature is at X=5, its mirror at X=-5 relative to center requires careful block counting. ' +
    'Volume estimation: how many blocks of sandstone for a 20x8x6 pyramid? ' +
    '(approximately 20*8*6/3 = 320 blocks accounting for the pyramid taper). ' +
    'Scaffolding strategy: temporary wooden scaffolding blocks allow building at heights then ' +
    'removal. Spatial reasoning practice transfers directly to engineering CAD visualization skills.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-coordinate-navigation',
      description: 'Spatial reasoning requires internalizing the X/Y/Z coordinate framework',
    },
    {
      type: 'dependency',
      targetId: 'spatial-geometric-structures',
      description: 'Complex structures like domes and spirals require applying geometric reasoning to block space',
    },
  ],
  complexPlanePosition: {
    real: 0.80,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.80 ** 2 + 0.25 ** 2),
    angle: Math.atan2(0.25, 0.80),
  },
};
