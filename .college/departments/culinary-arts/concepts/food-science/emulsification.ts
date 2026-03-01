import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const emulsification: RosettaConcept = {
  id: 'cook-emulsification',
  name: 'Emulsification',
  domain: 'culinary-arts',
  description: 'The process of combining two immiscible liquids (typically oil and water) into a ' +
    'stable, uniform mixture using an emulsifier. Oil-in-water emulsions include vinaigrettes, ' +
    'milk, and mayonnaise; water-in-oil emulsions include butter and margarine. Emulsifiers like ' +
    'lecithin (in egg yolks), mustard, and casein have both hydrophilic and hydrophobic regions, ' +
    'allowing them to bridge the oil-water interface. Mechanical action (whisking, blending) ' +
    'breaks fat into tiny droplets that the emulsifier can coat. Temperature matters: too hot ' +
    'denatures protein emulsifiers, causing the emulsion to break.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'cook-protein-denaturation',
      description: 'Proteins serve as structural agents in both processes -- emulsifiers are proteins that stabilize interfaces',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.36 + 0.01),
    angle: Math.atan2(0.1, 0.6),
  },
};
