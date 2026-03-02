import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cognitiveBiases: RosettaConcept = {
  id: 'psych-cognitive-biases',
  name: 'Cognitive Biases and Heuristics',
  domain: 'psychology',
  description: 'Cognitive biases are systematic errors in thinking arising from mental shortcuts (heuristics) and motivational factors. ' +
    'Kahneman\'s System 1 and 2: fast, automatic, intuitive thinking vs. slow, deliberate, effortful thinking. Biases arise mostly from System 1. ' +
    'Availability heuristic: judging probability by how easily examples come to mind -- overweights recent/vivid events. ' +
    'Representativeness heuristic: judging probability by similarity to prototypes -- ignores base rates. ' +
    'Anchoring: initial information disproportionately influences subsequent judgments. ' +
    'Confirmation bias: seeking information that confirms existing beliefs and discounting disconfirming evidence. ' +
    'Dunning-Kruger effect: low-competence individuals overestimate their ability; high-competence individuals underestimate it. ' +
    'Sunk cost fallacy: continuing because of past investment rather than future value. ' +
    'Debiasing: awareness alone does little. Effective debiasing requires deliberate process changes -- checklists, statistical thinking, pre-mortems.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-social-cognition',
      description: 'Cognitive biases operate in social contexts -- attribution errors, stereotyping, and in-group favoritism are social manifestations of biased processing',
    },
    {
      type: 'cross-reference',
      targetId: 'log-critical-thinking-framework',
      description: 'Critical thinking is the practice of counteracting cognitive biases -- the framework exists because biases are so pervasive',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
