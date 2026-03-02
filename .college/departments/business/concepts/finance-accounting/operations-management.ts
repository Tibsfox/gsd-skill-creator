import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const operationsManagement: RosettaConcept = {
  id: 'bus-operations-management',
  name: 'Operations Management',
  domain: 'business',
  description:
    'Operations management oversees the processes that transform inputs into products and services. ' +
    'Key concepts: process efficiency, throughput, bottleneck analysis (Theory of Constraints), ' +
    'inventory management (JIT, EOQ), quality management (TQM, Six Sigma), and supply chain management. ' +
    'Operations connects strategy to execution: the best strategy fails without efficient, reliable operations.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-business-finance',
      description: 'Operations investments (equipment, systems) are capital budgeting decisions in business finance',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.3025 + 0.4225),
    angle: Math.atan2(0.65, 0.55),
  },
};
