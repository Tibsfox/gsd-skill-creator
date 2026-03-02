import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const projectPlanning: RosettaConcept = {
  id: 'trade-project-planning',
  name: 'Project Planning',
  domain: 'trades',
  description:
    'Trades project planning transforms an idea into a sequence of executable steps. ' +
    'Scope definition: what exactly will be built or repaired? Clear scope prevents scope creep. ' +
    'Materials takeoff (quantity estimation): create a cut list with dimensions and quantities; ' +
    'add 10-15% waste factor for lumber cuts; round hardware quantities up. ' +
    'Sequencing operations: work from rough to fine (framing before finish work); ' +
    'what must be done before the next step can start? ' +
    'The critical path is the sequence of steps that determines overall project duration. ' +
    'Budget: get materials quotes before committing; add 20% contingency for unforeseen issues. ' +
    'Timeline: estimate each step with a multiplier of 1.5-2x for first-time projects. ' +
    'Documentation: take photos during disassembly to guide reassembly; ' +
    'save receipts and warranties. ' +
    'Quality check at each stage before proceeding -- mistakes found early cost 10x less to fix ' +
    'than mistakes found after later stages are complete.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-woodworking-basics',
      description: 'Project planning is applied to woodworking and other trades to coordinate materials and sequence',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
