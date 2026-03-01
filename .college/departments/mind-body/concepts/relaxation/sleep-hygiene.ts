import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Sleep Hygiene -- Practical Recovery Knowledge
 *
 * Evidence-informed practical guidelines for sleep quality, covering
 * environmental factors, behavioral habits, and wind-down routines.
 * Presented as practical knowledge, not medical advice.
 *
 * Evidence basis: American Academy of Sleep Medicine (AASM) and CDC
 * guidelines on sleep hygiene practices. Research supports these
 * behavioral approaches for general sleep quality improvement.
 *
 * @module departments/mind-body/concepts/relaxation/sleep-hygiene
 */

export const sleepHygiene: RosettaConcept = {
  id: 'mb-relax-sleep-hygiene',
  name: 'Sleep Hygiene',
  domain: 'mind-body',
  description:
    'Practical, non-medical guidelines for improving sleep quality through behavioral and ' +
    'environmental adjustments. Key factors include: blue light exposure (screens emit ' +
    'short-wavelength light that suppresses melatonin production -- reducing screen use ' +
    '60-90 minutes before bed supports the natural sleep-wake cycle), temperature (a ' +
    'slightly cool room, around 65-68F/18-20C, facilitates the core body temperature ' +
    'drop that initiates sleep), caffeine timing (caffeine has a half-life of approximately ' +
    '5-6 hours -- afternoon consumption can measurably affect sleep onset and quality), ' +
    'consistent schedule (going to bed and waking at consistent times reinforces circadian ' +
    'rhythm, even on weekends), and wind-down routines (a consistent pre-sleep sequence -- ' +
    'such as light stretching, reading, or PMR -- signals the nervous system to transition ' +
    'toward rest). These are practical knowledge points drawn from AASM and CDC guidelines, ' +
    'not medical treatment recommendations. Sleep difficulties that persist despite good ' +
    'sleep hygiene may indicate conditions requiring professional evaluation. Individuals ' +
    'should consult healthcare providers for persistent sleep concerns rather than relying ' +
    'on self-help strategies alone.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-relax-pmr',
      description:
        'Progressive muscle relaxation is an effective wind-down technique for sleep preparation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-relax-nervous-system',
      description:
        'Good sleep hygiene supports the transition from sympathetic to parasympathetic dominance needed for restful sleep',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-relax-yoga-nidra',
      description:
        'Yoga nidra practiced before bed can serve as a deep wind-down routine',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description:
        'Extended-exhale breathing (4 counts in, 8 counts out) activates parasympathetic response as part of a sleep routine',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: -0.4,
    magnitude: Math.sqrt(0.64 + 0.16),
    angle: Math.atan2(-0.4, 0.8),
  },
};
