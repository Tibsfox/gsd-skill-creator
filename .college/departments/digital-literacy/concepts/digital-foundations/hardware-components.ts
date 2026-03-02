import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hardwareComponents: RosettaConcept = {
  id: 'diglit-hardware-components',
  name: 'Hardware Components & Functions',
  domain: 'digital-literacy',
  description: 'The physical parts of a computer and what each does. CPU (Central Processing Unit): ' +
    'executes instructions -- the "brain." Clock speed (GHz) = instructions per second. ' +
    'RAM (Random Access Memory): fast, temporary storage for programs currently running. ' +
    'Storage (HDD/SSD): permanent storage for files and programs. SSD is 10-100x faster than HDD. ' +
    'GPU (Graphics Processing Unit): parallel processor for graphics and machine learning. ' +
    'Motherboard: connects all components. Power supply: converts wall power to component voltages. ' +
    'The key insight: hardware is an abstraction stack -- each layer hides details from the layer above. ' +
    'Understanding hardware helps diagnose performance problems: slow startup = storage issue, ' +
    'sluggish multitasking = RAM issue, slow rendering = GPU issue.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-operating-systems',
      description: 'Operating systems manage hardware resources -- you need to know what hardware exists to understand what OS manages',
    },
    {
      type: 'cross-reference',
      targetId: 'code-abstraction',
      description: 'Hardware layers are abstractions: CPU hides transistors, OS hides CPU instructions, Python hides machine code',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
