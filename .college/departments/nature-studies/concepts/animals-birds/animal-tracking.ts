import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const animalTracking: RosettaConcept = {
  id: 'nature-animal-tracking',
  name: 'Animal Tracking',
  domain: 'nature-studies',
  description:
    'Animal tracking reads the signs left by animals in the landscape: tracks (footprints), ' +
    'scat (droppings), runs (trails), dens, browse (plant feeding signs), and hair or feathers. ' +
    'Track identification begins with track patterns: walkers (diagonal) vs. bounders (synchronous) ' +
    'vs. waddlers (wide-bodied gait). Canine tracks (symmetric, claw-visible) vs. feline ' +
    '(asymmetric, claw-retracted) are the first distinction. Track aging: a fresh track in mud ' +
    'is crisp-edged; an old track shows degraded edges and weathering. Scat identification ' +
    'reveals diet: twisted scat with hair = carnivore; berry-filled = omnivore in berry season. ' +
    'Tom Brown Jr.\'s tracking curriculum and the Tracker School tradition formalize indigenous ' +
    'tracking knowledge. Master trackers can reconstruct an animal\'s full behavioral sequence ' +
    'from the story written in the snow.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-outdoor-observation',
      description: 'Animal tracking is a specialized form of outdoor observation requiring developed attention',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
