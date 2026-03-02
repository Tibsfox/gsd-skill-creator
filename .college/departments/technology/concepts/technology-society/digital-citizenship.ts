import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const digitalCitizenship: RosettaConcept = {
  id: 'tech-digital-citizenship',
  name: 'Digital Citizenship',
  domain: 'technology',
  description:
    'Digital citizenship is the responsible and ethical use of technology. ' +
    'Components: digital literacy (skills), digital etiquette (norms), digital rights and responsibilities, ' +
    'digital safety, and digital health (managing screen time and mental wellbeing). ' +
    'Digital footprint awareness: online actions leave permanent, searchable records that can affect future opportunities. ' +
    'Critical evaluation of online information and awareness of algorithmic curation are core modern literacy skills.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-cybersecurity-basics',
      description: 'Personal cybersecurity is one component of responsible digital citizenship',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
