import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const strategicManagement: RosettaConcept = {
  id: 'bus-strategic-management',
  name: 'Strategic Management',
  domain: 'business',
  description:
    'Strategic management is the process of formulating and implementing plans to achieve long-term goals. ' +
    'Frameworks include SWOT analysis (Strengths, Weaknesses, Opportunities, Threats), ' +
    'Porter\'s Five Forces (competitive analysis), and Blue Ocean Strategy (creating uncontested market space). ' +
    'Strategy cascades from mission and vision to objectives, to tactics, to operational decisions. ' +
    'Good strategy creates sustainable competitive advantage that is hard to imitate.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-corporate-governance',
      description: 'Boards of directors are responsible for approving and overseeing strategic direction',
    },
    {
      type: 'dependency',
      targetId: 'bus-market-structures',
      description: 'Competitive strategy must account for the firm\'s market structure and competitive dynamics',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.09 + 0.81),
    angle: Math.atan2(0.9, 0.3),
  },
};
