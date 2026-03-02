import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sustainableMaterials: RosettaConcept = {
  id: 'mfab-sustainable-materials',
  name: 'Sustainable Materials',
  domain: 'materials',
  description:
    'Sustainable materials have reduced environmental impact across their lifecycle. ' +
    'Categories include bio-based materials (wood, bamboo, natural fibers, bioplastics), ' +
    'recycled content materials, and low-embodied-energy materials. ' +
    'Trade-offs must be evaluated: bio-based is not automatically sustainable (land use, pesticides matter). ' +
    'Green building standards (LEED, BREEAM) specify sustainable material criteria for construction.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-lca-lifecycle',
      description: 'Claims of sustainability require LCA evidence — otherwise they may be greenwashing',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};
