import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Progressive Muscle Relaxation (PMR)
 *
 * A systematic technique of alternately tensing and releasing muscle groups
 * to produce deep relaxation. Developed by Dr. Edmund Jacobson in the 1920s,
 * standardized by Bernstein & Borkovec (1973) for clinical use.
 *
 * Evidence basis: Rated effective for chronic insomnia by the American Academy
 * of Sleep Medicine. Demonstrated efficacy for anxiety, tension headaches,
 * TMJ, neck pain, and high blood pressure.
 *
 * @module departments/mind-body/concepts/relaxation/progressive-muscle-relaxation
 */

export const progressiveMuscleRelaxation: RosettaConcept = {
  id: 'mb-relax-pmr',
  name: 'Progressive Muscle Relaxation (PMR)',
  domain: 'mind-body',
  description:
    'A systematic relaxation technique developed by Dr. Edmund Jacobson in the 1920s, ' +
    'based on the principle that you cannot relax what you cannot feel. The method ' +
    'involves sequentially tensing each muscle group for approximately 5 seconds, then ' +
    'releasing instantly and noticing the contrast between tension and relaxation for ' +
    '10-15 seconds before moving to the next group. The standard protocol works through ' +
    '16 muscle groups from hands and forearms to calves, synchronized with breathing: ' +
    'inhale while tensing, exhale while releasing. Jacobson\'s original method (published ' +
    '1938) was lengthy; the shortened version by Wolpe (1958) and standardized by ' +
    'Bernstein & Borkovec (1973) is the form used in clinical practice today. PMR is ' +
    'rated an effective nonpharmacologic treatment of chronic insomnia by the American ' +
    'Academy of Sleep Medicine, with demonstrated efficacy for anxiety, tension headaches, ' +
    'migraines, TMJ, neck pain, and high blood pressure. A full sequence takes 15-20 ' +
    'minutes; with practice, abbreviated versions become effective in 5-10 minutes. ' +
    'The technique activates the parasympathetic nervous system through sustained ' +
    'skeletal muscle relaxation. This is a simplified presentation of a well-researched ' +
    'clinical technique -- practitioners seeking therapeutic application should consult ' +
    'qualified professionals.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-relax-nervous-system',
      description:
        'PMR activates the parasympathetic nervous system through sustained skeletal muscle relaxation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description:
        'PMR synchronizes with diaphragmatic breathing -- inhale while tensing, exhale while releasing',
    },
    {
      type: 'analogy',
      targetId: 'mb-med-body-scan',
      description:
        'Both PMR and body scan systematically move attention through the body, but PMR adds active tensing while body scan uses pure observation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-relax-sleep-hygiene',
      description:
        'PMR is an effective component of a wind-down routine for sleep preparation',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: -0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(-0.2, 0.7),
  },
};
