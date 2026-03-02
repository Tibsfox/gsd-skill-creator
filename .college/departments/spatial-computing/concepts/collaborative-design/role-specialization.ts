import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const roleSpecialization: RosettaConcept = {
  id: 'spatial-role-specialization',
  name: 'Role Specialization',
  domain: 'spatial-computing',
  description:
    'Large collaborative builds benefit from specialization rather than everyone doing everything. ' +
    'Architect role: defines the build plan, chooses material palette, makes structural decisions, ' +
    'sets height and style guidelines for all builders to follow. ' +
    'Engineer role: designs and implements redstone systems, automated farms, and infrastructure. ' +
    'Resource gatherer: dedicates time to mining, tree farming, and trading to supply materials. ' +
    'Decorator/detailer: adds depth to walls, plants, furniture, and lighting after structure is complete. ' +
    'Role division prevents the "too many cooks" problem where conflicting block placements require ' +
    'constant reverting. Communication structures mirror software engineering: ' +
    'architects are like system designers, engineers are like developers, detailers are like UI designers. ' +
    'Handoffs between roles require clear acceptance criteria: "wall structure is complete when all ' +
    'exterior surfaces are placed and approved by architect before detailer begins."',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'spatial-server-project-planning',
      description: 'Role assignments must be established during project planning before construction begins',
    },
    {
      type: 'cross-reference',
      targetId: 'spatial-iterative-build-process',
      description: 'Roles coordinate iteration cycles -- architect reviews, builders iterate, detailers refine',
    },
  ],
  complexPlanePosition: {
    real: 0.48,
    imaginary: 0.68,
    magnitude: Math.sqrt(0.48 ** 2 + 0.68 ** 2),
    angle: Math.atan2(0.68, 0.48),
  },
};
