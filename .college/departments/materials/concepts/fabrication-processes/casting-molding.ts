import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const castingMolding: RosettaConcept = {
  id: 'mfab-casting-molding',
  name: 'Casting & Molding',
  domain: 'materials',
  description:
    'Casting and molding pour or inject material into a mold to form complex shapes in a single step. ' +
    'Sand casting (metals), die casting (high-volume metals), and injection molding (plastics) produce ' +
    'complex geometries that would be expensive to machine. ' +
    'Tolerances are looser than machining; surface finish may require secondary operations. ' +
    'Mold design must account for material shrinkage, draft angles for part removal, and parting lines.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-metals-alloys',
      description: 'Most casting processes are designed specifically for metals, exploiting their liquid-to-solid transformation',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.5625 + 0.1225),
    angle: Math.atan2(0.35, 0.75),
  },
};
