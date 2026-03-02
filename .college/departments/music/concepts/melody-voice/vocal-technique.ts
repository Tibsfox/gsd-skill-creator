import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const vocalTechnique: RosettaConcept = {
  id: 'music-vocal-technique',
  name: 'Vocal Technique',
  domain: 'music',
  description:
    'Vocal technique is the systematic training of the singing voice for control, power, and ' +
    'health. Breath support is foundational: inhalation expands the ribcage and lowers the ' +
    'diaphragm; phonation is powered by controlled exhalation pressure rather than throat tension. ' +
    'Chest voice (modal register) vs. head voice (falsetto register) — the "passaggio" (register ' +
    'transition zone) requires careful management to avoid breaks. Resonance placement: vowels ' +
    'carry the tone; consonants articulate it. Forward resonance (mask placement, Italian "voce ' +
    'in maschera") produces a bright, projecting tone. Diction: clear consonants begin and end ' +
    'phrases without stopping the tone; British vs. International Phonetic Alphabet standards ' +
    'for classical and choral music. Vocal health: adequate hydration (the voice needs 8-10 ' +
    'glasses of water daily), vocal rest after heavy use, avoiding shouting and excessive ' +
    'throat-clearing, and warming up before performance. Voice types: soprano, mezzo-soprano, ' +
    'alto (female); tenor, baritone, bass (male) — determined by range, timbre, and tessitura.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'music-melodic-contour',
      description: 'Vocal technique is the instrument-specific application for performing the melodic contour of a musical phrase',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-diaphragmatic-breathing',
      description: 'Diaphragmatic breathing is the physiological foundation of both vocal technique and mind-body breathing practices',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
