import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const optics: RosettaConcept = {
  id: 'phys-optics',
  name: 'Optics: Reflection & Refraction',
  domain: 'physics',
  description:
    'Optics studies how light interacts with matter. Reflection: angle of incidence equals angle of ' +
    'reflection, producing images in mirrors. Refraction: light bends when changing media (Snell\'s law), ' +
    'causing lenses to converge or diverge light. Total internal reflection enables fiber optics. ' +
    'Lenses form images in cameras, telescopes, microscopes, and the human eye.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-electromagnetic-spectrum',
      description: 'Optics studies the visible portion of the electromagnetic spectrum',
    },
    {
      type: 'cross-reference',
      targetId: 'math-trigonometry',
      description: 'Snell\'s law of refraction uses trigonometry (sine of angles) to describe bending',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
