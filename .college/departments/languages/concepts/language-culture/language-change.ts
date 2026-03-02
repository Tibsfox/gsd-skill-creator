import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const languageChange: RosettaConcept = {
  id: 'lang-language-change',
  name: 'Language Change and Language Families',
  domain: 'languages',
  description: 'All living languages change over time -- no language is static. Understanding change illuminates how languages are related. ' +
    'Language families: languages descended from a common ancestor. Indo-European includes English, Spanish, Hindi, Persian, and 450+ others. ' +
    'Comparative method: by comparing cognates (etymologically related words), linguists reconstruct proto-languages. ' +
    'Sound change: regular, systematic, predictable shifts (Grimm\'s Law: Proto-IE /p/ → Germanic /f/ -- "pater" → "father"). ' +
    'Semantic change: words shift meaning over time ("nice" once meant "foolish"; "awful" once meant "inspiring awe"). ' +
    'Borrowing: languages adopt words from other languages -- English is ~60% Latin/French vocabulary. ' +
    'Language death vs. revival: ~40% of world\'s languages are endangered. Hebrew was revived as a modern vernacular -- a rare success. ' +
    'Creoles and pidgins: new languages emerge from contact between speakers of mutually unintelligible languages.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'writ-historical-context',
      description: 'Historical context for literature includes the language of the period -- texts in older English require understanding language change',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-morphology',
      description: 'Morphological patterns reveal language family membership -- cognate morphemes across related languages show common origin',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.2025 + 0.4225),
    angle: Math.atan2(0.65, 0.45),
  },
};
