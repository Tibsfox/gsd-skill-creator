import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const coordinateNavigation: RosettaConcept = {
  id: 'spatial-coordinate-navigation',
  name: 'Coordinate Navigation',
  domain: 'spatial-computing',
  description:
    'Minecraft uses a right-handed coordinate system: X increases east, Z increases south, Y increases up. ' +
    'The F3 debug screen shows XYZ position as decimal block coordinates. The spawn point is near 0,64,0 ' +
    'by default. Chunks are 16x16 block columns; chunk boundaries fall at multiples of 16 on X and Z axes. ' +
    'Cardinal direction navigation: pressing F3 shows facing direction (north/south/east/west). ' +
    'Nether coordinates are 1:8 scale -- traveling 1 block in the Nether equals 8 blocks in the Overworld. ' +
    'Waypoint systems use coordinate bookmarks (e.g., "iron mine at -234, 12, 891"). ' +
    'Height matters: Y=64 is sea level; diamond ore spawns most frequently at Y=5-12; ' +
    'clouds appear at Y=192. Understanding coordinates enables precise builds and reliable navigation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-reasoning-3d',
      description: '3D spatial reasoning requires an internalized understanding of the X/Y/Z coordinate frame',
    },
    {
      type: 'cross-reference',
      targetId: 'math-coordinate-geometry',
      description: 'Minecraft coordinates directly implement 3D Cartesian geometry from mathematics',
    },
  ],
  complexPlanePosition: {
    real: 0.90,
    imaginary: 0.10,
    magnitude: Math.sqrt(0.90 ** 2 + 0.10 ** 2),
    angle: Math.atan2(0.10, 0.90),
  },
};
