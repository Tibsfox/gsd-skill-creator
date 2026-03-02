import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const musicalPeriods: RosettaConcept = {
  id: 'music-musical-periods',
  name: 'Musical Periods',
  domain: 'music',
  description:
    'Western art music is conventionally divided into historical periods by shared stylistic ' +
    'characteristics. Baroque (1600-1750): ornate counterpoint, figured bass, affect doctrine, ' +
    'key composers Bach, Handel, Vivaldi. Classical (1750-1820): clarity, balance, sonata form, ' +
    'Viennese school (Haydn, Mozart, early Beethoven). Romantic (1820-1900): expression of ' +
    'individual feeling, programmatic music, expanded orchestra, chromatic harmony (Beethoven, ' +
    'Brahms, Wagner, Tchaikovsky, Debussy). Twentieth Century: fragmentation into multiple ' +
    'simultaneous movements — serialism (Schoenberg, 12-tone), neoclassicism (Stravinsky), ' +
    'nationalism (Bartók), jazz-influenced (Gershwin), minimalism (Reich, Glass), spectralism. ' +
    'Contemporary: postmodernism, neo-romanticism, electronic/acoustic hybrids, world music ' +
    'fusion. Period knowledge provides interpretive context: playing Bach with Romantic ' +
    'expressivity misrepresents the stylistic norms of the original context. Period-appropriate ' +
    'performance practice (Historically Informed Performance/HIP) attempts to recover original ' +
    'instruments, tuning, and conventions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-history',
      description: 'Musical period analysis deepens the music history overview with stylistic and compositional detail for each era',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
