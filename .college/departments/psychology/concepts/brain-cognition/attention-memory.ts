import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const attentionMemory: RosettaConcept = {
  id: 'psych-attention-memory',
  name: 'Attention and Cognitive Control',
  domain: 'psychology',
  description: 'Attention is the gatekeeper of consciousness -- what you attend to determines what you perceive, encode, and act on. ' +
    'Selective attention: focusing on one stimulus while filtering others (cocktail party effect, Stroop task). ' +
    'Divided attention: performing two or more tasks simultaneously. True multitasking is largely a myth -- what occurs is rapid task-switching. ' +
    'Task-switching cost: switching between tasks takes time and reduces performance on both -- continuous partial attention is less efficient than focused work. ' +
    'Inhibitory control: suppressing automatic responses that are inappropriate -- the ability to pause before acting. ' +
    'Attentional blink: after detecting one target in a rapid stream, you miss a second target in the following ~500ms window. ' +
    'Inattentional blindness: failing to see unexpected objects when attention is focused elsewhere (gorilla experiment). ' +
    'Sustained attention (vigilance): the ability to maintain focused attention over extended periods -- degrades after ~20 minutes without breaks. ' +
    'Flow state: optimal engagement where challenge matches skill -- associated with effortless attention and high performance.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-neurons-brain-structure',
      description: 'Attention is mediated by prefrontal cortex and parietal regions -- it is a physical brain process',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-memory-consolidation',
      description: 'Attention determines what gets encoded -- you cannot form a strong memory for something you did not attend to',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
