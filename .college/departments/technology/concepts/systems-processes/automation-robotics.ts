import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const automationRobotics: RosettaConcept = {
  id: 'tech-automation-robotics',
  name: 'Automation & Robotics',
  domain: 'technology',
  description:
    'Automation uses machines to perform tasks with minimal human intervention. ' +
    'Fixed automation (dedicated machinery) handles high-volume, single-product lines. ' +
    'Flexible automation (CNC, robots) handles varying products. ' +
    'Industrial robots are programmable manipulators for welding, painting, assembly, and material handling. ' +
    'Collaborative robots (cobots) work safely alongside humans. ' +
    'Automation displaces routine physical and cognitive labor while creating demand for maintenance and programming skills.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-feedback-control',
      description: 'Robotic systems rely on feedback control loops to achieve precise positioning and motion control',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
