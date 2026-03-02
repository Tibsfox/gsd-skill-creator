import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const worldMusic: RosettaConcept = {
  id: 'music-world-music',
  name: 'World Music',
  domain: 'music',
  description:
    'World music encompasses the enormous diversity of musical traditions outside the Western ' +
    'classical and popular mainstream. Indian classical music: two streams (Hindustani in the ' +
    'north, Carnatic in the south); raga (melodic framework with characteristic ascending and ' +
    'descending patterns and emotional associations) and tala (rhythmic cycle); improvisation ' +
    'within strict constraints. Arabic maqam system: melodic modes with microtonal intervals ' +
    '(quarter-tones) outside Western equal temperament. West African music: dense polyrhythmic ' +
    'drumming with interlocking patterns and master drummer improvisation over a rhythmic ' +
    'foundation; call-and-response vocal structure. Gamelan (Indonesia): tuned bronze ' +
    'percussion orchestra with colotomic (time-marking) structure and multiple simultaneous ' +
    'tempos. Latin American music: African-European-indigenous fusion producing cumbia, son ' +
    'cubano, bossa nova, tango — each with distinct rhythmic conventions. World music engagement ' +
    'requires cultural sensitivity: extracting rhythmic patterns or scales from context without ' +
    'acknowledging origin is cultural appropriation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-history',
      description: 'World music traditions have their own histories, theory systems, and contexts that parallel and interact with Western music history',
    },
    {
      type: 'analogy',
      targetId: 'music-musical-periods',
      description: 'Both world music and Western musical periods demonstrate how music reflects and encodes cultural context and values',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.2025 + 0.3025),
    angle: Math.atan2(0.55, 0.45),
  },
};
