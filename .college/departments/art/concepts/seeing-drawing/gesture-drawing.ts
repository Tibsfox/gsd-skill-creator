import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const gestureDrawing: RosettaConcept = {
  id: 'art-gesture-drawing',
  name: 'Gesture Drawing',
  domain: 'art',
  description:
    'Gesture drawing captures the essence of movement, weight, and energy of a subject ' +
    'in a rapid sketch (30 seconds to 2 minutes). Unlike contour drawing which traces edges, ' +
    'gesture drawing moves through the form, following the line of action -- the primary ' +
    'thrust of movement through the body or object. Artists use gesture drawings as ' +
    'warm-ups, to capture spontaneous poses, and as the structural armature beneath ' +
    'finished figure drawings. The C-curve, S-curve, and straight line are the three ' +
    'gesture archetypes that underlie all figure poses.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'art-contour-drawing',
      description: 'Gesture is about movement and energy while contour captures static edges',
    },
    {
      type: 'dependency',
      targetId: 'art-observational-drawing',
      description: 'Gesture drawing is a form of rapid observational practice',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(0.2, 0.7),
  },
};
