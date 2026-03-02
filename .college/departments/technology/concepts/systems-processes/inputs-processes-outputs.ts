import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const inputsProcessesOutputs: RosettaConcept = {
  id: 'tech-inputs-processes-outputs',
  name: 'Inputs, Processes & Outputs',
  domain: 'technology',
  description:
    'Every technological system transforms inputs into outputs through processes. ' +
    'Inputs include materials, energy, information, and human effort. ' +
    'Processes include mechanical transformation, chemical change, information processing, and energy conversion. ' +
    'Outputs include products, waste, information, and energy. ' +
    'The IPO (Input-Process-Output) model is the foundational framework for analyzing any technological system, ' +
    'from a hand saw to a manufacturing plant to a computer program.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
