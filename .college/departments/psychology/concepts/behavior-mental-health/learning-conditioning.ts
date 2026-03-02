import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const learningConditioning: RosettaConcept = {
  id: 'psych-learning-conditioning',
  name: 'Learning and Conditioning',
  domain: 'psychology',
  description: 'Behaviorism revealed fundamental learning mechanisms that operate across species -- classical and operant conditioning. ' +
    'Classical conditioning (Pavlov): a neutral stimulus paired with an unconditioned stimulus comes to elicit the conditioned response. ' +
    'Extinction, generalization, and discrimination: conditioned responses fade without reinforcement, generalize to similar stimuli, discriminate between them. ' +
    'Operant conditioning (Skinner): behavior is shaped by its consequences. Reinforcement increases behavior; punishment decreases it. ' +
    'Schedules of reinforcement: continuous reinforcement enables fast learning; variable ratio schedules (slot machines) produce the most persistent behavior. ' +
    'Observational learning (Bandura): learning from observing others -- Bobo doll experiments showed children imitate aggressive behavior. ' +
    'Cognitive factors in learning: expectations, beliefs, and mental representations mediate learning -- pure behaviorism missed this. ' +
    'Skill acquisition stages (Fitts & Posner): cognitive (declarative, effortful) → associative (reducing errors) → autonomous (automatic). ' +
    'Deliberate practice: focused practice with immediate feedback in the zone of proximal development -- the driver of expertise.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-memory-consolidation',
      description: 'Learning and memory are two sides of the same coin -- conditioning depends on memory formation to change behavior',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-motivation-needs',
      description: 'Reinforcement schedules work through motivation -- they shape what behaviors are intrinsically and extrinsically motivating',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
