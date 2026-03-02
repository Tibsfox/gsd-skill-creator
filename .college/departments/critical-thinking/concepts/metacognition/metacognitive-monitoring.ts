import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const metacognitiveMonitoring: RosettaConcept = {
  id: 'crit-metacognitive-monitoring',
  name: 'Metacognitive Monitoring',
  domain: 'critical-thinking',
  description:
    'Metacognitive monitoring is the real-time process of tracking one\'s own understanding while thinking or learning. ' +
    'It includes noticing when comprehension breaks down, recognizing when an argument feels too easy to accept, ' +
    'and distinguishing "I can recite this" from "I truly understand this." ' +
    'High monitors catch their own errors before they propagate; low monitors confidently proceed on faulty premises.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'crit-claims-facts-opinions',
      description: 'Monitoring requires distinguishing whether a current belief is a fact or an opinion',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.09 + 0.7225),
    angle: Math.atan2(0.85, 0.3),
  },
};
