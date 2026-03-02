import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const pronunciationPractice: RosettaConcept = {
  id: 'lang-pronunciation-practice',
  name: 'Pronunciation Practice and Accent',
  domain: 'languages',
  description: 'Pronunciation encompasses individual sounds, stress patterns, intonation, rhythm, and connected speech. ' +
    'Minimal pair drills: focused production practice on sound contrasts (ship/sheep, bat/bad/ban). ' +
    'Shadowing: mirroring native speaker audio in real time -- activates prosody (rhythm, intonation) not just segments. ' +
    'Delayed auditory feedback (DAF): slowing audio playback aids attention to pronunciation details. ' +
    'Intelligibility vs. accent: the goal is to be understood, not to sound like a native. Accent does not impede communication if stress and intonation are natural. ' +
    'Critical period effects: after puberty, acquiring a phonologically native-like accent becomes much harder (though not impossible). ' +
    'Negative transfer: L1 phonological patterns intrude on L2 production (Spanish speakers add /e/ before English clusters like "sp-", "st-"). ' +
    'Motor learning: pronunciation is physical -- the tongue, lips, and velum must learn new positions. Physical practice matters. ' +
    'Recording yourself: most learners have a mismatch between perceived and actual pronunciation -- recording reveals the gap.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-ear-training',
      description: 'You can only reliably produce sounds you can perceive -- ear training precedes or accompanies pronunciation practice',
    },
    {
      type: 'dependency',
      targetId: 'lang-ipa-notation',
      description: 'IPA provides precise articulatory targets for pronunciation practice -- knowing symbols enables self-directed work',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
