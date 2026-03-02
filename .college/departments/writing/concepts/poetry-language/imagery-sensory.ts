import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const imagerySensory: RosettaConcept = {
  id: 'writ-imagery-sensory',
  name: 'Imagery & Sensory Detail',
  domain: 'writing',
  description: 'Imagery appeals to the five senses to create vivid experience in the reader\'s imagination. ' +
    'Visual: color, light, shadow, shape, movement. ' +
    'Auditory: sound, silence, rhythm, tone. ' +
    'Tactile: texture, temperature, pressure. ' +
    'Olfactory: smell -- the most powerful sense for triggering memory (Proust\'s madeleine). ' +
    'Gustatory: taste -- rare, but highly evocative. ' +
    'The principle: concrete details are more powerful than abstractions. ' +
    '"Grief" is abstract. "He drove to work in her car and the vanilla air freshener hit him like a wall" is concrete. ' +
    'The writing teacher\'s mantra: show, don\'t tell. ' +
    'Synesthesia: cross-sense imagery ("loud colors," "bitter cold") creates unexpected freshness.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-perception-construction',
      description: 'Imagery works because the brain processes vivid description similarly to actual sensory experience',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
