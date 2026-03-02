import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const advancedMaterials: RosettaConcept = {
  id: 'mfab-advanced-materials',
  name: 'Advanced & Smart Materials',
  domain: 'materials',
  description:
    'Advanced materials have been engineered for exceptional or novel properties. ' +
    'Shape memory alloys (Nitinol) return to a preset shape on heating. ' +
    'Piezoelectric materials convert mechanical stress to electrical signals (sensors, transducers). ' +
    'Nanomaterials have unique properties at nanoscale (carbon nanotubes, graphene). ' +
    'Metamaterials have engineered microstructures that produce properties impossible in natural materials (negative refractive index). ' +
    'Advanced materials are enabling next-generation energy, medical, and computing technologies.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-microstructure',
      description: 'Advanced material properties arise from precisely engineered microstructures at atomic and nanoscale',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};
