import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Neutral Spine Alignment
 *
 * The concept of maintaining the spine's natural curves under load --
 * three curves (cervical lordosis, thoracic kyphosis, lumbar lordosis)
 * balanced in their neutral position. Directly relevant to desk posture.
 */
export const neutralSpineAlignment: RosettaConcept = {
  id: 'mb-pilates-neutral-spine',
  name: 'Neutral Spine Alignment',
  domain: 'mind-body',
  description:
    'Neutral spine alignment is the concept of maintaining the spine\'s three natural curves -- ' +
    'cervical lordosis (neck curves inward), thoracic kyphosis (upper back curves outward), ' +
    'and lumbar lordosis (lower back curves inward) -- in their balanced, natural position ' +
    'under load. This is not a flat back; it is a balanced back with gentle, natural curvature. ' +
    'In Pilates, neutral spine is the starting position for most exercises. When lying on the ' +
    'back, a small natural space exists between the lower back and the mat -- just enough to ' +
    'slide a hand through, but not enough to drive a truck through. The pelvis is neither ' +
    'tucked (posterior tilt) nor arched (anterior tilt). ' +
    'For programmers and desk workers, neutral spine awareness is directly relevant: prolonged ' +
    'sitting with poor posture produces forward head position, rounded shoulders, increased ' +
    'thoracic kyphosis, and either excessive lumbar flexion or extension. Pilates neutral spine ' +
    'training recalibrates postural awareness so that neutral becomes the default rather than ' +
    'slumped. ' +
    'The Pilates approach treats neutral spine not as a rigid position to be held but as a ' +
    'dynamic awareness -- the body moves through and returns to neutral, and the practitioner ' +
    'develops the proprioception to know where neutral is without visual feedback. ' +
    'Based on the Pilates Method Alliance (PMA) educational standards and modern rehabilitation ' +
    'science. Developed by Joseph Pilates as a foundational principle of Contrology.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'The Powerhouse muscles (transversus abdominis, multifidus, pelvic floor) actively maintain neutral spine under load',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-mountain-tadasana',
      description: 'Tadasana teaches neutral standing alignment that parallels the Pilates concept of neutral spine in supine positions',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-rehab-applications',
      description: 'Most rehabilitation applications of Pilates begin with establishing neutral spine awareness as the foundation for corrective exercise',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
