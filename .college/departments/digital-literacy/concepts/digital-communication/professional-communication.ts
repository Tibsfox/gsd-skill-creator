import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const professionalCommunication: RosettaConcept = {
  id: 'diglit-professional-communication',
  name: 'Professional Digital Communication',
  domain: 'digital-literacy',
  description: 'Effective professional communication in digital contexts. ' +
    'Email: subject line is the headline (specific, not generic), ' +
    'lead with the ask or main point (people skim), ' +
    'one topic per email, action items clearly stated. ' +
    'Tone calibration: digital text lacks vocal tone and facial expression -- ' +
    'explicit cues prevent misreading (period at end of casual message can read as cold). ' +
    'Appropriate medium: quick question = Slack/chat, nuanced discussion = video or in-person. ' +
    'Reply time norms differ by context: email (24 hours), Slack (same business day). ' +
    'Thread management: reply-all sparingly, know when to move to a call, ' +
    'summarize long threads when adding new participants.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'writ-voice-development',
      description: 'Professional digital communication requires the same intentional voice development as creative writing',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-formality-register',
      description: 'Register and formality in digital communication mirror the linguistic register distinctions in language learning',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
