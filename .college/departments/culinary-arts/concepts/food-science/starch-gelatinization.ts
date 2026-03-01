import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const starchGelatinization: RosettaConcept = {
  id: 'cook-starch-gelatinization',
  name: 'Starch Gelatinization',
  domain: 'culinary-arts',
  description: 'The process by which starch granules absorb water and swell when heated in the ' +
    'presence of moisture, creating viscosity and gel-like textures. Gelatinization temperatures ' +
    'vary by source: cornstarch 62-72C (144-162F), wheat starch 58-64C (136-147F), potato ' +
    'starch 56-66C (133-151F). The swollen granules burst and release amylose, which thickens ' +
    'sauces (roux, slurry). Retrogradation occurs when cooled starch re-crystallizes, causing ' +
    'staling in bread or firming in puddings. Stirring during gelatinization affects final ' +
    'texture -- gentle stirring yields smoother results.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'cook-protein-denaturation',
      description: 'Both are heat-triggered structural transformations -- starch swells while proteins unfold',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.25 + 0.04),
    angle: Math.atan2(0.2, 0.5),
  },
};
