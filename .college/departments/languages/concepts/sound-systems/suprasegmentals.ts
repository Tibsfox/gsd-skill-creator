import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const suprasegmentals: RosettaConcept = {
  id: 'lang-suprasegmentals',
  name: 'Suprasegmental Features',
  domain: 'languages',
  description: 'Suprasegmentals are prosodic features that span multiple segments (syllables, words, sentences). ' +
    'Tone: in tonal languages (Mandarin: 4 tones, Vietnamese: 6, Yoruba: 3), pitch determines lexical meaning. ' +
    'The same syllable "ma" means mother/hemp/horse/scold in Mandarin depending on tone. ' +
    'Stress: emphasis on particular syllables (English: REcord vs. reCORD). ' +
    'Intonation: the melody of a sentence -- rising (question in English), falling (declarative). ' +
    'Rhythm: stress-timed (English: stressed syllables equally spaced) vs. syllable-timed (French: all syllables equal). ' +
    'Suprasegmentals often determine intelligibility more than individual phoneme accuracy -- ' +
    'a foreign accent is mostly mismatched suprasegmentals.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-phoneme-inventory',
      description: 'Segmental phonemes and suprasegmental features together constitute a language\'s sound system',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-dialogue-pacing',
      description: 'Pacing in written dialogue tries to represent spoken prosody -- rhythm and intonation translate to punctuation and sentence length',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.2025 + 0.4225),
    angle: Math.atan2(0.65, 0.45),
  },
};
