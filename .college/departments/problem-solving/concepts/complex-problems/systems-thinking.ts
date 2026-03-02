import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const systemsThinking: RosettaConcept = {
  id: 'prob-systems-thinking',
  name: 'Systems Thinking',
  domain: 'problem-solving',
  description:
    'Systems thinking analyzes problems as parts of larger interacting systems rather than isolated events. ' +
    'Key concepts include feedback loops (reinforcing and balancing), emergence (whole greater than parts), ' +
    'leverage points (places where small changes produce large effects), and unintended consequences. ' +
    'Systems thinking is essential for complex problems where interventions produce unexpected second-order effects: ' +
    'climate change, public health, economic policy, and software architecture all require it.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-decomposition',
      description: 'Systems thinking extends decomposition by also modeling how the pieces interact and create feedback loops',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.1225 + 0.7225),
    angle: Math.atan2(0.85, 0.35),
  },
};
