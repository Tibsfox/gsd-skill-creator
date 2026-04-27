/**
 * Concept registry entry for MUS 1.62 — Album-as-thesis closure form.
 * Used by tests/scoring/mus-score.test.ts to validate criterion 8.
 */
export const conceptAlbumAsThesis = {
  id: 'mus-1.62-album-as-thesis-closure-form',
  name: 'Album-as-thesis closure form',
  domain: 'form',
  prerequisites: ['cadence', 'song-cycle'],
  description: 'Two-album catalog as a complete formal statement.',
  exemplars: {
    s36Artist: 'Grand Archives',
    s36Work: 'Keep In Mind Frankenstein (2009)',
    spsSpecies: 'Pileated Woodpecker',
    spsAcousticFeature: 'territorial laughing call',
  },
  reference: 'Schubert, Winterreise D.911 (1827)',
  musDegree: '1.62',
};
