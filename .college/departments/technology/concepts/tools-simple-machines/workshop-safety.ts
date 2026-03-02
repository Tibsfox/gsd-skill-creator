import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const workshopSafety: RosettaConcept = {
  id: 'tech-workshop-safety',
  name: 'Workshop Safety',
  domain: 'technology',
  description:
    'Workshop safety requires identifying hazards, using appropriate PPE, and establishing safe work habits. ' +
    'Hazard categories: mechanical (rotating blades, pinch points), electrical (shock, arc flash), ' +
    'chemical (solvents, adhesives, fumes), thermal (hot surfaces, sparks), and ergonomic (repetitive strain). ' +
    'OSHA hazard hierarchy: eliminate → substitute → engineering controls → administrative controls → PPE. ' +
    'Safety is a design problem, not just a compliance checkbox — good workshops are designed to make accidents unlikely.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-power-tools',
      description: 'Power tool use is the highest-risk activity in most workshops — safety protocols are most critical here',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
