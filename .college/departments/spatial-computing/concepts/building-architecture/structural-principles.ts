import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const structuralPrinciples: RosettaConcept = {
  id: 'spatial-structural-principles',
  name: 'Structural Principles',
  domain: 'spatial-computing',
  description:
    'In Minecraft, all blocks are self-supporting -- no physics simulation for most materials. This ' +
    'allows creative freedom but also encourages designing aesthetically structural builds. Pillar spacing: ' +
    'for large flat roofs, placing pillars (stone brick, oak log columns) every 5-7 blocks prevents ' +
    'the "floating ceiling" appearance. Arch construction spans gaps without a center support: ' +
    'build both sides up and inward, meeting at the keystone at the top center. Corbeling extends ' +
    'blocks outward one step per row to create overhangs without external support. Depth and contrast: ' +
    'recessed windows, protruding ledges, and pilasters break up flat walls. Layer differentiation: ' +
    'base in cobblestone, walls in stone brick, roof in dark oak planks creates visual hierarchy. ' +
    'Mixing materials (stone brick + andesite trim, oak + spruce accents) prevents monotonous surfaces.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-material-properties',
      description: 'Structural principles require knowing which blocks provide visual weight and texture contrast',
    },
    {
      type: 'dependency',
      targetId: 'spatial-blueprint-design',
      description: 'Structural decisions should be planned in the blueprint before committing blocks',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.85 ** 2 + 0.15 ** 2),
    angle: Math.atan2(0.15, 0.85),
  },
};
