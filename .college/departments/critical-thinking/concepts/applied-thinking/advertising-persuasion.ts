import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const advertisingPersuasion: RosettaConcept = {
  id: 'crit-advertising-persuasion',
  name: 'Advertising & Persuasion Techniques',
  domain: 'critical-thinking',
  description:
    'Advertising uses a predictable toolkit: emotional appeals, social proof, scarcity, authority, reciprocity, ' +
    'and repetition. Recognizing these techniques does not make them ineffective — awareness is the first step ' +
    'toward intentional rather than reflexive responses. Analyzing advertisements builds general resistance to ' +
    'manipulation in political messaging, sales, and interpersonal persuasion as well.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'crit-appeal-to-authority',
      description: 'Celebrity endorsements and expert-claims in ads often exploit the appeal-to-authority fallacy',
    },
    {
      type: 'dependency',
      targetId: 'crit-media-literacy',
      description: 'Deconstructing advertising is a primary application of media literacy skills',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
