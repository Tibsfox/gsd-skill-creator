import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const aiSociety: RosettaConcept = {
  id: 'tech-ai-society',
  name: 'AI & Society',
  domain: 'technology',
  description:
    'Artificial intelligence systems learn patterns from data to make decisions or generate outputs. ' +
    'Machine learning, deep learning, and large language models are current dominant approaches. ' +
    'AI raises social questions: algorithmic bias (systems trained on biased data perpetuate bias), ' +
    'labor displacement, privacy (surveillance, facial recognition), and autonomous decision-making accountability. ' +
    'AI literacy — understanding what AI systems can and cannot do — is becoming an essential civic competency.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-digital-citizenship',
      description: 'Navigating AI-generated content critically is a key component of modern digital citizenship',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.1225 + 0.7225),
    angle: Math.atan2(0.85, 0.35),
  },
};
