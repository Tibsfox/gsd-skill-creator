import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const soundDevices: RosettaConcept = {
  id: 'writ-sound-devices',
  name: 'Sound Devices & Rhythm',
  domain: 'writing',
  description: 'Language has sonic texture beyond its meaning. ' +
    'Alliteration: repetition of consonant sounds at word beginnings ("Peter Piper picked"). ' +
    'Assonance: repetition of vowel sounds within words ("the rain in Spain stays mainly in the plain"). ' +
    'Consonance: repetition of consonant sounds within or at the ends of words. ' +
    'Rhyme: end rhyme (line endings), internal rhyme (within lines), slant rhyme (near rhyme). ' +
    'Onomatopoeia: words that sound like what they describe (buzz, crash, whisper). ' +
    'Meter: the rhythmic pattern of stressed and unstressed syllables. ' +
    'Iambic pentameter: da-DUM da-DUM da-DUM da-DUM da-DUM (Shakespeare\'s default). ' +
    'Caesura: a pause in the middle of a line that creates tension or breath.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-poetry-forms',
      description: 'Formal poetry is defined by its meter -- sound devices are the material of poetic form',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-phoneme-inventory',
      description: 'Alliteration and consonance are built from phoneme patterns -- the same phonetic awareness applies',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
