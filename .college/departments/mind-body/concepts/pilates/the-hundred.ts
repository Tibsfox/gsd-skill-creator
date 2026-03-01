import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * The Hundred
 *
 * The signature Pilates warm-up exercise -- 100 arm pumps coordinated
 * with breath, building core endurance and body heat.
 */
export const theHundred: RosettaConcept = {
  id: 'mb-pilates-the-hundred',
  name: 'The Hundred',
  domain: 'mind-body',
  description:
    'The Hundred is the signature Pilates warm-up exercise, combining core endurance with ' +
    'breath coordination. Lie on the back. Legs in tabletop (90-degree bend at hips and knees) ' +
    'or extended at 45 degrees for greater challenge. Curl head and shoulders off the mat, ' +
    'activating the Powerhouse. Arms extend alongside the body, hovering off the mat. ' +
    'Pump the arms vigorously up and down in a small 6-inch range. Inhale for 5 pumps, exhale ' +
    'for 5 pumps. Repeat 10 times for a total of 100 pumps. ' +
    'The Hundred builds core endurance, trains breath coordination under muscular effort, and ' +
    'generates body heat to prepare for the exercises that follow. The name itself is the ' +
    'prescription -- the exercise is complete when 100 pumps are done. ' +
    'Beginner modification: feet remain on the floor with knees bent; head stays down on the ' +
    'mat to reduce neck strain. Progression: extend legs lower toward the floor (increases ' +
    'abdominal demand). Maintain neutral spine throughout -- do not let the lower back arch ' +
    'away from the mat. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'The Hundred requires sustained Powerhouse activation throughout all 100 pumps',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-neutral-spine',
      description: 'Maintaining neutral spine alignment during The Hundred prevents lower back strain',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(0.2, 0.7),
  },
};
