import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ipaNotation: RosettaConcept = {
  id: 'lang-ipa-notation',
  name: 'International Phonetic Alphabet',
  domain: 'languages',
  description: 'The IPA is a standardized notation system for transcribing the sounds of any language. ' +
    'Every symbol represents exactly one sound, and every sound has exactly one symbol. ' +
    'Consonant chart organized by: place of articulation (where in the mouth) and manner (how airflow is shaped). ' +
    'Vowel chart: height (high/low) and backness (front/back) of tongue position. ' +
    'English /ð/ (voiced "th" in "the"), /θ/ (voiceless "th" in "think") -- two sounds, two symbols. ' +
    'Diacritics: symbols added to base letters for aspiration, nasalization, length. ' +
    'Practical use: look up any word in a dictionary\'s IPA transcription to know exactly how to pronounce it. ' +
    'Language learning superpower: learning 50 IPA symbols unlocks pronunciation of any language.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-phoneme-inventory',
      description: 'IPA is the tool for describing phoneme inventories -- you need both together',
    },
    {
      type: 'cross-reference',
      targetId: 'code-syntax-style',
      description: 'IPA notation is a formal grammar for sounds -- like programming syntax, one symbol maps to exactly one meaning',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
