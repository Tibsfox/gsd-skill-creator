import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Rehabilitation Applications
 *
 * Pilates-based rehabilitation for common postural and movement
 * dysfunctions: anterior pelvic tilt, thoracic kyphosis, weak
 * gluteal muscles, and RSI in wrists/forearms.
 */
export const rehabApplications: RosettaConcept = {
  id: 'mb-pilates-rehab-applications',
  name: 'Rehabilitation Applications',
  domain: 'mind-body',
  description:
    'Pilates has particular relevance for rehabilitation of common postural and movement ' +
    'dysfunctions. Joseph Pilates developed his method partly during WWI, where he used springs ' +
    'and hospital bed frames to rehabilitate injured and immobilized soldiers -- the origin of ' +
    'the Pilates apparatus. This rehabilitation lineage continues today in clinical settings. ' +
    'Anterior pelvic tilt (from prolonged sitting): the hip flexors shorten and pull the ' +
    'pelvis forward, creating excessive lumbar curve. Treatment: strengthen deep abdominals ' +
    'and glutes (Roll-Up, Hundred); stretch hip flexors (lunging stretches); develop awareness ' +
    'of neutral pelvic position. ' +
    'Thoracic kyphosis (rounded upper back from desk work): the upper back rounds excessively, ' +
    'shoulders protract, head pushes forward. Treatment: extension exercises (Swan, Swimming); ' +
    'shoulder blade stabilization; chest opening. ' +
    'Weak gluteal muscles (from sitting): the glutes become lengthened and inhibited from ' +
    'prolonged sitting ("gluteal amnesia"). Treatment: bridge variations, leg circles, Side ' +
    'Kick Series -- exercises that re-activate the glutes as primary hip extensors. ' +
    'RSI in wrists and forearms (from typing/mouse use): repetitive strain from sustained ' +
    'static postures. Treatment: wrist stretches, forearm strengthening, posture correction ' +
    'to reduce downstream loading. Pilates exercises that load the wrists (Plank, Push-Up) ' +
    'should be modified with fists or forearm support if wrist pain is present. ' +
    'Per the Pilates Method Alliance (PMA) standards, Pilates teachers are not medical ' +
    'practitioners. Rehabilitation applications work best in coordination with healthcare providers. ' +
    'Cultural context: Joseph Pilates (1883-1967, Germany/United States) developed the method ' +
    'from an engineering mindset -- the body as a precision instrument with specific mechanical ' +
    'requirements. Originally called Contrology.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-neutral-spine',
      description: 'Most rehabilitation protocols begin with establishing neutral spine awareness as the foundation for corrective exercise',
    },
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'Core stabilization through Powerhouse activation is the prerequisite for all rehabilitation exercises',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-corpse-savasana',
      description: 'Recovery and relaxation practices complement active rehabilitation -- the body heals during rest',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
