import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const natureJournaling: RosettaConcept = {
  id: 'nature-nature-journaling',
  name: 'Nature Journaling',
  domain: 'nature-studies',
  description:
    'The nature journal is the central tool of the naturalist: a combination of scientific ' +
    'observation, artistic sketch, written reflection, and measurement log. Unlike a diary, ' +
    'the nature journal focuses outward -- on what is actually observed rather than feelings ' +
    'about it. Effective entries include: date, time, location, weather conditions, ' +
    'sketches with labels, measurements, behavioral observations, and questions that ' +
    'arose during observation. John Muir Laws\' framework: "I notice..." (observation), ' +
    '"I wonder..." (question), "It reminds me of..." (connection). Scientific illustrators ' +
    'from Darwin\'s era kept detailed journals that contributed to natural history knowledge. ' +
    'The journal\'s power: it slows you down, forces attention, and creates a personal record ' +
    'of seasonal change that reveals patterns invisible to casual observation.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'art-observational-drawing',
      description: 'Nature journaling applies observational drawing skills to natural history documentation',
    },
    {
      type: 'dependency',
      targetId: 'nature-outdoor-observation',
      description: 'Nature journaling is the systematic record of outdoor observation practice',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.25 + 0.04),
    angle: Math.atan2(0.2, 0.5),
  },
};
