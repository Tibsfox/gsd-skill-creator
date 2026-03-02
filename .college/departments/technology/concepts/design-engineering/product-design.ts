import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const productDesign: RosettaConcept = {
  id: 'tech-product-design',
  name: 'Product Design',
  domain: 'technology',
  description:
    'Product design creates objects that are functional, manufacturable, and desirable. ' +
    'It integrates user research (what do users actually need?), aesthetics (form, ergonomics, visual language), ' +
    'materials selection, and manufacturability into a coherent solution. ' +
    'Design briefs, mood boards, sketching, and 3D modeling are core process tools. ' +
    'The tension between what users say they want and what they actually need is the central challenge of product design.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-design-thinking',
      description: 'Product design applies design thinking methodology — empathize with users before designing for them',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
