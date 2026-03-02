import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const songForm: RosettaConcept = {
  id: 'music-song-form',
  name: 'Song Form',
  domain: 'music',
  description:
    'Song form describes the macro-structure of a musical piece — the sequence of distinct ' +
    'sections. Binary form (AB): two contrasting sections, common in Baroque dances. Ternary ' +
    'form (ABA): departure and return, creating satisfying resolution — minuets, da capo arias. ' +
    'Verse-chorus form: alternating narrative verses with a repeated memorable chorus — the ' +
    'dominant structure of contemporary popular music; bridges provide contrast before the final ' +
    'chorus. AABA (32-bar): intro section repeated three times with a contrasting bridge (B), ' +
    'characteristic of jazz standards ("Autumn Leaves," "Over the Rainbow"). 12-bar blues: ' +
    'a harmonically fixed form (I-IV-I-V-IV-I in various versions) that provides a ' +
    'compositional scaffold for improvisation. Rondo form (ABACADA): alternating main theme ' +
    'with contrasting episodes, common in classical sonata finales. Through-composed form: each ' +
    'section is new (no repetition) — Wagner\'s leitmotif-driven music dramas, some art songs. ' +
    'Understanding form helps listeners follow music\'s logic and performers shape interpretation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-harmony',
      description: 'Form sections are distinguished by harmonic movement — cadences define section boundaries',
    },
    {
      type: 'analogy',
      targetId: 'music-chord-progressions',
      description: 'Chord progressions operate at the phrase level; form organizes those phrases into large-scale sections',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
