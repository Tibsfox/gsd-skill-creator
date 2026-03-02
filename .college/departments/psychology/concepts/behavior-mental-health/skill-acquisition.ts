import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const skillAcquisition: RosettaConcept = {
  id: 'psych-skill-acquisition',
  name: 'Skill Acquisition and Expertise',
  domain: 'psychology',
  description: 'Expertise is acquired through practice -- but not all practice is equal. Understanding skill acquisition enables more effective learning. ' +
    'Fitts & Posner stages: cognitive (understanding the task), associative (reducing errors through practice), autonomous (automatic execution). ' +
    'Automaticity: with sufficient practice, skills become automatic, freeing working memory for higher-level processing. ' +
    'Deliberate practice (Ericsson): focused practice with clear goals, immediate feedback, and working at the edge of current ability -- not mere repetition. ' +
    '10,000 hour rule (Gladwell): a popularization of Ericsson\'s research -- the claim is contested, as quality of practice matters more than quantity. ' +
    'Transfer: learning in one context transfers to another -- specific transfer (similar tasks) vs. far transfer (different domains, harder to achieve). ' +
    'Mental representations: experts develop rich, interconnected mental models -- chunking lets them process more information at once. ' +
    'Regression under pressure: stress can cause experts to revert to conscious, deliberate control, disrupting automatic execution (yips, choking).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-learning-conditioning',
      description: 'Skill acquisition builds on basic conditioning principles -- operant conditioning shapes skill through feedback and reinforcement',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-fluency-accuracy',
      description: 'Language fluency follows the same skill acquisition stages -- declarative grammar knowledge becomes automatic through practice',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
