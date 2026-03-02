import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const engineeringDesignProcess: RosettaConcept = {
  id: 'engr-engineering-design-process',
  name: 'Engineering Design Process',
  domain: 'engineering',
  description:
    'The engineering design process is an iterative cycle for solving technical problems. ' +
    'Phases: Define problem → Research → Brainstorm solutions → Select best solution → Build prototype → ' +
    'Test and evaluate → Improve → Communicate results. ' +
    'Unlike scientific method (which discovers truth), engineering design creates solutions to human needs. ' +
    'Constraints (budget, time, materials, regulations) define the design space; optimization finds the best solution within it.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
