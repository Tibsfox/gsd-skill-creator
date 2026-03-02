import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cadTechnicalDrawing: RosettaConcept = {
  id: 'engr-cad-technical-drawing',
  name: 'CAD & Technical Drawing',
  domain: 'engineering',
  description:
    'Technical drawing communicates design intent precisely using standardized conventions: ' +
    'orthographic projections (top, front, side views), isometric views, dimensions, tolerances, and material callouts. ' +
    'Computer-Aided Design (CAD) has largely replaced manual drafting but the underlying principles are the same. ' +
    'CAD enables 3D modeling, simulation, and direct manufacturing file generation. ' +
    'Technical drawing literacy is essential for reading engineering documentation and communicating designs.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-rapid-prototyping',
      description: 'CAD models are the digital precursor to physical prototypes and the source file for 3D printing',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.5625 + 0.1225),
    angle: Math.atan2(0.35, 0.75),
  },
};
