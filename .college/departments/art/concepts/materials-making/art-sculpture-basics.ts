import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const artSculptureBasics: RosettaConcept = {
  id: 'art-sculpture-basics',
  name: 'Sculpture Basics',
  domain: 'art',
  description:
    'Sculpture works in three dimensions through four fundamental processes: carving (subtractive — ' +
    'removing material from stone, wood, or foam), modeling (additive — building up clay, wax, or ' +
    'plaster), casting (pouring liquid material into a mold), and construction (assembling found or ' +
    'fabricated components). Each process has distinct material properties: clay is forgiving and ' +
    'reworkable; stone is unforgiving and requires planning from the outset; welded metal allows ' +
    'large-scale structural work. Surface considerations include texture (smooth, rough, perforated), ' +
    'patina (chemical surface treatments for metals), and finish (burnished, painted, raw). ' +
    'Sculptors must also consider negative space — the volumes around and between solid forms — ' +
    'which is as compositionally significant as the material itself.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-painting-media',
      description: 'Understanding material properties in painting (viscosity, surface, transparency) transfers to understanding sculptural materials',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
