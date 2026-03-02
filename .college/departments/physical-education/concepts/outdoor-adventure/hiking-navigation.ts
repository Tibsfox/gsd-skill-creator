import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hikingNavigation: RosettaConcept = {
  id: 'pe-hiking-navigation',
  name: 'Hiking & Navigation',
  domain: 'physical-education',
  description:
    'Trail navigation combines physical endurance with wayfinding skills. Map reading requires ' +
    'understanding topographic contour lines (closer lines = steeper terrain), map scale, and ' +
    'symbols. Compass use: orient the map by aligning the compass needle with north; take a bearing ' +
    'by pointing the direction-of-travel arrow at a landmark and reading the azimuth; follow the ' +
    'bearing by keeping the needle in the orienting arrow. GPS devices and smartphone apps are ' +
    'reliable supplements but not replacements for paper map and compass (battery failure, signal ' +
    'loss). Trail assessment involves reading difficulty ratings, elevation profiles, and water ' +
    'source locations for trip planning. Pace counting estimates distance: count double-steps to ' +
    'calibrate personal pace (typically 60-65 double-paces per 100 m). The "Rule of Threes": ' +
    'humans can survive 3 hours in harsh weather, 3 days without water, 3 weeks without food — ' +
    'used to prioritize shelter, water, food in emergency situations.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-outdoor-safety',
      description: 'Navigation skills are essential for outdoor safety — knowing where you are prevents becoming lost',
    },
    {
      type: 'cross-reference',
      targetId: 'nature-outdoor-observation',
      description: 'Hiking creates opportunities for systematic outdoor observation and nature study',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
