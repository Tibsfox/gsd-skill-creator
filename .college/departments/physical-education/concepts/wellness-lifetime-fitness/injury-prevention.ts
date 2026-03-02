import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const injuryPrevention: RosettaConcept = {
  id: 'pe-injury-prevention',
  name: 'Injury Prevention',
  domain: 'physical-education',
  description:
    'Injury prevention in physical activity combines proper technique, progressive training ' +
    'loads, adequate recovery, and mobility work. Common overuse injuries result from too much, ' +
    'too soon, too fast: the 10% rule limits weekly mileage or load increases to 10%. ' +
    'RICE protocol for acute injuries: Rest, Ice (15-20 min, not direct), Compression, Elevation. ' +
    'Dynamic warm-up activates the neuromuscular system through sport-specific movements -- ' +
    'more effective than static stretching pre-activity for injury prevention. ' +
    'Static stretching (hold 30-60 seconds) is appropriate post-activity when muscles are warm. ' +
    'Proprioception (body position sense) training reduces ankle sprain risk significantly. ' +
    'Sleep deprivation increases injury risk: athletes sleeping under 8 hours have 1.7x injury rate. ' +
    'Red flags requiring medical evaluation: pain that changes gait, joint swelling, ' +
    'pain at rest, weakness after impact.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-progressive-muscle-relaxation',
      description: 'PMR supports recovery and nervous system regulation after physical training',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-sun-salutation',
      description: 'Yoga sequences support flexibility and injury prevention in physical training',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
