import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const additiveManufacturing: RosettaConcept = {
  id: 'mfab-additive-manufacturing',
  name: 'Additive Manufacturing (3D Printing)',
  domain: 'materials',
  description:
    'Additive manufacturing builds parts layer-by-layer from digital models — no molds or tooling required. ' +
    'Technologies: FDM (fused deposition, plastics), SLA (stereolithography, resins), SLS (selective laser sintering, powders), ' +
    'DMLS (direct metal laser sintering). ' +
    'Advantages: complex geometries (lattices, internal channels), rapid prototyping, on-demand manufacturing. ' +
    'Limitations: slower than mass production, anisotropic properties, surface roughness. ' +
    'Additive manufacturing is transforming aerospace, medical implants, and custom manufacturing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-polymers',
      description: 'The most accessible additive manufacturing processes (FDM, SLA) use polymer materials',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.3025 + 0.4225),
    angle: Math.atan2(0.65, 0.55),
  },
};
