import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const neuronsBrainStructure: RosettaConcept = {
  id: 'psych-neurons-brain-structure',
  name: 'Neurons and Brain Structure',
  domain: 'psychology',
  description: 'The brain is made of ~86 billion neurons connected by ~100 trillion synapses -- the physical substrate of all mental life. ' +
    'Neuron anatomy: cell body (soma), dendrites (receive signals), axon (transmits signals), axon terminals (release neurotransmitters). ' +
    'Action potential: an electrochemical signal travels down the axon when stimulation exceeds threshold (all-or-none). ' +
    'Neurotransmitters: chemical messengers crossing synaptic gaps -- dopamine (reward), serotonin (mood), GABA (inhibition), glutamate (excitation). ' +
    'Brain regions: cerebral cortex (higher cognition), limbic system (emotion, memory), cerebellum (motor coordination), brainstem (basic life functions). ' +
    'Prefrontal cortex: executive function, decision-making, impulse control -- fully developed ~25 years old. ' +
    'Hippocampus: critical for forming new declarative memories -- damaged in Alzheimer\'s first. ' +
    'Amygdala: emotional responses especially fear and threat detection -- hyperactive in anxiety disorders. ' +
    'Neural plasticity: the brain physically changes with experience -- synaptic connections strengthen or weaken with use.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-memory-consolidation',
      description: 'Memory consolidation occurs in specific brain structures -- hippocampus and amygdala are key substrates for declarative and emotional memory',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
