import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const technologyEthics: RosettaConcept = {
  id: 'tech-technology-ethics',
  name: 'Technology Ethics',
  domain: 'technology',
  description:
    'Technology ethics examines the moral dimensions of creating and using technology. ' +
    'Questions include: Who benefits and who is harmed by this technology? Who has access? ' +
    'Who is responsible when automated systems make harmful decisions? ' +
    'Are there technologies that should not be built, regardless of technical feasibility? ' +
    'Frameworks include consequentialism (judge by outcomes), deontological constraints (some actions are wrong regardless), ' +
    'and virtue ethics (what would a person of good character build?).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-ai-society',
      description: 'AI ethics is the most pressing current application of technology ethics frameworks',
    },
    {
      type: 'cross-reference',
      targetId: 'engr-engineering-ethics',
      description: 'Technology ethics extends engineering ethics to broader questions about societal impact of technical systems',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.09 + 0.81),
    angle: Math.atan2(0.9, 0.3),
  },
};
