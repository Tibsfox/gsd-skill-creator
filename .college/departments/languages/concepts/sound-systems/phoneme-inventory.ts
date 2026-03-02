import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const phonemeInventory: RosettaConcept = {
  id: 'lang-phoneme-inventory',
  name: 'Phoneme Inventories',
  domain: 'languages',
  description: 'A phoneme is the smallest sound unit that distinguishes meaning in a language. ' +
    'English has ~44 phonemes despite only 26 letters -- spelling and sound diverge significantly. ' +
    'Phoneme inventories vary dramatically: Hawaiian has only 13, some languages have 80+. ' +
    'Allophones: variants of the same phoneme that do not change meaning (aspirated vs. unaspirated /p/). ' +
    'Minimal pairs: words differing in only one phoneme (bit/pit, tip/dip) demonstrate phoneme contrasts. ' +
    'Language-specific blind spots: sounds that do not exist in your native language are hard to perceive. ' +
    'Japanese speakers often do not distinguish English /r/ and /l/ because Japanese has one phoneme where English has two. ' +
    'The critical period: before puberty, the brain is most flexible for acquiring new phoneme contrasts.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-ipa-notation',
      description: 'IPA provides the notation system for describing phoneme inventories across all languages',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-sound-devices',
      description: 'Alliteration and consonance are phoneme-level patterns -- literary sound devices operate on the same units',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
