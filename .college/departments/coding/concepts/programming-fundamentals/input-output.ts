import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const inputOutput: RosettaConcept = {
  id: 'code-input-output',
  name: 'Input & Output',
  domain: 'coding',
  description: 'Programs are useful because they transform inputs into outputs. ' +
    'Input sources: keyboard, files, network, databases, sensors, APIs. ' +
    'Output destinations: screen, files, network, databases, speakers, actuators. ' +
    'The input-process-output (IPO) model is the simplest description of any program. ' +
    'stdin/stdout (standard input/output) are the Unix primitives that enable pipe composition: ' +
    'cat file.txt | grep "error" | wc -l. ' +
    'GUI programs map events (clicks, key presses) to handler functions. ' +
    'Understanding the I/O boundary is the first step in designing any program.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'code-variables-data-types',
      description: 'Input is stored in variables; output is produced from variable values',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-networks-internet',
      description: 'Network I/O is the same concept as local I/O but routed through protocols',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
