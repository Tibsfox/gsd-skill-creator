import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ceramicsComposites: RosettaConcept = {
  id: 'mfab-ceramics-composites',
  name: 'Ceramics & Composites',
  domain: 'materials',
  description:
    'Ceramics (alumina, silicon carbide, glass) are hard, brittle, thermally stable, and chemically inert. ' +
    'They excel in high-temperature applications (kiln furniture, turbine coatings) and cutting tools. ' +
    'Composites combine two materials to achieve properties neither offers alone. ' +
    'Carbon fiber reinforced polymer (CFRP) offers exceptional stiffness-to-weight ratio. ' +
    'Concrete is a composite: aggregate + cement + steel reinforcement. ' +
    'Composites are increasingly important in aerospace, automotive, and sporting goods.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-metals-alloys',
      description: 'Composites are designed to overcome the limitations of monolithic metals, ceramics, or polymers individually',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
