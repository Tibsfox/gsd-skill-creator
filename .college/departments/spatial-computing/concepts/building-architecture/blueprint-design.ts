import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const blueprintDesign: RosettaConcept = {
  id: 'spatial-blueprint-design',
  name: 'Blueprint & Schematic Design',
  domain: 'spatial-computing',
  description:
    'Effective builders plan before placing blocks. Blueprint phases: (1) sketch footprint on paper ' +
    'with dimensions (e.g., 20x30 building with 4x6 windows every 6 blocks); (2) mark out the ' +
    'perimeter in-game with temporary dirt blocks before committing to final materials; (3) build ' +
    'layer-by-layer from foundation up, completing one full floor before starting the next. ' +
    'Schematics (NBT files) capture build snapshots importable via mods. Layer-by-layer approach: ' +
    'each Y level is one independent floor plan to place. Interior planning: rooms need minimum ' +
    '3x3 clear floor space for functional use; hallways minimum 2 blocks wide. Scale awareness: ' +
    'a door is 2 blocks tall x 1 block wide, setting the human-scale reference for building proportion. ' +
    'Iteration is expected -- blocking out in cheap material (dirt/cobblestone) and replacing is ' +
    'faster than trying to place final material perfectly first.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'spatial-iterative-build-process',
      description: 'Blueprint design and iterative building are complementary practices -- plan, build rough, refine',
    },
    {
      type: 'dependency',
      targetId: 'spatial-reasoning-3d',
      description: 'Reading a 2D floor plan and executing it in 3D requires strong spatial reasoning',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.30,
    magnitude: Math.sqrt(0.75 ** 2 + 0.30 ** 2),
    angle: Math.atan2(0.30, 0.75),
  },
};
