import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const growthMindset: RosettaConcept = {
  id: 'learn-growth-mindset',
  name: 'Growth Mindset',
  domain: 'learning',
  description:
    'Carol Dweck\'s mindset research distinguishes two core beliefs about intelligence and ability. ' +
    'Fixed mindset: intelligence is a fixed trait -- you either have it or you don\'t. ' +
    'Consequences: avoidance of challenge (might reveal limits), giving up when things get hard, ' +
    'seeing effort as evidence of low ability, ignoring negative feedback. ' +
    'Growth mindset: intelligence and ability develop through effort and learning. ' +
    'Consequences: embracing challenge (an opportunity to grow), persistence through difficulty, ' +
    'seeing effort as the path to mastery, using negative feedback as information. ' +
    'The intervention: praising effort and strategy rather than intelligence shifts children toward ' +
    'growth mindset. "You worked really hard on that" vs. "You\'re so smart." ' +
    'Nuance: growth mindset is not the belief that everyone can achieve anything regardless of effort -- ' +
    'it is the belief that your current level of ability is not your ceiling. ' +
    'False growth mindset: praising effort without linking it to strategy improvement.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'learn-metacognition',
      description: 'Growth mindset and metacognition both require self-awareness and honest assessment of current ability',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.64 + 0.09),
    angle: Math.atan2(0.3, 0.8),
  },
};
