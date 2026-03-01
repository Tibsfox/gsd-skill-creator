import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Autonomic Nervous System -- Sympathetic and Parasympathetic
 *
 * Accessible explanation of the two branches of the autonomic nervous
 * system and how relaxation techniques activate the parasympathetic
 * response. Grounded in physiology, not speculation.
 *
 * Evidence basis: Standard physiology (Guyton & Hall, Principles of
 * Neural Science). Vagal stimulation pathways are well-established
 * in clinical literature.
 *
 * @module departments/mind-body/concepts/relaxation/nervous-system
 */

export const nervousSystem: RosettaConcept = {
  id: 'mb-relax-nervous-system',
  name: 'Autonomic Nervous System',
  domain: 'mind-body',
  description:
    'The autonomic nervous system operates in two primary modes that regulate involuntary ' +
    'body functions. The sympathetic branch activates the "fight or flight" response: ' +
    'raising heart rate, dilating pupils, increasing adrenaline production, and redirecting ' +
    'blood flow to muscles -- preparing the body for action. The parasympathetic branch ' +
    'activates the "rest and digest" response: lowering heart rate, promoting digestion, ' +
    'enabling tissue repair, and facilitating recovery. These two branches work in dynamic ' +
    'balance, but modern lifestyles -- constant notifications, sedentary work, chronic stress, ' +
    'insufficient sleep -- can create sympathetic dominance, where the body remains in a ' +
    'low-grade stress state even without acute threat. Every relaxation technique in this ' +
    'module works by activating the parasympathetic branch, primarily through vagal ' +
    'stimulation. The vagus nerve -- the longest cranial nerve, running from brainstem to ' +
    'abdomen -- is stimulated by: slow breathing (especially extended exhales, where the ' +
    'exhale is longer than the inhale), gentle sustained pressure on the abdomen, the ' +
    'diving reflex (cool water on the face), and sustained relaxation of skeletal muscles. ' +
    'Understanding this mechanism demystifies relaxation practice: these techniques work ' +
    'through specific physiological pathways, not through vague notions of "calming down." ' +
    'This is a simplified overview of autonomic nervous system function for practical ' +
    'understanding -- the full neuroscience involves additional complexity including the ' +
    'enteric nervous system and polyvagal theory.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-relax-pmr',
      description:
        'PMR activates the parasympathetic response through systematic skeletal muscle relaxation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-relax-yoga-nidra',
      description:
        'Yoga nidra produces deep parasympathetic activation through guided progressive relaxation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description:
        'Extended-exhale breathing directly stimulates the vagus nerve, activating the parasympathetic branch',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-mindfulness',
      description:
        'Meditation practices shift autonomic balance toward parasympathetic dominance over time',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-relax-sleep-hygiene',
      description:
        'Sleep requires parasympathetic dominance -- sleep hygiene practices support this autonomic transition',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, 0.4),
  },
};
