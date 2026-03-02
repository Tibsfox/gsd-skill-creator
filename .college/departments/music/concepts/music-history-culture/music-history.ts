import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const musicHistory: RosettaConcept = {
  id: 'music-music-history',
  name: 'Music History',
  domain: 'music',
  description:
    'Western classical music evolved through stylistic periods: ' +
    'Medieval (sacred polyphony, Gregorian chant, Hildegard von Bingen); ' +
    'Renaissance (word-painting, madrigals, Palestrina); ' +
    'Baroque (counterpoint, basso continuo, Bach, Handel, Vivaldi; 1600-1750); ' +
    'Classical (clarity, balance, Haydn, Mozart, early Beethoven; 1750-1820); ' +
    'Romantic (emotional expression, program music, Beethoven, Brahms, Wagner; 1820-1900); ' +
    'Modern (atonality, Schoenberg\'s 12-tone; Stravinsky\'s neoclassicism; 1900-present). ' +
    'African and African-American music created jazz (New Orleans, 1890s-1920s), blues ' +
    '(Mississippi Delta pentatonic tradition), gospel, R&B, and hip-hop -- the most globally ' +
    'influential music of the 20th century, born from the intersection of African musical ' +
    'traditions and the European harmonic system. ' +
    'World music traditions include Indian classical (ragas, talas), gamelan (Javanese/Balinese), ' +
    'maqam-based Arabic music, and West African drumming traditions.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'hist-modern-history',
      description: 'Musical periods reflect and respond to their historical and social contexts',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.09 + 0.36),
    angle: Math.atan2(0.6, 0.3),
  },
};
